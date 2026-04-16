import { prisma } from "@/lib/prisma";

interface SocialMetrics {
  followers: number;
  following?: number;
  posts?: number;
  avgEngagement?: number;
}

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function parseCompactNumber(str: string): number {
  const cleaned = str.replace(/,/g, "").trim();
  return parseInt(cleaned) || 0;
}

async function fetchInstagramMetrics(
  handle: string
): Promise<SocialMetrics | null> {
  try {
    const res = await fetch(`https://www.instagram.com/${encodeURIComponent(handle)}/`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        "Accept": "text/html",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;
    const html = await res.text();

    const match = html.match(
      /content="([\d,.]+)\s+Followers?,\s*([\d,.]+)\s+Following,\s*([\d,.]+)\s+Posts?/i
    );
    if (!match) return null;

    return {
      followers: parseCompactNumber(match[1]),
      following: parseCompactNumber(match[2]),
      posts: parseCompactNumber(match[3]),
    };
  } catch {
    return null;
  }
}

async function fetchTikTokMetrics(
  handle: string
): Promise<SocialMetrics | null> {
  try {
    const cleanHandle = handle.replace("@", "");
    const res = await fetch(`https://www.tiktok.com/@${encodeURIComponent(cleanHandle)}`, {
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;

    const html = await res.text();

    // Extraer stats del JSON embebido en el HTML
    const statsMatch = html.match(
      /"stats":\{"followerCount":(\d+),"followingCount":(\d+),"heart":(\d+),"heartCount":(-?\d+),"videoCount":(\d+)/
    );
    if (!statsMatch) return null;

    const followers = parseInt(statsMatch[1]);
    const following = parseInt(statsMatch[2]);
    const posts = parseInt(statsMatch[5]);
    const hearts = parseInt(statsMatch[3]);

    let avgEngagement: number | undefined;
    if (followers > 0 && posts > 0) {
      avgEngagement =
        Math.round((hearts / posts / followers) * 10000) / 100;
    }

    return { followers, following, posts, avgEngagement };
  } catch {
    return null;
  }
}

export async function verifySocialProfile(
  profileId: string
): Promise<SocialMetrics | null> {
  const profile = await prisma.creatorSocialProfile.findUnique({
    where: { id: profileId },
  });
  if (!profile) return null;

  const metrics =
    profile.platform === "INSTAGRAM"
      ? await fetchInstagramMetrics(profile.handle)
      : await fetchTikTokMetrics(profile.handle);

  if (!metrics) return null;

  await prisma.creatorSocialProfile.update({
    where: { id: profileId },
    data: {
      verifiedFollowers: metrics.followers,
      verifiedEngagement: metrics.avgEngagement ?? null,
      verifiedAt: new Date(),
    },
  });

  return metrics;
}

export async function verifyCreatorProfiles(creatorId: string) {
  const profiles = await prisma.creatorSocialProfile.findMany({
    where: { creatorId },
  });

  const results = await Promise.allSettled(
    profiles.map((p) => verifySocialProfile(p.id))
  );

  return results.map((r, i) => ({
    platform: profiles[i].platform,
    handle: profiles[i].handle,
    metrics: r.status === "fulfilled" ? r.value : null,
  }));
}
