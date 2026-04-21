import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  exchangeCodeForToken,
  exchangeForLongLivedToken,
  findInstagramBusinessAccount,
} from "@/lib/meta-oauth";

/**
 * Callback de OAuth Meta. Intercambia code → long-lived token, resuelve
 * IG Business Account ID, upserta el CreatorSocialProfile con el token
 * y redirige a /mi-espacio/perfil/metricas?connected=1.
 */
export async function GET(req: NextRequest) {
  const base = process.env.AUTH_URL ?? "http://localhost:3000";
  const home = (error?: string, success?: boolean) => {
    const params = new URLSearchParams();
    if (error) params.set("error", error);
    if (success) params.set("connected", "1");
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
  const metaError = searchParams.get("error");

  if (metaError) return home(`meta_${metaError}`);
  if (!code || !state) return home("missing_code");

  const savedState = req.cookies.get("meta_oauth_state")?.value;
  if (!savedState || savedState !== state) return home("bad_state");

  const creator = await prisma.creator.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!creator) return home("no_creator_profile");

  try {
    const shortLived = await exchangeCodeForToken(code);
    const longLived = await exchangeForLongLivedToken(shortLived.access_token);
    const igAccount = await findInstagramBusinessAccount(longLived.access_token);
    if (!igAccount) return home("no_ig_business_account");

    const expiresAt = new Date(Date.now() + longLived.expires_in * 1000);

    await prisma.creatorSocialProfile.upsert({
      where: {
        creatorId_platform: {
          creatorId: creator.id,
          platform: "INSTAGRAM",
        },
      },
      create: {
        creatorId: creator.id,
        platform: "INSTAGRAM",
        handle: igAccount.igUsername,
        url: `https://instagram.com/${igAccount.igUsername}`,
        externalId: igAccount.igBusinessId,
        accessToken: longLived.access_token,
        tokenExpiresAt: expiresAt,
        connectedAt: new Date(),
        disconnectedAt: null,
      },
      update: {
        handle: igAccount.igUsername,
        url: `https://instagram.com/${igAccount.igUsername}`,
        externalId: igAccount.igBusinessId,
        accessToken: longLived.access_token,
        tokenExpiresAt: expiresAt,
        connectedAt: new Date(),
        disconnectedAt: null,
      },
    });

    const res = home(undefined, true);
    res.cookies.delete("meta_oauth_state");
    return res;
  } catch (err) {
    console.error("[oauth/instagram/callback] error:", err);
    return home("token_exchange_failed");
  }
}
