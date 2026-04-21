import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/sidebar";
import { prisma } from "@/lib/prisma";
import { homeForRole } from "@/lib/role-routes";

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

  // Defensa en profundidad: aunque el proxy ya enruta por rol (CRÍTICA-1),
  // bloqueamos acá por si el matcher del proxy no cubre algún caso.
  const pathname = (await headers()).get("x-pathname") ?? "";
  const isCreatorArea =
    pathname.startsWith("/mi-espacio") ||
    pathname.startsWith("/notificaciones");
  const isClientArea =
    pathname.startsWith("/portal") || pathname.startsWith("/notificaciones");

  if (role === "CREATOR" && pathname && !isCreatorArea) {
    redirect(homeForRole(role));
  }
  if (role === "CLIENT" && pathname && !isClientArea) {
    redirect(homeForRole(role));
  }

  const unreadCount = await prisma.notification.count({
    where: { userId: session.user.id, read: false, channel: "IN_APP" },
  });

  return (
    <div className="flex min-h-screen">
      <Sidebar
        role={role}
        userName={session.user.name ?? ""}
        userEmail={session.user.email ?? ""}
        unreadCount={unreadCount}
      />
      <div className="flex-1 ml-[240px] flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-12 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-end px-6">
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <Button type="submit" variant="ghost" size="xs">
              Cerrar sesión
            </Button>
          </form>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
