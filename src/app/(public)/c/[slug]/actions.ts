"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { notifyCreatorNewInquiry } from "@/lib/notifications";
import { createInquirySchema, formToObject } from "@/lib/validators";

export async function createInquiry(formData: FormData) {
  const raw = formToObject(formData);
  const slugFallback = typeof raw.slug === "string" ? raw.slug : "";

  const parsed = createInquirySchema.safeParse(raw);
  if (!parsed.success) {
    redirect(`/c/${slugFallback}?inquiry=validation`);
  }

  const {
    slug,
    brief,
    contactName,
    contactEmail,
    contactPhone,
    budgetCOP,
    deadline,
  } = parsed.data;

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
      contactPhone: contactPhone ?? null,
      brief,
      budgetCOP: budgetCOP ?? null,
      deadline: deadline ?? null,
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
