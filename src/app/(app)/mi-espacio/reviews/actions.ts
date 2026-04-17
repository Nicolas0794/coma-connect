"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { recomputeCreatorRating } from "@/lib/creator-triggers";

async function requireCreator() {
  const session = await auth();
  if (session?.user?.role !== "CREATOR") redirect("/");
  const creator = await prisma.creator.findUnique({
    where: { userId: session.user.id! },
    select: { id: true },
  });
  if (!creator) redirect("/mi-espacio");
  return creator;
}

export async function respondToReview(formData: FormData) {
  const creator = await requireCreator();
  const id = formData.get("id") as string;
  const response = ((formData.get("response") as string) ?? "").trim();
  if (!id || !response) return;

  const review = await prisma.creatorReview.findFirst({
    where: { id, creatorId: creator.id },
  });
  if (!review) return;

  await prisma.creatorReview.update({
    where: { id },
    data: { creatorResponse: response, creatorResponseAt: new Date() },
  });
  revalidatePath("/mi-espacio/reviews");
}

export async function toggleReviewPublic(formData: FormData) {
  const creator = await requireCreator();
  const id = formData.get("id") as string;
  const review = await prisma.creatorReview.findFirst({
    where: { id, creatorId: creator.id },
    select: { id: true, isPublic: true },
  });
  if (!review) return;

  await prisma.creatorReview.update({
    where: { id },
    data: { isPublic: !review.isPublic },
  });
  await recomputeCreatorRating(creator.id);
  revalidatePath("/mi-espacio/reviews");
}
