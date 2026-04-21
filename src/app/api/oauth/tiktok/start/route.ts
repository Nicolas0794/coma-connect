import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { buildAuthorizeUrl, getTikTokConfig } from "@/lib/tiktok-oauth";
import { randomBytes } from "node:crypto";

const base = () => process.env.AUTH_URL ?? "http://localhost:3000";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "CREATOR" || !session.user.id) {
    return NextResponse.redirect(new URL("/login", base()));
  }

  if (!getTikTokConfig()) {
    return NextResponse.redirect(
      new URL("/mi-espacio/perfil/metricas?error=tiktok_unconfigured", base()),
    );
  }

  const state = randomBytes(24).toString("hex");
  const authUrl = buildAuthorizeUrl(state);
  if (!authUrl) {
    return NextResponse.redirect(
      new URL("/mi-espacio/perfil/metricas?error=tiktok_unconfigured", base()),
    );
  }

  const res = NextResponse.redirect(authUrl);
  res.cookies.set("tiktok_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 10 * 60,
    path: "/api/oauth/tiktok",
  });
  return res;
}
