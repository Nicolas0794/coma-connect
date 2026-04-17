"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { notifyCreatorNewInquiry } from "@/lib/notifications";

export async function createInquiry(formData: FormData) {
  const slug = (formData.get("slug") as string)?.trim();
  const brief = (formData.get("brief") as string)?.trim() ?? "";
  const contactName = (formData.get("contactName") as string)?.trim() ?? "";
  const contactEmail = (formData.get("contactEmail") as string)?.trim().toLowerCase() ?? "";
  const contactPhone = (formData.get("contactPhone") as string)?.trim() || null;
  const budgetRaw = Number(formData.get("budgetCOP"));
  const budgetCOP = Number.isFinite(budgetRaw) && budgetRaw > 0 ? budgetRaw : null;
  const deadlineRaw = (formData.get("deadline") as string)?.trim();
  const deadline = deadlineRaw ? new Date(deadlineRaw) : null;

  if (!slug || !brief || !contactName || !contactEmail) {
    redirect(`/c/${slug}?inquiry=validation`);
  }
  if (brief.length < 20) {
    redirect(`/c/${slug}?inquiry=validation`);
  }

  const creator = await prisma.creator.findUnique({
    where: { slug },
    select: { id: true, fullName: true, email: true, artistName: true },
  });
  if (!creator) redirect("/talento");

  // Si el usuario está logeado como CLIENT, linkear al Client primario
  const session = await auth();
  let clientId: string | null = null;
  if (session?.user?.id) {
    const membership = await prisma.clientMember.findFirst({
      where: { userId: session.user.id },
      orderBy: { isPrimary: "desc" },
      select: { clientId: true },
    });
    clientId = membership?.clientId ?? null;
  }

  const inquiry = await prisma.inquiry.create({
    data: {
      creatorId: creator.id,
      clientId,
      contactName,
      contactEmail,
      contactPhone,
      brief,
      budgetCOP,
      deadline,
      status: "PENDING",
    },
  });

  // Fire-and-forget email
  if (creator.email) {
    notifyCreatorNewInquiry(
      creator.email,
      creator.artistName ?? creator.fullName,
      contactName,
      brief,
      inquiry.id,
    ).catch(() => {});
  }

  redirect(`/c/${slug}?inquiry=sent`);
}
