import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notification-bell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;
  const initial = (
    session.user.name?.[0] ?? session.user.email?.[0] ?? "?"
  ).toUpperCase();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-border bg-card">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <Link href="/">
              <Image
                src="/logo.svg"
                alt="CoMa Connect"
                width={130}
                height={30}
                priority
              />
            </Link>
            <nav className="hidden sm:flex items-center gap-1">
              {(role === "ADMIN" || role === "TEAM") && (
                <>
                  <Link
                    href="/clientes"
                    className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                  >
                    Clientes
                  </Link>
                  <Link
                    href="/creadores"
                    className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                  >
                    Creadores
                  </Link>
                  <Link
                    href="/campanas"
                    className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                  >
                    Campañas
                  </Link>
                </>
              )}
              {role === "CLIENT" && (
                <Link
                  href="/portal"
                  className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                >
                  Orange Space
                </Link>
              )}
              {role === "CREATOR" && (
                <Link
                  href="/mi-espacio"
                  className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                >
                  CoMa Creator Space
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell userId={session.user.id} />
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-full bg-[#FF4B2C]/15 flex items-center justify-center text-xs font-medium text-primary">
                {initial}
              </div>
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {session.user.name ?? session.user.email}
              </span>
            </div>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <Button type="submit" variant="ghost" size="sm">
                Salir
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
