"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { syncInstagramProfile, syncTikTokProfile } from "@/lib/sync-insights";

/**
 * Trigger un pull de insights desde Meta Graph. Guarda un nuevo
 * SocialInsight (histórico) + actualiza followers verificados en el
 * CreatorSocialProfile.
 */
export async function syncInstagramInsights() {
  const session = await auth();
  if (session?.user?.role !== "CREATOR") redirect("/");

  const creator = await prisma.creator.findUnique({
    where: { userId: session.user.id! },
    select: { id: true },
  });
  if (!creator) redirect("/mi-espacio");

  const profile = await prisma.creatorSocialProfile.findUnique({
    where: {
      creatorId_platform: { creatorId: creator.id, platform: "INSTAGRAM" },
    },
  });
  if (!profile) redirect("/mi-espacio/perfil/metricas?error=not_connected");

  const result = await syncInstagramProfile(profile);
  if (!result.ok) {
    redirect(`/mi-espacio/perfil/metricas?error=${result.error}`);
  }

  revalidatePath("/mi-espacio/perfil/metricas");
  revalidatePath("/mi-espacio/perfil");
  redirect("/mi-espacio/perfil/metricas?synced=1");
}

export async function disconnectInstagram() {
  const session = await auth();
  if (session?.user?.role !== "CREATOR") redirect("/");

  const creator = await prisma.creator.findUnique({
    where: { userId: session.user.id! },
    select: { id: true },
  });
  if (!creator) redirect("/mi-espacio");

  await prisma.creatorSocialProfile.updateMany({
    where: { creatorId: creator.id, platform: "INSTAGRAM" },
    data: {
      accessToken: null,
      refreshToken: null,
      tokenExpiresAt: null,
      externalId: null,
      disconnectedAt: new Date(),
    },
  });

  revalidatePath("/mi-espacio/perfil/metricas");
  revalidatePath("/mi-espacio/perfil");
  redirect("/mi-espacio/perfil/metricas?disconnected=1");
}

// ─── TikTok ─────────────────────────────────────────────────────────────

export async function syncTikTokInsights() {
  const session = await auth();
  if (session?.user?.role !== "CREATOR") redirect("/");

  const creator = await prisma.creator.findUnique({
    where: { userId: session.user.id! },
    select: { id: true },
  });
  if (!creator) redirect("/mi-espacio");

  const profile = await prisma.creatorSocialProfile.findUnique({
    where: {
      creatorId_platform: { creatorId: creator.id, platform: "TIKTOK" },
    },
  });
  if (!profile) redirect("/mi-espacio/perfil/metricas?error=tt_not_connected");

  const result = await syncTikTokProfile(profile);
  if (!result.ok) {
    redirect(`/mi-espacio/perfil/metricas?error=tt_${result.error}`);
  }

  revalidatePath("/mi-espacio/perfil/metricas");
  revalidatePath("/mi-espacio/perfil");
  redirect("/mi-espacio/perfil/metricas?synced_tt=1");
}

export async function disconnectTikTok() {
  const session = await auth();
  if (session?.user?.role !== "CREATOR") redirect("/");

  const creator = await prisma.creator.findUnique({
    where: { userId: session.user.id! },
    select: { id: true },
  });
  if (!creator) redirect("/mi-espacio");

  await prisma.creatorSocialProfile.updateMany({
    where: { creatorId: creator.id, platform: "TIKTOK" },
    data: {
      accessToken: null,
      refreshToken: null,
      tokenExpiresAt: null,
      externalId: null,
      disconnectedAt: new Date(),
    },
  });

  revalidatePath("/mi-espacio/perfil/metricas");
  revalidatePath("/mi-espacio/perfil");
  redirect("/mi-espacio/perfil/metricas?disconnected_tt=1");
}
