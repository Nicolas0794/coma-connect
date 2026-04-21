"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requireInternalRole } from "@/lib/require-role";
import {
  sendBrandApprovedEmail,
  sendBrandRejectedEmail,
} from "@/lib/email";

async function guard() {
  await requireInternalRole();
  const session = await auth();
  return session!.user!.id!;
}

export async function approveLead(formData: FormData) {
  const actorId = await guard();
  const id = String(formData.get("id") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;
  if (!id) redirect("/leads-marcas?error=missing");

  const lead = await prisma.brandLead.findUnique({ where: { id } });
  if (!lead) redirect("/leads-marcas?error=notfound");
  if (lead.status === "APPROVED") redirect("/leads-marcas?error=already");

  // Crear/actualizar invitación en whitelist con rol CLIENT.
  await prisma.invitedEmail.upsert({
    where: { email: lead.contactEmail },
    create: {
      email: lead.contactEmail,
      role: "CLIENT",
      invitedBy: actorId,
      note: `Lead de ${lead.brandName}`,
    },
    update: { role: "CLIENT", usedAt: null, note: `Lead de ${lead.brandName}` },
  });

  await prisma.brandLead.update({
    where: { id },
    data: {
      status: "APPROVED",
      reviewedBy: actorId,
      reviewedAt: new Date(),
      notes,
    },
  });

  // Email fire-and-forget (si falla, el lead igual queda aprobado).
  sendBrandApprovedEmail({
    email: lead.contactEmail,
    contactName: lead.contactName,
    brandName: lead.brandName,
  }).catch((err) => console.error("[leads] sendBrandApprovedEmail failed:", err));

  revalidatePath("/leads-marcas");
  redirect(`/leads-marcas?done=approved&brand=${encodeURIComponent(lead.brandName)}`);
}

export async function rejectLead(formData: FormData) {
  const actorId = await guard();
  const id = String(formData.get("id") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;
  if (!id) redirect("/leads-marcas?error=missing");

  const lead = await prisma.brandLead.findUnique({ where: { id } });
  if (!lead) redirect("/leads-marcas?error=notfound");

  await prisma.brandLead.update({
    where: { id },
    data: {
      status: "REJECTED",
      reviewedBy: actorId,
      reviewedAt: new Date(),
      notes,
    },
  });

  sendBrandRejectedEmail({
    email: lead.contactEmail,
    contactName: lead.contactName,
    brandName: lead.brandName,
    reason: notes ?? undefined,
  }).catch((err) => console.error("[leads] sendBrandRejectedEmail failed:", err));

  revalidatePath("/leads-marcas");
  redirect("/leads-marcas?done=rejected");
}

export async function markContacted(formData: FormData) {
  const actorId = await guard();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.brandLead.update({
    where: { id },
    data: {
      status: "CONTACTED",
      reviewedBy: actorId,
      reviewedAt: new Date(),
    },
  });
  revalidatePath("/leads-marcas");
}
