import { prisma } from "@/lib/prisma";

// Marca una lección como completada y recalcula el progreso del enrollment.
// Si todas las lecciones del curso quedan completadas, marca enrollment COMPLETED
// y dispara syncCourseCompleted.
export async function markLessonCompleted(enrollmentId: string, lessonId: string) {
  await prisma.lessonProgress.upsert({
    where: { enrollmentId_lessonId: { enrollmentId, lessonId } },
    update: {},
    create: { enrollmentId, lessonId },
  });

  const enrollment = await prisma.courseEnrollment.findUnique({
    where: { id: enrollmentId },
    select: { id: true, userId: true, courseId: true, status: true },
  });
  if (!enrollment) return;

  const totalLessons = await prisma.lesson.count({
    where: { module: { courseId: enrollment.courseId } },
  });
  const completedLessons = await prisma.lessonProgress.count({
    where: { enrollmentId },
  });

  const progressPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const isComplete = totalLessons > 0 && completedLessons >= totalLessons;

  await prisma.courseEnrollment.update({
    where: { id: enrollmentId },
    data: {
      progressPct,
      status: isComplete ? "COMPLETED" : "IN_PROGRESS",
      completedAt: isComplete && enrollment.status !== "COMPLETED" ? new Date() : undefined,
    },
  });

  if (isComplete && enrollment.status !== "COMPLETED") {
    await syncCourseCompleted(enrollmentId);
  }
}

// Hook: al completar un curso, crea Certificate + UserAchievement + CreatorSkill(s)
export async function syncCourseCompleted(enrollmentId: string) {
  const enrollment = await prisma.courseEnrollment.findUnique({
    where: { id: enrollmentId },
    select: {
      id: true,
      userId: true,
      completedAt: true,
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          skills: { select: { skillId: true, skill: { select: { name: true } } } },
        },
      },
    },
  });
  if (!enrollment) return;

  const issuedAt = enrollment.completedAt ?? new Date();
  const skillNames = enrollment.course.skills.map((s) => s.skill.name);

  // Certificado (uno por enrollment)
  await prisma.certificate.upsert({
    where: { enrollmentId: enrollment.id },
    update: { skillsEarned: skillNames },
    create: {
      enrollmentId: enrollment.id,
      userId: enrollment.userId,
      skillsEarned: skillNames,
      issuedAt,
    },
  });

  // Marcar skills del curso como adquiridas por el user (si no existen)
  for (const cs of enrollment.course.skills) {
    await prisma.creatorSkill.upsert({
      where: { userId_skillId: { userId: enrollment.userId, skillId: cs.skillId } },
      update: {},
      create: { userId: enrollment.userId, skillId: cs.skillId, level: 3 },
    });
  }

  // Achievement COURSE_COMPLETED
  const existingCourse = await prisma.userAchievement.findFirst({
    where: {
      userId: enrollment.userId,
      type: "COURSE_COMPLETED",
      sourceId: enrollment.id,
    },
  });
  if (!existingCourse) {
    await prisma.userAchievement.create({
      data: {
        userId: enrollment.userId,
        type: "COURSE_COMPLETED",
        title: enrollment.course.title,
        description: `Curso ${enrollment.course.title} completado`,
        emoji: "🎓",
        sourceId: enrollment.id,
        linkUrl: `/academy/${enrollment.course.slug}`,
        issuedAt,
      },
    });
  }

  // Achievement CERTIFICATE_EARNED (separado, para que aparezca como badge)
  const existingCert = await prisma.userAchievement.findFirst({
    where: {
      userId: enrollment.userId,
      type: "CERTIFICATE_EARNED",
      sourceId: enrollment.id,
    },
  });
  if (!existingCert) {
    await prisma.userAchievement.create({
      data: {
        userId: enrollment.userId,
        type: "CERTIFICATE_EARNED",
        title: `Certificación en ${enrollment.course.title}`,
        description: skillNames.length ? `Skills: ${skillNames.join(", ")}` : null,
        emoji: "🏅",
        sourceId: enrollment.id,
        linkUrl: `/academy/${enrollment.course.slug}`,
        issuedAt,
      },
    });
  }
}
