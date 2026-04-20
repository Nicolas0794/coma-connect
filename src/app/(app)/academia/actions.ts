"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdminOrTeam() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "TEAM")) {
    redirect("/");
  }
  return session.user;
}

function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createCourse(formData: FormData) {
  await requireAdminOrTeam();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) redirect("/academia/nuevo?error=title");

  const slug = slugify(title);
  const summary = String(formData.get("summary") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim() || null;
  const level = (String(formData.get("level") ?? "BEGINNER")) as
    | "BEGINNER"
    | "INTERMEDIATE"
    | "ADVANCED";
  const durationMin = parseInt(String(formData.get("durationMin") ?? "0")) || null;

  const course = await prisma.course.create({
    data: { slug, title, summary, description, level, durationMin, status: "DRAFT" },
  });

  revalidatePath("/academia");
  redirect(`/academia/${course.id}`);
}

export async function updateCourse(courseId: string, formData: FormData) {
  await requireAdminOrTeam();
  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim() || null;
  const level = (String(formData.get("level") ?? "BEGINNER")) as
    | "BEGINNER"
    | "INTERMEDIATE"
    | "ADVANCED";
  const status = (String(formData.get("status") ?? "DRAFT")) as
    | "DRAFT"
    | "PUBLISHED"
    | "ARCHIVED";
  const durationMin = parseInt(String(formData.get("durationMin") ?? "0")) || null;

  await prisma.course.update({
    where: { id: courseId },
    data: {
      title,
      summary,
      description,
      level,
      status,
      durationMin,
      publishedAt: status === "PUBLISHED" ? new Date() : null,
    },
  });

  revalidatePath("/academia");
  revalidatePath(`/academia/${courseId}`);
}

export async function addModule(courseId: string, formData: FormData) {
  await requireAdminOrTeam();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const lastModule = await prisma.courseModule.findFirst({
    where: { courseId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  await prisma.courseModule.create({
    data: {
      courseId,
      title,
      summary: String(formData.get("summary") ?? "").trim() || null,
      order: (lastModule?.order ?? 0) + 1,
    },
  });

  revalidatePath(`/academia/${courseId}`);
}

export async function addLesson(moduleId: string, formData: FormData) {
  await requireAdminOrTeam();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const mod = await prisma.courseModule.findUnique({
    where: { id: moduleId },
    select: { courseId: true },
  });
  if (!mod) return;

  const lastLesson = await prisma.lesson.findFirst({
    where: { moduleId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  await prisma.lesson.create({
    data: {
      moduleId,
      title,
      bodyMd: String(formData.get("bodyMd") ?? "").trim() || null,
      videoUrl: String(formData.get("videoUrl") ?? "").trim() || null,
      durationMin: parseInt(String(formData.get("durationMin") ?? "0")) || null,
      order: (lastLesson?.order ?? 0) + 1,
    },
  });

  revalidatePath(`/academia/${mod.courseId}`);
}

export async function toggleCourseSkill(courseId: string, skillId: string) {
  await requireAdminOrTeam();
  const existing = await prisma.courseSkill.findUnique({
    where: { courseId_skillId: { courseId, skillId } },
  });
  if (existing) {
    await prisma.courseSkill.delete({ where: { id: existing.id } });
  } else {
    await prisma.courseSkill.create({ data: { courseId, skillId } });
  }
  revalidatePath(`/academia/${courseId}`);
}
