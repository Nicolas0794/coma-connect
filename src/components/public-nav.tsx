"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/talento", label: "Connect", match: (p: string) => p === "/talento" || p.startsWith("/c/") },
  { href: "/nation", label: "Nation", match: (p: string) => p.startsWith("/nation") },
  { href: "/academy", label: "Academy", match: (p: string) => p.startsWith("/academy") },
  { href: "/metodo", label: "Método", match: (p: string) => p === "/metodo" },
];

export function PublicNav() {
  const pathname = usePathname();

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
      <Link
        href="/login"
        className="rounded-full bg-foreground px-4 py-1.5 text-background hover:opacity-90"
      >
        Iniciar sesión
      </Link>
    </nav>
  );
}
