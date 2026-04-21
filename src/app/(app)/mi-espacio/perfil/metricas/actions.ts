"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { fetchInstagramInsights } from "@/lib/meta-insights";
import { fetchTikTokUserInfo } from "@/lib/tiktok-insights";
import { refreshAccessToken } from "@/lib/tiktok-oauth";
import { Prisma } from "@/generated/prisma/client";

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

  if (!profile?.accessToken || !profile.externalId) {
    redirect("/mi-espacio/perfil/metricas?error=not_connected");
  }

  if (
    profile.tokenExpiresAt &&
    profile.tokenExpiresAt.getTime() < Date.now()
  ) {
    redirect("/mi-espacio/perfil/metricas?error=token_expired");
  }

  const insights = await fetchInstagramInsights(
    profile.externalId,
    profile.accessToken,
  );
  if (!insights) {
    redirect("/mi-espacio/perfil/metricas?error=pull_failed");
  }

  await prisma.socialInsight.create({
    data: {
      socialProfileId: profile.id,
      source: "meta-graph",
      followers: insights.followers,
      reach30d: insights.reach30d,
      impressions30d: insights.impressions30d,
      profileViews30d: insights.profileViews30d,
      websiteClicks30d: insights.websiteClicks30d,
      genderFemalePct: insights.genderFemalePct,
      genderMalePct: insights.genderMalePct,
      genderOtherPct: insights.genderOtherPct,
      age13_17Pct: insights.age13_17Pct,
      age18_24Pct: insights.age18_24Pct,
      age25_34Pct: insights.age25_34Pct,
      age35_44Pct: insights.age35_44Pct,
      age45_54Pct: insights.age45_54Pct,
      age55PlusPct: insights.age55PlusPct,
      topCities: (insights.topCities ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      topCountries: (insights.topCountries ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      rawPayload: insights.rawPayload as Prisma.InputJsonValue,
    },
  });

  await prisma.creatorSocialProfile.update({
    where: { id: profile.id },
    data: {
      verifiedFollowers: insights.followers,
      verifiedAt: new Date(),
      lastSyncedAt: new Date(),
    },
  });

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

  let profile = await prisma.creatorSocialProfile.findUnique({
    where: {
      creatorId_platform: { creatorId: creator.id, platform: "TIKTOK" },
    },
  });

  if (!profile?.accessToken || !profile.refreshToken) {
    redirect("/mi-espacio/perfil/metricas?error=tt_not_connected");
  }

  // Si el access token expiró (24h), refreshealo automáticamente.
  if (
    profile.tokenExpiresAt &&
    profile.tokenExpiresAt.getTime() < Date.now() + 60_000
  ) {
    try {
      const refreshed = await refreshAccessToken(profile.refreshToken);
      profile = await prisma.creatorSocialProfile.update({
        where: { id: profile.id },
        data: {
          accessToken: refreshed.access_token,
          refreshToken: refreshed.refresh_token,
          tokenExpiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
          tokenScope: refreshed.scope,
        },
      });
    } catch (err) {
      console.error("[tiktok refresh] falló:", err);
      redirect("/mi-espacio/perfil/metricas?error=tt_refresh_failed");
    }
  }

  const user = await fetchTikTokUserInfo(profile.accessToken!);
  if (!user) {
    redirect("/mi-espacio/perfil/metricas?error=tt_pull_failed");
  }

  await prisma.socialInsight.create({
    data: {
      socialProfileId: profile.id,
      source: "tiktok-display",
      followers: user.followers,
      rawPayload: {
        openId: user.openId,
        username: user.username,
        displayName: user.displayName,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        following: user.following,
        likes: user.likes,
        videoCount: user.videoCount,
      } as Prisma.InputJsonValue,
    },
  });

  await prisma.creatorSocialProfile.update({
    where: { id: profile.id },
    data: {
      verifiedFollowers: user.followers,
      verifiedAt: new Date(),
      lastSyncedAt: new Date(),
    },
  });

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
