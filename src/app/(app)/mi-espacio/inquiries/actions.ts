"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getNextCampaignCode } from "@/lib/campaign-code";
import {
  formToObject,
  inquiryMessageSchema,
  quoteSchema,
} from "@/lib/validators";

async function requireCreator() {
  const session = await auth();
  if (session?.user?.role !== "CREATOR") redirect("/");
  const creator = await prisma.creator.findUnique({
    where: { userId: session.user.id! },
    select: { id: true, fullName: true, userId: true },
  });
  if (!creator) redirect("/mi-espacio");
  return { creator, session };
}

async function getInquiryForCreator(inquiryId: string, creatorId: string) {
  return prisma.inquiry.findFirst({
    where: { id: inquiryId, creatorId },
  });
}

export async function markInquiryViewed(inquiryId: string) {
  const { creator } = await requireCreator();
  const inq = await getInquiryForCreator(inquiryId, creator.id);
  if (!inq || inq.status !== "PENDING") return;

  await prisma.inquiry.update({
    where: { id: inquiryId },
    data: { status: "VIEWED" },
  });
  revalidatePath("/mi-espacio/inquiries");
  revalidatePath(`/mi-espacio/inquiries/${inquiryId}`);
}

export async function sendInquiryMessage(formData: FormData) {
  const { creator, session } = await requireCreator();
  const parsed = inquiryMessageSchema.safeParse(formToObject(formData));
  if (!parsed.success) return;
  const { inquiryId, body } = parsed.data;

  const inq = await getInquiryForCreator(inquiryId, creator.id);
  if (!inq) return;

  await prisma.inquiryMessage.create({
    data: { inquiryId, senderId: session.user!.id!, body },
  });
  revalidatePath(`/mi-espacio/inquiries/${inquiryId}`);
}

export async function sendQuote(formData: FormData) {
  const { creator } = await requireCreator();
  const raw = formToObject(formData);
  const inquiryId = typeof raw.inquiryId === "string" ? raw.inquiryId : "";
  const parsed = quoteSchema.safeParse(raw);
  if (!parsed.success) {
    redirect(`/mi-espacio/inquiries/${inquiryId}?error=validation`);
  }
  const { priceCOP, scope, deliveryDays, terms } = parsed.data;

  const inq = await getInquiryForCreator(parsed.data.inquiryId, creator.id);
  if (!inq) return;

  await prisma.quote.create({
    data: {
      inquiryId: parsed.data.inquiryId,
      priceCOP,
      scope,
      deliveryDays: deliveryDays ?? null,
      terms: terms ?? null,
    },
  });
  await prisma.inquiry.update({
    where: { id: parsed.data.inquiryId },
    data: { status: "QUOTED" },
  });
  revalidatePath(`/mi-espacio/inquiries/${parsed.data.inquiryId}`);
}

export async function declineInquiry(formData: FormData) {
  const { creator } = await requireCreator();
  const inquiryId = formData.get("inquiryId") as string;
  const inq = await getInquiryForCreator(inquiryId, creator.id);
  if (!inq) return;

  await prisma.inquiry.update({
    where: { id: inquiryId },
    data: { status: "REJECTED" },
  });
  redirect("/mi-espacio/inquiries");
}

export async function acceptAndConvertToCampaign(formData: FormData) {
  const { creator } = await requireCreator();
  const inquiryId = formData.get("inquiryId") as string;
  const inq = await prisma.inquiry.findFirst({
    where: { id: inquiryId, creatorId: creator.id },
    include: { quotes: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!inq) return;

  // El cliente puede no estar en la DB (inquiry anónima). Si no hay clientId,
  // creamos un Client mínimo con contactName/email como lead de la marca.
  let clientId = inq.clientId;
  if (!clientId) {
    const leadClient = await prisma.client.create({
      data: {
        name: inq.contactName,
        email: inq.contactEmail,
        phone: inq.contactPhone,
        notes: `Lead generado desde Inquiry pública (Connect). Email: ${inq.contactEmail}`,
      },
    });
    clientId = leadClient.id;
  }

  const code = await getNextCampaignCode();
  const lastQuote = inq.quotes[0];
  const campaignName = `${creator.fullName} × ${inq.contactName}`.slice(0, 80);

  const campaign = await prisma.campaign.create({
    data: {
      clientId,
      code,
      name: campaignName,
      status: "ACTIVE",
      objective: inq.brief.slice(0, 500),
      budget: lastQuote?.priceCOP ?? inq.budgetCOP,
      startDate: new Date(),
      endDate: inq.deadline,
      briefOriginal: inq.brief,
    },
  });

  await prisma.campaignCreator.create({
    data: {
      campaignId: campaign.id,
      creatorId: creator.id,
      status: "ACCEPTED",
      fee: lastQuote?.priceCOP ?? inq.budgetCOP,
      acceptedAt: new Date(),
    },
  });

  await prisma.inquiry.update({
    where: { id: inquiryId },
    data: { status: "CONVERTED_TO_CAMPAIGN", campaignId: campaign.id },
  });

  redirect(`/mi-espacio`);
}
