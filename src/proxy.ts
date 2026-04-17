import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

// Rutas que no requieren autenticación (login, registro, layer pública Connect)
const publicPrefixes = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/talento",
  "/c/",
  "/@",
  "/sitemap.xml",
  "/robots.txt",
];

function isPublicPath(pathname: string): boolean {
  if (pathname === "/c" || pathname === "/talento") return true;
  return publicPrefixes.some((prefix) => pathname.startsWith(prefix));
}

export default auth((req) => {
  const isAuthed = !!req.auth;
  const { pathname } = req.nextUrl;

  if (!isAuthed && !isPublicPath(pathname)) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isAuthed && pathname === "/login") {
    return NextResponse.redirect(new URL("/", req.url));
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.jpg$|.*\\.ico$).*)"],
};
