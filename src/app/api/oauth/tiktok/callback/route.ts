import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { exchangeCodeForToken } from "@/lib/tiktok-oauth";
import { fetchTikTokUserInfo } from "@/lib/tiktok-insights";

export async function GET(req: NextRequest) {
  const base = process.env.AUTH_URL ?? "http://localhost:3000";
  const home = (error?: string, success?: boolean) => {
    const params = new URLSearchParams();
    if (error) params.set("error", error);
    if (success) params.set("connected_tt", "1");
    return NextResponse.redirect(
      new URL(`/mi-espacio/perfil/metricas?${params}`, base),
    );
  };

  const session = await auth();
  if (session?.user?.role !== "CREATOR" || !session.user.id) {
    return NextResponse.redirect(new URL("/login", base));
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const tiktokError = searchParams.get("error");

  if (tiktokError) return home(`tt_${tiktokError}`);
  if (!code || !state) return home("tt_missing_code");

  const savedState = req.cookies.get("tiktok_oauth_state")?.value;
  if (!savedState || savedState !== state) return home("tt_bad_state");

  const creator = await prisma.creator.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!creator) return home("no_creator_profile");

  try {
    const token = await exchangeCodeForToken(code);
    const user = await fetchTikTokUserInfo(token.access_token);
    if (!user) return home("tt_user_fetch_failed");

    const expiresAt = new Date(Date.now() + token.expires_in * 1000);

    await prisma.creatorSocialProfile.upsert({
      where: {
        creatorId_platform: {
          creatorId: creator.id,
          platform: "TIKTOK",
        },
      },
      create: {
        creatorId: creator.id,
        platform: "TIKTOK",
        handle: user.username,
        url: user.profileUrl ?? `https://tiktok.com/@${user.username}`,
        externalId: token.open_id,
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        tokenScope: token.scope,
        tokenExpiresAt: expiresAt,
        connectedAt: new Date(),
        disconnectedAt: null,
      },
      update: {
        handle: user.username,
        url: user.profileUrl ?? `https://tiktok.com/@${user.username}`,
        externalId: token.open_id,
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        tokenScope: token.scope,
        tokenExpiresAt: expiresAt,
        connectedAt: new Date(),
        disconnectedAt: null,
      },
    });

    const res = home(undefined, true);
    res.cookies.delete("tiktok_oauth_state");
    return res;
  } catch (err) {
    console.error("[oauth/tiktok/callback] error:", err);
    return home("tt_token_exchange_failed");
  }
}
