"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user;
}

export async function registerForEvent(eventId: string) {
  const user = await requireUser();

  const existing = await prisma.eventRegistration.findUnique({
    where: { eventId_userId: { eventId, userId: user.id! } },
  });
  if (existing) {
    if (existing.status === "CANCELLED") {
      await prisma.eventRegistration.update({
        where: { id: existing.id },
        data: { status: "REGISTERED", registeredAt: new Date() },
      });
    }
    return;
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { status: true, capacity: true, slug: true, _count: { select: { registrations: true } } },
  });
  if (!event || event.status !== "PUBLISHED") return;

  const isFull = event.capacity !== null && event._count.registrations >= event.capacity;

  await prisma.eventRegistration.create({
    data: {
      eventId,
      userId: user.id!,
      status: isFull ? "WAITLIST" : "REGISTERED",
    },
  });

  revalidatePath("/mi-espacio/eventos");
  revalidatePath(`/nation/${event.slug}`);
}

export async function cancelRegistration(registrationId: string) {
  const user = await requireUser();
  const reg = await prisma.eventRegistration.findUnique({
    where: { id: registrationId },
    select: { userId: true, event: { select: { slug: true } } },
  });
  if (!reg || reg.userId !== user.id) return;

  await prisma.eventRegistration.update({
    where: { id: registrationId },
    data: { status: "CANCELLED" },
  });

  revalidatePath("/mi-espacio/eventos");
  revalidatePath(`/nation/${reg.event.slug}`);
}
