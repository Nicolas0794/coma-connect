import Link from "next/link";
import { PublicNav } from "@/components/public-nav";
import { auth } from "@/auth";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user
    ? {
        name: session.user.name || session.user.email || "",
        email: session.user.email || "",
        role: (session.user.role as string) || "",
        image: session.user.image || null,
      }
    : null;
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-30 h-14 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-6">
          <Link href="/" className="font-semibold tracking-tight text-lg">
            Co<span className="text-[#FF4B2C]">Ma</span>
          </Link>
          <PublicNav user={user} />
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border mt-16">
        <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-muted-foreground flex items-center justify-between">
          <span>© {new Date().getFullYear()} CoMa</span>
          <span>Plataforma profesional de creadores de contenido</span>
        </div>
      </footer>
    </div>
  );
}
