import { prisma } from "@/lib/prisma";

// Hook: al registrar asistencia efectiva a un evento, crear UserAchievement EVENT_ATTENDED
export async function syncEventAttended(registrationId: string) {
  const reg = await prisma.eventRegistration.findUnique({
    where: { id: registrationId },
    select: {
      id: true,
      userId: true,
      attendedAt: true,
      event: { select: { id: true, slug: true, name: true, startAt: true } },
    },
  });
  if (!reg) return;

  const issuedAt = reg.attendedAt ?? reg.event.startAt ?? new Date();

  const existing = await prisma.userAchievement.findFirst({
    where: {
      userId: reg.userId,
      type: "EVENT_ATTENDED",
      sourceId: reg.event.id,
    },
  });
  if (existing) return;

  await prisma.userAchievement.create({
    data: {
      userId: reg.userId,
      type: "EVENT_ATTENDED",
      title: reg.event.name,
      description: `Asistencia a ${reg.event.name}`,
      emoji: "🎤",
      sourceId: reg.event.id,
      linkUrl: `/nation/${reg.event.slug}`,
      issuedAt,
    },
  });
}

// Hook: al marcar a alguien como speaker de un evento, crear UserAchievement EVENT_SPEAKER
export async function syncEventSpeaker(eventSpeakerId: string) {
  const sp = await prisma.eventSpeaker.findUnique({
    where: { id: eventSpeakerId },
    select: {
      userId: true,
      role: true,
      event: { select: { id: true, slug: true, name: true, startAt: true } },
    },
  });
  if (!sp) return;

  const existing = await prisma.userAchievement.findFirst({
    where: {
      userId: sp.userId,
      type: "EVENT_SPEAKER",
      sourceId: sp.event.id,
    },
  });
  if (existing) return;

  const roleLabel =
    sp.role === "HOST"
      ? "Host"
      : sp.role === "PANELIST"
      ? "Panelista"
      : sp.role === "SPECIAL_GUEST"
      ? "Invitado especial"
      : "Speaker";

  await prisma.userAchievement.create({
    data: {
      userId: sp.userId,
      type: "EVENT_SPEAKER",
      title: `${roleLabel} en ${sp.event.name}`,
      description: `Participó como ${roleLabel.toLowerCase()} en ${sp.event.name}`,
      emoji: "⭐",
      sourceId: sp.event.id,
      linkUrl: `/nation/${sp.event.slug}`,
      issuedAt: sp.event.startAt ?? new Date(),
    },
  });
}
