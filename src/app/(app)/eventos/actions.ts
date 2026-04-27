"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { syncEventSpeaker, syncEventAttended } from "@/lib/nation-triggers";

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

export async function createEvent(formData: FormData) {
  await requireAdminOrTeam();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect("/eventos/nuevo?error=name");

  const slug = slugify(name) + "-" + Math.random().toString(36).slice(2, 6);
  const startAtStr = String(formData.get("startAt") ?? "");
  const endAtStr = String(formData.get("endAt") ?? "");

  const event = await prisma.event.create({
    data: {
      slug,
      name,
      description: String(formData.get("description") ?? "").trim() || null,
      type: (String(formData.get("type") ?? "MEETUP")) as
        | "MEETUP"
        | "WORKSHOP"
        | "PANEL"
        | "PARTY"
        | "CONFERENCE"
        | "WEBINAR",
      city: String(formData.get("city") ?? "").trim() || null,
      venue: String(formData.get("venue") ?? "").trim() || null,
      startAt: startAtStr ? new Date(startAtStr) : new Date(),
      endAt: endAtStr ? new Date(endAtStr) : null,
      capacity: parseInt(String(formData.get("capacity") ?? "0")) || null,
      status: "DRAFT",
    },
  });

  revalidatePath("/eventos");
  redirect(`/eventos/${event.id}`);
}

export async function updateEvent(eventId: string, formData: FormData) {
  await requireAdminOrTeam();
  const startAtStr = String(formData.get("startAt") ?? "");
  const endAtStr = String(formData.get("endAt") ?? "");

  await prisma.event.update({
    where: { id: eventId },
    data: {
      name: String(formData.get("name") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim() || null,
      type: (String(formData.get("type") ?? "MEETUP")) as
        | "MEETUP"
        | "WORKSHOP"
        | "PANEL"
        | "PARTY"
        | "CONFERENCE"
        | "WEBINAR",
      status: (String(formData.get("status") ?? "DRAFT")) as
        | "DRAFT"
        | "PUBLISHED"
        | "CANCELLED"
        | "COMPLETED",
      city: String(formData.get("city") ?? "").trim() || null,
      venue: String(formData.get("venue") ?? "").trim() || null,
      startAt: startAtStr ? new Date(startAtStr) : new Date(),
      endAt: endAtStr ? new Date(endAtStr) : null,
      capacity: parseInt(String(formData.get("capacity") ?? "0")) || null,
    },
  });

  revalidatePath("/eventos");
  revalidatePath(`/eventos/${eventId}`);
}

export async function addSpeaker(eventId: string, formData: FormData) {
  await requireAdminOrTeam();
  const userId = String(formData.get("userId") ?? "").trim();
  const role = (String(formData.get("role") ?? "SPEAKER")) as
    | "SPEAKER"
    | "PANELIST"
    | "HOST"
    | "SPECIAL_GUEST";
  if (!userId) return;

  const existing = await prisma.eventSpeaker.findUnique({
    where: { eventId_userId: { eventId, userId } },
  });

  const speaker = existing
    ? await prisma.eventSpeaker.update({ where: { id: existing.id }, data: { role } })
    : await prisma.eventSpeaker.create({ data: { eventId, userId, role } });

  await syncEventSpeaker(speaker.id);
  revalidatePath(`/eventos/${eventId}`);
}

export async function removeSpeaker(eventId: string, speakerId: string) {
  await requireAdminOrTeam();
  await prisma.eventSpeaker.delete({ where: { id: speakerId } });
  revalidatePath(`/eventos/${eventId}`);
}

export async function markAttended(eventId: string, registrationId: string) {
  await requireAdminOrTeam();
  await prisma.eventRegistration.update({
    where: { id: registrationId },
    data: { status: "ATTENDED", attendedAt: new Date() },
  });
  await syncEventAttended(registrationId);
  revalidatePath(`/eventos/${eventId}`);
}
