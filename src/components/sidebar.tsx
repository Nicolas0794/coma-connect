"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Building2,
  Palette,
  Megaphone,
  Bell,
  Plus,
  UserPlus,
  FileText,
  Film,
  Sparkles,
  Users,
  BarChart3,
  GraduationCap,
  CalendarDays,
  type LucideIcon,
} from "lucide-react";

interface SidebarProps {
  role: string;
  userName: string;
  userEmail: string;
  unreadCount: number;
}

type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

const adminLinks: NavLink[] = [
  { href: "/", label: "Inicio", icon: Home, exact: true },
  { href: "/clientes", label: "Clientes", icon: Building2 },
  { href: "/creadores", label: "Creadores", icon: Palette },
  { href: "/campanas", label: "Campañas", icon: Megaphone },
  { href: "/academia", label: "Academy", icon: GraduationCap },
  { href: "/eventos", label: "Nation", icon: CalendarDays },
];

const adminTools: NavLink[] = [
  { href: "/campanas/nueva", label: "Nueva campaña", icon: Sparkles },
  { href: "/creadores/nuevo", label: "Nuevo creador", icon: UserPlus },
  { href: "/clientes/nuevo", label: "Nuevo cliente", icon: Plus },
];

const clientLinks: NavLink[] = [
  { href: "/portal", label: "Mis campañas", icon: Megaphone, exact: true },
  { href: "/portal/reporte", label: "Reporte", icon: BarChart3 },
  { href: "/portal/creadores", label: "Mi comunidad", icon: Users },
  { href: "/portal/nueva-campana", label: "Nueva campaña", icon: Sparkles },
  { href: "/academy", label: "Academy", icon: GraduationCap },
  { href: "/nation", label: "Nation", icon: CalendarDays },
];

const creatorLinks: NavLink[] = [
  { href: "/mi-espacio", label: "Mi espacio", icon: Film, exact: true },
  { href: "/mi-espacio/documentos", label: "Mis documentos", icon: FileText },
  { href: "/mi-espacio/academia", label: "Mi academia", icon: GraduationCap },
  { href: "/mi-espacio/eventos", label: "Mis eventos", icon: CalendarDays },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

function NavItem({
  link,
  pathname,
  badge,
}: {
  link: NavLink;
  pathname: string;
  badge?: number;
}) {
  const active = isActive(pathname, link.href, link.exact);
  const Icon = link.icon;

  return (
    <Link
      href={link.href}
      className={`group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
        active
          ? "bg-gradient-to-r from-[#FF4B2C]/20 to-[#FF4B2C]/5 text-white shadow-[0_0_20px_-8px_rgba(255,75,44,0.5)]"
          : "text-stone-400 hover:text-white hover:bg-white/[0.06]"
      }`}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[2px] rounded-r-full bg-[#FF4B2C] shadow-[0_0_8px_rgba(255,75,44,0.8)]" />
      )}
      <Icon
        size={16}
        strokeWidth={active ? 2.2 : 1.8}
        className={`shrink-0 transition-colors ${
          active ? "text-[#FF7A66]" : "text-stone-500 group-hover:text-stone-200"
        }`}
      />
      <span className="flex-1 truncate">{link.label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="min-w-[18px] h-[18px] px-1.5 rounded-full bg-[#FF4B2C] text-[10px] font-bold text-white flex items-center justify-center shadow-[0_0_8px_rgba(255,75,44,0.5)]">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </Link>
  );
}

export function Sidebar({ role, userName, userEmail, unreadCount }: SidebarProps) {
  const pathname = usePathname();
  const links = role === "CLIENT" ? clientLinks : role === "CREATOR" ? creatorLinks : adminLinks;
  const spaceName =
    role === "CLIENT" ? "Client Space" : role === "CREATOR" ? "Creator Space" : "Admin Space";
  const roleLabel =
    role === "ADMIN"
      ? "Administrador"
      : role === "TEAM"
      ? "Equipo CoMa"
      : role === "CLIENT"
      ? "Cliente"
      : "Creadora";

  const initial = (userName?.[0] ?? userEmail?.[0] ?? "?").toUpperCase();
  const notifLink: NavLink = { href: "/notificaciones", label: "Notificaciones", icon: Bell };

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[240px] z-40 flex flex-col bg-[#1F1B18] text-stone-300 border-r border-white/[0.06]">
      {/* ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(700px circle at 0% 0%, rgba(255,122,102,0.10), transparent 45%), radial-gradient(500px circle at 100% 100%, rgba(255,75,44,0.05), transparent 50%)",
        }}
      />

      {/* Logo */}
      <div className="relative px-5 pt-5 pb-4">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-white.svg" alt="CoMa Connect" className="h-[22px] w-auto" />
        </Link>
        <div className="mt-3 flex items-center gap-1.5">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF4B2C] opacity-60" />
            <span className="relative inline-flex size-1.5 rounded-full bg-[#FF4B2C]" />
          </span>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
            {spaceName}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative flex-1 px-3 overflow-y-auto">
        <div className="space-y-0.5">
          {links.map((link) => (
            <NavItem key={link.href} link={link} pathname={pathname} />
          ))}
          <NavItem link={notifLink} pathname={pathname} badge={unreadCount} />
        </div>

        {(role === "ADMIN" || role === "TEAM") && (
          <div className="mt-6">
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-600">
              Acciones rápidas
            </p>
            <div className="space-y-0.5">
              {adminTools.map((link) => (
                <NavItem key={link.href} link={link} pathname={pathname} />
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* User profile */}
      <div className="relative p-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="relative shrink-0">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#FF4B2C] to-[#FF7A66] blur-[6px] opacity-50" />
            <div className="relative size-9 rounded-full bg-gradient-to-br from-[#FF4B2C] to-[#FF7A66] flex items-center justify-center text-sm font-bold text-white ring-1 ring-white/10">
              {initial}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate leading-tight">
              {userName || userEmail}
            </p>
            <p className="text-[11px] text-stone-500 truncate mt-0.5">{roleLabel}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
