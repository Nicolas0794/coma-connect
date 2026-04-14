import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/sidebar";

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

  return (
    <div className="flex min-h-screen">
      <Sidebar
        role={role}
        userName={session.user.name ?? ""}
        userEmail={session.user.email ?? ""}
        userId={session.user.id}
      />
      <div className="flex-1 ml-[220px] flex flex-col">
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
