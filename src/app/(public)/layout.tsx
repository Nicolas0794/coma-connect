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
          <Link
            href="/"
            className="group font-semibold tracking-tight text-lg flex items-baseline whitespace-nowrap"
            aria-label="CoMa — Community Marketing"
          >
            <span>Co</span>
            <span className="inline-block overflow-hidden max-w-0 opacity-0 transition-all duration-500 ease-out group-hover:max-w-[160px] group-hover:opacity-100 font-normal text-muted-foreground">
              mmunity&nbsp;
            </span>
            <span className="text-[#FF4B2C]">Ma</span>
            <span className="inline-block overflow-hidden max-w-0 opacity-0 transition-all duration-500 ease-out group-hover:max-w-[160px] group-hover:opacity-100 font-normal text-[#FF4B2C]/70">
              rketing
            </span>
          </Link>
          <PublicNav user={user} />
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border mt-16">
        <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>© {new Date().getFullYear()} CoMa · Plataforma de creator economy LATAM</span>
          <nav className="flex items-center gap-5">
            <Link href="/soy-marca" className="hover:text-[#FF4B2C] transition-colors">
              Sumá tu marca
            </Link>
            <Link href="/soy-creador" className="hover:text-foreground transition-colors">
              Soy creador/a
            </Link>
            <Link href="/talento" className="hover:text-foreground transition-colors">
              Ver talento
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
