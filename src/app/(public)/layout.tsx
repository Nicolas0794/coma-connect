import Link from "next/link";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-30 h-14 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-6">
          <Link href="/talento" className="font-semibold tracking-tight text-lg">
            CoMa <span className="text-[#FF4B2C]">Connect</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/talento" className="text-muted-foreground hover:text-foreground">
              Explorar talento
            </Link>
            <Link
              href="/login"
              className="rounded-full bg-foreground px-4 py-1.5 text-background hover:opacity-90"
            >
              Iniciar sesión
            </Link>
          </nav>
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
