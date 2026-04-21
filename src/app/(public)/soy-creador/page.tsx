import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { CreativeBg } from "@/components/creative-bg";
import { FloatingAvatars } from "@/components/creator-avatars";

export const metadata: Metadata = {
  title: "Sumate como creador/a — CoMa Connect",
  description:
    "Tu espacio en CoMa: perfil público, campañas con marcas, pagos claros, Academy con certificación y la comunidad Nation. Creá tu cuenta gratis.",
};

const BENEFITS = [
  {
    icon: "✨",
    title: "Onboarding en 30 segundos con IA",
    body: "Pegás tu handle de Instagram y Claude lee tu perfil público para proponer headline, nichos, tipos de contenido y tarifa estimada. Vos revisás y ajustás.",
  },
  {
    icon: "🎯",
    title: "Campañas que llegan solas",
    body: "Nuestra IA de matching te sugiere campañas compatibles con tu estilo, ubicación y nicho. Menos cold DMs, más trabajo real.",
  },
  {
    icon: "📇",
    title: "Tu perfil público profesional",
    body: "Un link propio (coma.co/c/tuslug) con tu portafolio, tarifas visibles, reseñas verificadas y formulario de inquiries.",
  },
  {
    icon: "💸",
    title: "Pagos claros, trazables",
    body: "Cuenta de cobro automática, RUT y certificación bancaria seguros en un solo lugar. Adiós al 'cuando me pagan'.",
  },
  {
    icon: "🎓",
    title: "CoMa Academy incluida",
    body: "6 cursos certificados (UGC, guión, edición, estrategia), tutor IA 24/7 por WhatsApp y certificación oficial de la Secretaría de Educación de Cali.",
  },
  {
    icon: "🎤",
    title: "CoMa Nation — la comunidad",
    body: "Meetups, workshops, paneles y el evento anual. La red donde las creadoras se encuentran y construyen juntas.",
  },
  {
    icon: "🎮",
    title: "Avatar + gamificación",
    body: "XP por misiones completadas, avatar personalizable que crece con vos, niveles y recompensas reales (campañas exclusivas, upgrades).",
  },
];

const MI_ESPACIO_SECTIONS = [
  { label: "Mi perfil", desc: "Editá tu bio, tarifas, portafolio, redes y availability" },
  { label: "Mis campañas", desc: "Brief, entregables, pagos y estado en tiempo real" },
  { label: "Mi academia", desc: "Tus cursos, progreso y certificados descargables" },
  { label: "Mis eventos", desc: "Invitaciones, tickets y registros a eventos Nation" },
  { label: "Mis documentos", desc: "RUT y certificación bancaria guardados y listos" },
];

export default function SoyCreadorPage() {
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
            Para creadoras y creadores
          </p>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground leading-[1.05] mb-6 max-w-4xl">
            Tu carrera creativa,{" "}
            <span className="text-[#FF4B2C]">con sistema</span>.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mb-10 leading-relaxed">
            Todo lo que necesitás para vivir de lo que creás en un solo lugar:
            campañas con marcas reales, perfil público profesional, pagos claros,
            formación certificada y una comunidad que te empuja.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/register">
              <Button size="lg" className="bg-[#FF4B2C] hover:bg-[#FF4B2C]/90 text-white px-7 py-6 text-base rounded-full">
                Crear mi cuenta gratis →
              </Button>
            </Link>
            <Link href="/talento">
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-7 py-6 text-base"
              >
                Ver creadoras activas
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            Sin costo · sin exclusividad · tu perfil queda publicable en 5 min
          </p>
        </div>
      </section>

      {/* BENEFICIOS */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-12">
            <p className="text-xs uppercase tracking-[0.2em] text-[#FF4B2C] font-semibold mb-3">
              Qué encontrás
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight max-w-3xl">
              Un ecosistema pensado para que la creatividad sea{" "}
              <span className="text-[#FF4B2C]">tu trabajo</span>, no un hobby.
            </h2>
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
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {b.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* MI ESPACIO */}
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#FF4B2C] font-semibold mb-3">
                Tu dashboard
              </p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-5">
                "Mi Espacio" — todo tu trabajo, en un panel.
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Cuando creás tu cuenta, vas a encontrarte con tu espacio
                personal. Desde ahí gestionás todo sin salir de la plataforma:
              </p>
              <ul className="space-y-3">
                {MI_ESPACIO_SECTIONS.map((s) => (
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
                    coma.co/mi-espacio
                  </div>
                </div>
                <div className="p-6 space-y-4 bg-gradient-to-br from-background to-muted/20">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#FF4B2C] to-[#FF7A66] flex items-center justify-center text-white font-bold text-lg">
                      V
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Valentina Arce</p>
                      <p className="text-[11px] text-muted-foreground">
                        Cali · UGC · Lifestyle
                      </p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        XP
                      </p>
                      <p className="font-bold text-sm text-[#FF4B2C]">2,340</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-card border border-border p-3">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Campañas activas
                      </p>
                      <p className="text-xl font-bold">3</p>
                    </div>
                    <div className="rounded-lg bg-card border border-border p-3">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Pagos pendientes
                      </p>
                      <p className="text-xl font-bold">$420k</p>
                    </div>
                  </div>
                  <div className="rounded-lg bg-[#FF4B2C]/10 border border-[#FF4B2C]/30 p-3">
                    <p className="text-[11px] font-semibold text-[#FF4B2C] uppercase tracking-wider mb-1">
                      ✨ Nueva misión disponible
                    </p>
                    <p className="text-sm font-medium">
                      Subí 2 piezas al portafolio — 150 XP
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CÓMO ES EL PROCESO */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-4xl px-6 py-20">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.2em] text-[#FF4B2C] font-semibold mb-3">
              Cómo funciona
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              De registro a primera campaña en días, no meses.
            </h2>
          </div>
          <ol className="space-y-3">
            {[
              ["01", "Creás tu cuenta", "Email, contraseña y listo. Sin verificaciones raras."],
              ["02", "Autocompletás con IA (opcional)", "Pegás tu handle de Instagram y Claude propone headline, nichos y tarifa. Tardás menos de 1 minuto."],
              ["03", "Ajustás lo que haga falta", "Subís 3-5 piezas a tu portafolio y revisás lo que propuso la IA."],
              ["04", "Publicamos tu perfil", "Revisamos que todo esté bien y lo ponemos online."],
              ["05", "Te llegan campañas", "IA de matching te notifica cuando hay match o las marcas te contactan directo."],
              ["06", "Producís + cobrás", "Subís el contenido desde la plataforma, se aprueba, se publica, se paga."],
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

      {/* CTA FINAL */}
      <section className="bg-foreground text-background">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-5 tracking-tight">
            Tu próxima campaña empieza{" "}
            <span className="text-[#FF4B2C]">acá</span>.
          </h2>
          <p className="text-lg opacity-80 mb-8 max-w-xl mx-auto">
            Más de 2.400 creadoras ya usan CoMa para operar sus carreras.
            Registrarte toma 30 segundos.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-[#FF4B2C] hover:bg-[#FF4B2C]/90 text-white rounded-full px-8 py-6 text-base"
              >
                Crear mi cuenta gratis →
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
