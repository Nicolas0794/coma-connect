import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { CreativeBg } from "@/components/creative-bg";
import { FloatingAvatars } from "@/components/creator-avatars";

export const metadata: Metadata = {
  title: "Sumá tu marca — CoMa Connect",
  description:
    "Lanza campañas con creadoras colombianas sin caos operativo. Brief con IA, matching automático, contenido aprobado, pagos y reportes — todo en una sola plataforma.",
};

const BENEFITS = [
  {
    icon: "✨",
    title: "Brief en 1 párrafo",
    body: "Contanos en texto libre qué querés y nuestra IA arma el brief estructurado: hooks, checklist, fechas, pago. Revisás, ajustás, listo.",
  },
  {
    icon: "🎯",
    title: "Matching con IA",
    body: "Te sugerimos hasta 8 creadoras ordenadas por compatibilidad real: nicho, ciudad, audiencia, historial con tu marca. Con razón explicada.",
  },
  {
    icon: "📋",
    title: "Flujo Kanban visible",
    body: "Cada pieza de contenido pasa por IDEA → GUIÓN → PRODUCCIÓN → REVISIÓN → APROBADO → PUBLICADO. Sabés en tiempo real en qué parte está cada una.",
  },
  {
    icon: "👥",
    title: "Tu comunidad de creadoras",
    body: "Las creadoras que ya trabajaron bien con tu marca quedan guardadas y se priorizan en próximas campañas. Menos tiempo reclutando, más repetir lo que funciona.",
  },
  {
    icon: "💳",
    title: "Pagos con docs automáticos",
    body: "Cuentas de cobro, RUTs y certificaciones bancarias gestionadas por la plataforma. Tu contabilidad recibe todo listo para pagar a 30 días.",
  },
  {
    icon: "📊",
    title: "Reportes semanales",
    body: "Cada lunes un resumen con estado de campañas, próximas publicaciones y métricas de piezas ya vivas. Sin pedir updates por WhatsApp.",
  },
];

const PORTAL_SECTIONS = [
  { label: "Mis campañas", desc: "Estado de cada una, entregables pendientes, próximas publicaciones" },
  { label: "Mi comunidad", desc: "Creadoras que ya aceptaron campañas tuyas — para reinvitarlas rápido" },
  { label: "Reportes", desc: "KPIs consolidados por campaña, exportables a PDF" },
  { label: "Nueva campaña", desc: "Wizard con IA que te arma el brief estructurado desde tu descripción" },
];

export default function SoyMarcaPage() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border bg-grain">
        <CreativeBg variant="default" />
        <FloatingAvatars variant="trio" />
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28 relative">
          <p className="text-xs uppercase tracking-[0.2em] text-[#FF4B2C] font-semibold mb-4 inline-flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF4B2C] opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FF4B2C]" />
            </span>
            Para marcas
          </p>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground leading-[1.05] mb-6 max-w-4xl">
            Escalá contenido con creadoras,{" "}
            <span className="text-[#FF4B2C]">sin escalar tu equipo</span>.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mb-10 leading-relaxed">
            Una sola plataforma para operar todas tus campañas de creator marketing:
            brief con IA, matching automático, aprobaciones, pagos y reportes. Adiós al
            Excel del viernes.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/sumar-marca">
              <Button
                size="lg"
                className="bg-[#FF4B2C] hover:bg-[#FF4B2C]/90 text-white rounded-full px-7 py-6 text-base"
              >
                Sumá tu marca →
              </Button>
            </Link>
            <Link href="/talento">
              <Button size="lg" variant="outline" className="rounded-full px-7 py-6 text-base">
                Ver creadoras disponibles
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            Revisamos cada solicitud a mano · respuesta en 48 horas · sin contratos ocultos
          </p>
        </div>
      </section>

      {/* BENEFICIOS */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-12">
            <p className="text-xs uppercase tracking-[0.2em] text-[#FF4B2C] font-semibold mb-3">
              Qué resolvemos
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight max-w-3xl">
              El problema no es de creatividad.{" "}
              <span className="text-[#FF4B2C]">Es de sistema</span>.
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl leading-relaxed">
              Tus campañas crecen, tu caos también: briefs por WhatsApp, entregables en
              Excel, reportes los viernes. Todo eso lo resolvemos nosotros.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {BENEFITS.map((b) => (
              <article
                key={b.title}
                className="rounded-2xl border border-border bg-card p-6 hover:border-[#FF4B2C]/40 hover:shadow-[0_8px_32px_-12px_rgba(255,75,44,0.25)] transition-all"
              >
                <div className="h-12 w-12 rounded-xl bg-[#FF4B2C]/10 flex items-center justify-center text-2xl mb-4">
                  {b.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{b.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* MOCKUP PORTAL */}
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#FF4B2C] font-semibold mb-3">
                Tu portal
              </p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-5">
                "Client Space" — todas tus campañas, un solo tablero.
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Cuando aprobamos tu cuenta, tu equipo tiene acceso a un portal donde
                operan todo sin salir:
              </p>
              <ul className="space-y-3">
                {PORTAL_SECTIONS.map((s) => (
                  <li key={s.label} className="flex gap-3">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#FF4B2C] shrink-0" />
                    <div>
                      <p className="font-semibold text-sm">{s.label}</p>
                      <p className="text-sm text-muted-foreground">{s.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="rounded-3xl border border-border bg-background shadow-xl overflow-hidden">
                <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border bg-muted/50">
                  <div className="h-2.5 w-2.5 rounded-full bg-[#FF6B5E]" />
                  <div className="h-2.5 w-2.5 rounded-full bg-[#F4D79D]" />
                  <div className="h-2.5 w-2.5 rounded-full bg-[#D6E889]" />
                  <div className="ml-3 text-[11px] text-muted-foreground font-mono">
                    coma.co/portal
                  </div>
                </div>
                <div className="p-6 space-y-4 bg-gradient-to-br from-background to-muted/20">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#FF4B2C] to-[#FF7A66] flex items-center justify-center text-white font-bold text-lg">
                      C
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Comfandi</p>
                      <p className="text-[11px] text-muted-foreground">
                        Caja de compensación · Cali
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-card border border-border p-3">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Activas
                      </p>
                      <p className="text-xl font-bold">4</p>
                    </div>
                    <div className="rounded-lg bg-card border border-border p-3">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Por aprobar
                      </p>
                      <p className="text-xl font-bold text-[#FF4B2C]">3</p>
                    </div>
                    <div className="rounded-lg bg-card border border-border p-3">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Publicadas
                      </p>
                      <p className="text-xl font-bold">12</p>
                    </div>
                  </div>
                  <div className="rounded-lg border border-border overflow-hidden">
                    <div className="bg-muted/50 px-3 py-2 flex items-center justify-between">
                      <p className="text-[11px] font-semibold uppercase tracking-wider">
                        Campaña · Subsidio A
                      </p>
                      <span className="text-[10px] bg-[#D6E889]/40 text-[#4a5f10] px-2 py-0.5 rounded-full">
                        ACTIVE
                      </span>
                    </div>
                    <div className="p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Valentina Arce</span>
                        <span className="text-[#FF4B2C] font-medium">Revisión cliente</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">María Gómez</span>
                        <span className="text-muted-foreground">En producción</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Carla Rincón</span>
                        <span className="text-[#4a5f10]">Publicada</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-4xl px-6 py-20">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.2em] text-[#FF4B2C] font-semibold mb-3">
              Cómo empezamos
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              De solicitud a primera campaña en menos de una semana.
            </h2>
          </div>
          <ol className="space-y-3">
            {[
              ["01", "Dejás tus datos", "Formulario corto en /sumar-marca — 2 minutos."],
              ["02", "Hablamos", "Alguien del equipo te escribe en menos de 48h para entender tu contexto."],
              ["03", "Te damos acceso", "Tu equipo recibe el link para crear cuenta y entrar al portal."],
              ["04", "Lanzás tu primera campaña", "Contás qué querés en texto libre y armamos el brief con IA."],
              ["05", "Aprobás y publicamos", "Las creadoras producen, tu equipo aprueba en el Kanban, se publica."],
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
        </div>
      </section>

      {/* CLIENTES / PROOF */}
      <section className="border-b border-border bg-muted/20">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <p className="text-center text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-8">
            Marcas que ya operan con nosotros
          </p>
          <div className="flex flex-wrap items-center justify-center gap-10 opacity-70">
            <span className="text-2xl font-bold tracking-tight">Comfandi</span>
            <span className="text-2xl font-bold tracking-tight">Ay Que Churros</span>
            <span className="text-sm text-muted-foreground italic">
              + 180 marcas a lo largo de nuestro recorrido
            </span>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="bg-foreground text-background">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-5 tracking-tight">
            Tu próxima campaña,{" "}
            <span className="text-[#FF4B2C]">sin caos operativo</span>.
          </h2>
          <p className="text-lg opacity-80 mb-8 max-w-xl mx-auto">
            Contanos de tu marca. Te escribimos en menos de 48 horas para conocerte y
            armar el primer pilot.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/sumar-marca">
              <Button
                size="lg"
                className="bg-[#FF4B2C] hover:bg-[#FF4B2C]/90 text-white rounded-full px-8 py-6 text-base"
              >
                Sumá tu marca →
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-8 py-6 text-base bg-transparent border-white/30 text-white hover:bg-white/10"
              >
                Ya tengo cuenta
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
