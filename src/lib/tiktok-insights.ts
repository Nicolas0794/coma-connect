/**
 * TikTok Display API — fetch de stats del usuario autenticado.
 *
 * Lo que ES accesible (Display API v2):
 *  - follower_count, following_count, likes_count, video_count
 *  - username, display_name, bio_description, avatar_url
 *  - profile_deep_link (URL al perfil)
 *
 * Lo que NO ES accesible (requiere Research/Marketing API):
 *  - Demografía de audiencia (gender, age, location)
 *  - Reach/impressions a nivel perfil
 *  - Insights por video (views, shares, etc.)
 *
 * Por eso el shape es más pobre que InstagramInsights.
 */

const API_BASE = "https://open.tiktokapis.com/v2";

export interface TikTokUserInfo {
  openId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  profileUrl: string | null;

  followers: number | null;
  following: number | null;
  likes: number | null;
  videoCount: number | null;

  rawPayload: unknown;
}

export async function fetchTikTokUserInfo(
  accessToken: string,
): Promise<TikTokUserInfo | null> {
  const fields = [
    "open_id",
    "username",
    "display_name",
    "avatar_url",
    "bio_description",
    "profile_deep_link",
    "follower_count",
    "following_count",
    "likes_count",
    "video_count",
  ].join(",");

  const res = await fetch(`${API_BASE}/user/info/?fields=${fields}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Cache-Control": "no-cache",
    },
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[tiktok-insights] user/info fallo:", res.status, err);
    return null;
  }

  const data = (await res.json()) as {
    data?: {
      user?: {
        open_id: string;
        username: string;
        display_name: string;
        avatar_url: string;
        bio_description: string;
        profile_deep_link: string;
        follower_count: number;
        following_count: number;
        likes_count: number;
        video_count: number;
      };
    };
    error?: { code: string; message: string };
  };

  if (data.error && data.error.code !== "ok") {
    console.error("[tiktok-insights] API error:", data.error);
    return null;
  }
  const user = data.data?.user;
  if (!user) return null;

  return {
    openId: user.open_id,
    username: user.username,
    displayName: user.display_name,
    avatarUrl: user.avatar_url || null,
    bio: user.bio_description || null,
    profileUrl: user.profile_deep_link || null,
    followers: user.follower_count ?? null,
    following: user.following_count ?? null,
    likes: user.likes_count ?? null,
    videoCount: user.video_count ?? null,
    rawPayload: data,
  };
}
