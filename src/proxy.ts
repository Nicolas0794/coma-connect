import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

// Rutas públicas (no requieren sesión)
const publicPrefixes = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/talento",
  "/c/",
  "/@",
  "/academy",
  "/nation",
  "/metodo",
  "/sumar-marca",
  "/soy-marca",
  "/soy-creador",
  "/sitemap.xml",
  "/robots.txt",
];

function isPublicPath(pathname: string): boolean {
  if (
    pathname === "/" ||
    pathname === "/c" ||
    pathname === "/talento" ||
    pathname === "/academy" ||
    pathname === "/nation" ||
    pathname === "/metodo" ||
    pathname === "/sumar-marca" ||
    pathname === "/soy-marca" ||
    pathname === "/soy-creador"
  ) {
    return true;
  }
  return publicPrefixes.some((prefix) => pathname.startsWith(prefix));
}

// Acceso por rol dentro del dashboard interno (rutas NO públicas)
// ADMIN y TEAM tienen acceso completo; el resto queda restringido a su área.
const ROLE_ALLOWED: Record<string, string[]> = {
  CREATOR: ["/mi-espacio", "/notificaciones"],
  CLIENT: ["/portal", "/notificaciones"],
};

function isAllowedForRole(pathname: string, role: string): boolean {
  if (role === "ADMIN" || role === "TEAM") return true;
  const allowed = ROLE_ALLOWED[role] ?? [];
  return allowed.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/"),
  );
}

function homeForRole(role: string): string {
  if (role === "CREATOR") return "/mi-espacio";
  if (role === "CLIENT") return "/portal";
  if (role === "ADMIN" || role === "TEAM") return "/dashboard";
  return "/login";
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

  // Guard de rol en rutas internas (CRÍTICA-1)
  if (isAuthed && !isPublicPath(pathname)) {
    const role =
      (req.auth?.user as { role?: string } | undefined)?.role ?? "";
    if (!isAllowedForRole(pathname, role)) {
      return NextResponse.redirect(new URL(homeForRole(role), req.url));
    }
  }

  // Exponer pathname al layout para defensa en profundidad
  const res = NextResponse.next();
  res.headers.set("x-pathname", pathname);
  return res;
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.jpg$|.*\\.ico$).*)",
  ],
};
