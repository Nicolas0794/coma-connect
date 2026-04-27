"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { markLessonCompleted } from "@/lib/academy-triggers";

async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user;
}

export async function enrollInCourse(courseId: string) {
  const user = await requireUser();

  const existing = await prisma.courseEnrollment.findUnique({
    where: { userId_courseId: { userId: user.id!, courseId } },
  });
  if (existing) return;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { slug: true, status: true },
  });
  if (!course || course.status !== "PUBLISHED") return;

  await prisma.courseEnrollment.create({
    data: { userId: user.id!, courseId, status: "IN_PROGRESS" },
  });

  revalidatePath("/mi-espacio/academia");
  revalidatePath(`/academy/${course.slug}`);
}

export async function markLessonDone(enrollmentId: string, lessonId: string) {
  const user = await requireUser();
  const enrollment = await prisma.courseEnrollment.findUnique({
    where: { id: enrollmentId },
    select: { userId: true },
  });
  if (!enrollment || enrollment.userId !== user.id) return;

  await markLessonCompleted(enrollmentId, lessonId);
  revalidatePath("/mi-espacio/academia");
  revalidatePath(`/mi-espacio/academia/${enrollmentId}`);
}

export async function updateCreatorSkill(skillId: string, level: number) {
  const user = await requireUser();
  if (level < 1 || level > 5) return;

  await prisma.creatorSkill.upsert({
    where: { userId_skillId: { userId: user.id!, skillId } },
    update: { level },
    create: { userId: user.id!, skillId, level },
  });
  revalidatePath("/mi-espacio/academia");
}

export async function removeCreatorSkill(skillId: string) {
  const user = await requireUser();
  await prisma.creatorSkill.deleteMany({
    where: { userId: user.id!, skillId },
  });
  revalidatePath("/mi-espacio/academia");
}
