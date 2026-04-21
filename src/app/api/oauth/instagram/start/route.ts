import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { buildAuthorizeUrl, getMetaConfig } from "@/lib/meta-oauth";
import { randomBytes } from "node:crypto";

/**
 * Inicia el flow OAuth con Meta (Instagram Business).
 * Requiere sesión CREATOR. Genera un state token, lo guarda en cookie
 * httpOnly y redirige a Facebook Login.
 */
export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "CREATOR" || !session.user.id) {
    return NextResponse.redirect(new URL("/login", process.env.AUTH_URL ?? "http://localhost:3000"));
  }

  if (!getMetaConfig()) {
    return NextResponse.redirect(
      new URL(
        "/mi-espacio/perfil?error=meta_unconfigured",
        process.env.AUTH_URL ?? "http://localhost:3000",
      ),
    );
  }

  const state = randomBytes(24).toString("hex");
  const authUrl = buildAuthorizeUrl(state);
  if (!authUrl) {
    return NextResponse.redirect(
      new URL(
        "/mi-espacio/perfil?error=meta_unconfigured",
        process.env.AUTH_URL ?? "http://localhost:3000",
      ),
    );
  }

  const res = NextResponse.redirect(authUrl);
  res.cookies.set("meta_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 10 * 60,
    path: "/api/oauth/instagram",
  });
  return res;
}
