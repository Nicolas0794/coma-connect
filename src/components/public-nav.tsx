"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const LINKS = [
  { href: "/", label: "Home", match: (p: string) => p === "/" },
  { href: "/talento", label: "Connect", match: (p: string) => p === "/talento" || p.startsWith("/c/") },
  { href: "/nation", label: "Nation", match: (p: string) => p.startsWith("/nation") },
  { href: "/academy", label: "Academy", match: (p: string) => p.startsWith("/academy") },
  { href: "/metodo", label: "Método", match: (p: string) => p === "/metodo" },
];

type SessionUser = {
  name: string;
  email: string;
  role: string;
  image: string | null;
} | null;

function workspaceFor(role: string) {
  if (role === "ADMIN" || role === "TEAM") return { href: "/dashboard", label: "Dashboard" };
  if (role === "CLIENT") return { href: "/portal", label: "Mi portal" };
  if (role === "CREATOR") return { href: "/mi-espacio", label: "Mi espacio" };
  return { href: "/", label: "Inicio" };
}

export function PublicNav({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const workspace = user ? workspaceFor(user.role) : null;
  const initial = (user?.name?.[0] || user?.email?.[0] || "?").toUpperCase();

  return (
    <nav className="flex items-center gap-5 text-sm">
      {LINKS.map((l) => {
        const active = l.match(pathname);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`transition-colors ${
              active
                ? "text-foreground font-semibold border-b-2 border-[#FF4B2C] pb-0.5"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {l.label}
          </Link>
        );
      })}

      {user && workspace ? (
        <>
          <Link
            href={workspace.href}
            className="rounded-full bg-[#FF4B2C] text-white px-4 py-1.5 font-medium hover:opacity-90 transition"
          >
            {workspace.label} →
          </Link>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
              className="flex items-center gap-2 rounded-full border border-border bg-background hover:bg-muted px-1 pr-3 py-1"
              aria-label="Tu cuenta"
            >
              <span className="h-7 w-7 rounded-full bg-gradient-to-br from-[#FF4B2C] to-[#FF7A66] text-white text-xs font-bold flex items-center justify-center">
                {initial}
              </span>
              <span className="text-xs font-medium truncate max-w-[100px]">{user.name || user.email}</span>
              <span className="text-xs text-muted-foreground">▾</span>
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-[calc(100%+6px)] w-56 rounded-xl border border-border bg-background shadow-xl overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-xs text-muted-foreground">Sesión iniciada</p>
                  <p className="text-sm font-medium truncate">{user.email}</p>
                  <p className="text-[11px] uppercase tracking-wider text-[#FF4B2C] font-semibold mt-1">
                    {user.role.toLowerCase()}
                  </p>
                </div>
                <Link
                  href={workspace.href}
                  className="block px-4 py-2.5 text-sm hover:bg-muted"
                >
                  {workspace.label}
                </Link>
                <Link
                  href="/api/auth/signout"
                  className="block px-4 py-2.5 text-sm hover:bg-muted text-destructive border-t border-border"
                >
                  Cerrar sesión
                </Link>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <Link
            href="/soy-creador"
            className="hidden md:inline-block rounded-full border border-border text-foreground px-4 py-1.5 font-medium hover:bg-foreground hover:text-background transition"
          >
            Soy creador/a
          </Link>
          <Link
            href="/soy-marca"
            className="hidden sm:inline-block rounded-full border border-[#FF4B2C] text-[#FF4B2C] px-4 py-1.5 font-medium hover:bg-[#FF4B2C] hover:text-white transition"
          >
            Soy marca
          </Link>
          <Link
            href="/login"
            className="rounded-full bg-foreground px-4 py-1.5 text-background hover:opacity-90"
          >
            Iniciar sesión
          </Link>
        </>
      )}
    </nav>
  );
}
