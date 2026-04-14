import Link from "next/link";
import { NotificationBell } from "@/components/notification-bell";

interface SidebarProps {
  role: string;
  userName: string;
  userEmail: string;
  userId: string;
  currentPath?: string;
}

const adminLinks = [
  { href: "/", label: "Inicio", icon: "🏠" },
  { href: "/clientes", label: "Clientes", icon: "🏢" },
  { href: "/creadores", label: "Creadores", icon: "🎨" },
  { href: "/campanas", label: "Campañas", icon: "📣" },
  { href: "/notificaciones", label: "Notificaciones", icon: "🔔" },
];

const clientLinks = [
  { href: "/portal", label: "Mis campañas", icon: "📣" },
  { href: "/portal/nueva-campana", label: "Nueva campaña", icon: "➕" },
  { href: "/notificaciones", label: "Notificaciones", icon: "🔔" },
];

const creatorLinks = [
  { href: "/mi-espacio", label: "Mi espacio", icon: "🎬" },
  { href: "/notificaciones", label: "Notificaciones", icon: "🔔" },
];

export function Sidebar({ role, userName, userEmail, userId }: SidebarProps) {
  const links = role === "CLIENT" ? clientLinks : role === "CREATOR" ? creatorLinks : adminLinks;
  const spaceName = role === "CLIENT" ? "Orange Space" : role === "CREATOR" ? "CoMa Creator Space" : "CoMa Connect";

  const initial = (userName?.[0] ?? userEmail?.[0] ?? "?").toUpperCase();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[220px] bg-card border-r border-border flex flex-col z-40">
      {/* Logo */}
      <div className="p-5 border-b border-border">
        <Link href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="CoMa Connect" width={130} height={30} />
        </Link>
        <p className="text-[10px] text-muted-foreground mt-1.5 font-medium uppercase tracking-wider">
          {spaceName}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <span className="text-base">{link.icon}</span>
            {link.label}
          </Link>
        ))}

        {/* Campaign sub-links for admin */}
        {(role === "ADMIN" || role === "TEAM") && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="px-3 text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
              Herramientas
            </p>
            <Link
              href="/creadores/nuevo"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <span className="text-base">👤</span>
              Nuevo creador
            </Link>
            <Link
              href="/clientes/nuevo"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <span className="text-base">🏢</span>
              Nuevo cliente
            </Link>
            <Link
              href="/campanas/nueva"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <span className="text-base">📣</span>
              Nueva campaña
            </Link>
          </div>
        )}
      </nav>

      {/* User profile */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2.5 px-2">
          <div className="size-8 rounded-full bg-[#FF4B2C]/15 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">
              {userName ?? userEmail}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              {role === "ADMIN" ? "Administrador" : role === "TEAM" ? "Equipo CoMa" : role === "CLIENT" ? "Cliente" : "Creadora"}
            </p>
          </div>
          <NotificationBell userId={userId} />
        </div>
      </div>
    </aside>
  );
}
