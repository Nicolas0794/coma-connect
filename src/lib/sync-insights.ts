/**
 * Lógica pura de sync de insights — extraída de las server actions para
 * poder invocarla tanto desde la UI (user-initiated) como desde el cron.
 *
 * Cada función:
 *  - Acepta un CreatorSocialProfile con accessToken
 *  - Refreshea si corresponde
 *  - Pulla del API oficial
 *  - Escribe un nuevo SocialInsight + actualiza verifiedFollowers
 *  - Retorna { ok, source, followers } o { ok: false, error }
 */
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import type { CreatorSocialProfile } from "@/generated/prisma/client";
import { fetchInstagramInsights } from "@/lib/meta-insights";
import { fetchTikTokUserInfo } from "@/lib/tiktok-insights";
import { refreshAccessToken as refreshTikTokToken } from "@/lib/tiktok-oauth";

export type SyncResult =
  | { ok: true; platform: string; followers: number | null }
  | { ok: false; platform: string; error: string };

export async function syncInstagramProfile(
  profile: CreatorSocialProfile,
): Promise<SyncResult> {
  if (!profile.accessToken || !profile.externalId) {
    return { ok: false, platform: "INSTAGRAM", error: "not_connected" };
  }
  if (profile.tokenExpiresAt && profile.tokenExpiresAt.getTime() < Date.now()) {
    return { ok: false, platform: "INSTAGRAM", error: "token_expired" };
  }

  const insights = await fetchInstagramInsights(
    profile.externalId,
    profile.accessToken,
  );
  if (!insights) {
    return { ok: false, platform: "INSTAGRAM", error: "pull_failed" };
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

  return { ok: true, platform: "INSTAGRAM", followers: insights.followers };
}

export async function syncTikTokProfile(
  profile: CreatorSocialProfile,
): Promise<SyncResult> {
  if (!profile.accessToken || !profile.refreshToken) {
    return { ok: false, platform: "TIKTOK", error: "not_connected" };
  }

  let accessToken = profile.accessToken;

  // Refresh proactivo si está por expirar o ya expiró
  if (
    profile.tokenExpiresAt &&
    profile.tokenExpiresAt.getTime() < Date.now() + 60_000
  ) {
    try {
      const refreshed = await refreshTikTokToken(profile.refreshToken);
      await prisma.creatorSocialProfile.update({
        where: { id: profile.id },
        data: {
          accessToken: refreshed.access_token,
          refreshToken: refreshed.refresh_token,
          tokenScope: refreshed.scope,
          tokenExpiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
        },
      });
      accessToken = refreshed.access_token;
    } catch (err) {
      console.error("[syncTikTokProfile] refresh falló:", err);
      return { ok: false, platform: "TIKTOK", error: "refresh_failed" };
    }
  }

  const user = await fetchTikTokUserInfo(accessToken);
  if (!user) {
    return { ok: false, platform: "TIKTOK", error: "pull_failed" };
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

  return { ok: true, platform: "TIKTOK", followers: user.followers };
}

/**
 * Sincroniza todos los perfiles conectados que no fueron sincronizados
 * en las últimas `maxAgeHours` horas. Invocable desde cron o admin.
 */
export async function syncStaleInsights({
  maxAgeHours = 24 * 7,
  limit = 50,
}: {
  maxAgeHours?: number;
  limit?: number;
} = {}): Promise<{
  attempted: number;
  ok: number;
  failed: number;
  results: SyncResult[];
}> {
  const staleThreshold = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);

  const profiles = await prisma.creatorSocialProfile.findMany({
    where: {
      accessToken: { not: null },
      disconnectedAt: null,
      OR: [{ lastSyncedAt: null }, { lastSyncedAt: { lt: staleThreshold } }],
    },
    orderBy: { lastSyncedAt: { sort: "asc", nulls: "first" } },
    take: limit,
  });

  const results: SyncResult[] = [];
  for (const profile of profiles) {
    try {
      const result =
        profile.platform === "INSTAGRAM"
          ? await syncInstagramProfile(profile)
          : await syncTikTokProfile(profile);
      results.push(result);
    } catch (err) {
      console.error(
        `[syncStaleInsights] ${profile.platform} ${profile.handle} falló:`,
        err,
      );
      results.push({
        ok: false,
        platform: profile.platform,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const ok = results.filter((r) => r.ok).length;
  return {
    attempted: results.length,
    ok,
    failed: results.length - ok,
    results,
  };
}
