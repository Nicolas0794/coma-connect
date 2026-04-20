import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CreativeBg } from "@/components/creative-bg";
import { CreatorMarquee } from "@/components/creator-marquee";
import { CreatorAvatarGrid, FloatingAvatars } from "@/components/creator-avatars";

export const metadata: Metadata = {
  title: "CoMa — El sistema operativo de la creator economy",
  description:
    "CoMa organiza la creatividad para convertirla en resultados medibles. Marcas, creadores, eventos y formación en una sola plataforma.",
};

export default async function HomePage() {
  const session = await auth();
  const role = session?.user?.role;
  if (role === "ADMIN") redirect("/dashboard");
  if (role === "CLIENT") redirect("/portal");
  if (role === "CREATOR") redirect("/mi-espacio");
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border bg-grain">
        <CreativeBg variant="default" />
        <FloatingAvatars variant="trio" />
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32 relative">
          <p className="text-xs uppercase tracking-[0.2em] text-[#FF4B2C] font-semibold mb-4 inline-flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF4B2C] opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FF4B2C]" />
            </span>
            Creator economy · LATAM
          </p>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground leading-[1.05] mb-6 max-w-4xl">
            El sistema operativo de la <span className="text-[#FF4B2C]">creator economy</span>.
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mb-10 leading-relaxed">
            CoMa organiza la creatividad de tus campañas para convertirla en resultados medibles.
            Marcas, creadores, eventos y formación — una sola plataforma.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/register?role=brand"
              className="relative rounded-full bg-[#FF4B2C] text-white px-7 py-3 font-medium hover:opacity-90 transition animate-pulse-ring"
            >
              Soy marca →
            </Link>
            <Link
              href="/register?role=creator"
              className="rounded-full bg-foreground text-background px-7 py-3 font-medium hover:opacity-90 transition"
            >
              Soy creador →
            </Link>
            <Link
              href="/talento"
              className="rounded-full border border-border bg-background/60 backdrop-blur px-7 py-3 font-medium hover:bg-muted transition"
            >
              Explorar talento
            </Link>
          </div>
        </div>
      </section>

      {/* MARQUEE de tags creativos */}
      <CreatorMarquee />

      {/* PROBLEMA */}
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-16 max-w-3xl leading-tight">
            La creatividad escaló. El sistema no.
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="rounded-2xl border border-border bg-background p-8">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-3">
                Marcas
              </p>
              <p className="text-lg text-foreground leading-relaxed">
                Tu equipo aprueba guiones por WhatsApp, rastrea entregables en Excel y arma reportes
                los viernes. Tus campañas crecen, tu caos también.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-8">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-3">
                Creadores
              </p>
              <p className="text-lg text-foreground leading-relaxed">
                Campañas que llegan por DM. Briefs por audio. Pagos que se renegocian. Cero data
                sobre tu propio desempeño. Y un techo invisible.
              </p>
            </div>
          </div>
          <p className="text-center text-2xl md:text-3xl font-semibold text-foreground mt-16 italic">
            El problema no es de creatividad. Es de sistema.
          </p>
        </div>
      </section>

      {/* TRES PILARES */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-[0.2em] text-[#FF4B2C] font-semibold mb-3">
              El ecosistema
            </p>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Un solo sistema. Tres mundos conectados.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <Link
              href="/talento"
              className="group card-interactive rounded-3xl border border-border bg-card p-8"
            >
              <div className="h-14 w-14 rounded-2xl bg-[#FF4B2C]/10 flex items-center justify-center mb-5 text-2xl">
                🎯
              </div>
              <p className="text-xs uppercase tracking-widest text-[#FF4B2C] font-semibold mb-2">
                CoMa Connect
              </p>
              <h3 className="text-2xl font-bold text-foreground mb-3">Campañas end-to-end.</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Brief → selección IA → producción → aprobación → publicación → KPIs → pagos.
                Todo en un lugar, todo automatizado.
              </p>
              <span className="text-sm font-medium text-foreground group-hover:text-[#FF4B2C] transition-colors">
                Explorar talento →
              </span>
            </Link>
            <Link
              href="/nation"
              className="group card-interactive rounded-3xl border border-border bg-card p-8"
            >
              <div className="h-14 w-14 rounded-2xl bg-[#B0E4EA]/40 flex items-center justify-center mb-5 text-2xl">
                🎤
              </div>
              <p className="text-xs uppercase tracking-widest text-[#FF4B2C] font-semibold mb-2">
                CoMa Nation
              </p>
              <h3 className="text-2xl font-bold text-foreground mb-3">Eventos y comunidad.</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Meetups, workshops, paneles y un evento anual. La red donde las creadoras se
                encuentran y construyen juntas.
              </p>
              <span className="text-sm font-medium text-foreground group-hover:text-[#FF4B2C] transition-colors">
                Ver próximos eventos →
              </span>
            </Link>
            <Link
              href="/academy"
              className="group card-interactive rounded-3xl border border-border bg-card p-8"
            >
              <div className="h-14 w-14 rounded-2xl bg-[#F4D79D]/40 flex items-center justify-center mb-5 text-2xl">
                🎓
              </div>
              <p className="text-xs uppercase tracking-widest text-[#FF4B2C] font-semibold mb-2">
                CoMa Academy
              </p>
              <h3 className="text-2xl font-bold text-foreground mb-3">Formación con resultados.</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                6 cursos certificados, masters reales, CoMa IA 24/7 por WhatsApp. Certificación
                oficial UGC con resolución de la Secretaría de Educación de Cali.
              </p>
              <span className="text-sm font-medium text-foreground group-hover:text-[#FF4B2C] transition-colors">
                Ver programa →
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* OPORTUNIDAD (DATOS) */}
      <section className="border-b border-border bg-gradient-to-b from-muted/20 to-background">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-[0.2em] text-[#FF4B2C] font-semibold mb-3">
              La oportunidad
            </p>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4 max-w-4xl mx-auto">
              La creator economy ya no es tendencia. Es infraestructura.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="rounded-2xl border border-border bg-background p-6">
              <p className="text-4xl font-bold text-[#FF4B2C] mb-2">~$250 B</p>
              <p className="text-sm text-foreground font-medium mb-1">
                Tamaño creator economy global 2023
              </p>
              <p className="text-xs text-muted-foreground">Goldman Sachs Research, 2023</p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-6">
              <p className="text-4xl font-bold text-[#FF4B2C] mb-2">~$480 B</p>
              <p className="text-sm text-foreground font-medium mb-1">
                Proyección global 2027
              </p>
              <p className="text-xs text-muted-foreground">Goldman Sachs Research, 2023</p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-6">
              <p className="text-4xl font-bold text-[#FF4B2C] mb-2">~$24 B</p>
              <p className="text-sm text-foreground font-medium mb-1">
                Influencer marketing global 2024
              </p>
              <p className="text-xs text-muted-foreground">
                Influencer Marketing Hub, 2024
              </p>
            </div>
          </div>
          <p className="text-center text-xl md:text-2xl font-medium text-foreground mt-12 italic max-w-3xl mx-auto">
            El mercado existe. La infraestructura para operarlo, hasta hoy, no.
          </p>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-[0.2em] text-[#FF4B2C] font-semibold mb-3">
              Cómo funciona
            </p>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Automatización que trabaja mientras tú creas.
            </h2>
          </div>
          <ol className="max-w-3xl mx-auto space-y-3">
            {[
              ["01", "Brief recibido", "CoMa lo transforma en brief-creador"],
              ["02", "Selección IA", "Sugerencias con afinidad real"],
              ["03", "Creador acepta", "Logística de producto se activa"],
              ["04", "Producto recibido", "Se desbloquea la fase de contenido"],
              ["05", "Contenido aprobado", "Se activa publicación"],
              ["06", "Publicación detectada", "KPIs empiezan a correr"],
              ["07", "KPIs cerrados", "Pago se calcula automáticamente"],
            ].map(([num, title, desc]) => (
              <li
                key={num}
                className="flex items-start gap-5 rounded-xl border border-border bg-card p-5"
              >
                <span className="text-2xl font-bold text-[#FF4B2C] tabular-nums shrink-0">
                  {num}
                </span>
                <div>
                  <p className="font-semibold text-foreground">{title}</p>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="text-center text-lg text-muted-foreground mt-10 italic">
            Cada acción dispara la siguiente. Tú decides. CoMa ejecuta.
          </p>
        </div>
      </section>

      {/* AVATARES DE ARQUETIPOS */}
      <CreatorAvatarGrid />

      {/* CTA FINAL */}
      <section className="bg-foreground text-background">
        <div className="mx-auto max-w-4xl px-6 py-24 text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
            El sistema ya existe.
            <br />
            <span className="text-[#FF4B2C]">Úsalo.</span>
          </h2>
          <p className="text-lg opacity-80 mb-10 max-w-2xl mx-auto">
            Marcas que escalan contenido sin escalar al equipo. Creadores que convierten su
            trabajo en carrera. Una sola plataforma.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/register?role=brand"
              className="rounded-full bg-[#FF4B2C] text-white px-8 py-3.5 font-medium hover:opacity-90 transition"
            >
              Agendar demo (marcas)
            </Link>
            <Link
              href="/register?role=creator"
              className="rounded-full bg-background text-foreground px-8 py-3.5 font-medium hover:opacity-90 transition"
            >
              Postular (creadores)
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
