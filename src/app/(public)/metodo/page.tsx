import Link from "next/link";
import type { Metadata } from "next";
import { CrossNav } from "@/components/cross-nav";

export const metadata: Metadata = {
  title: "El método CoMa — gamificación, scoring y avatar",
  description:
    "Cómo funciona el sistema CoMa: niveles Rookie a Legend, XP, Creator Score, Brand Score, CoMaCoins, embajadores y avatar. El sistema que convierte la creatividad en carrera.",
};

const LEVELS = [
  {
    name: "Rookie",
    range: "0 · 500 XP",
    color: "bg-[#F4D79D]/60",
    desc: "Acabás de llegar. Completás onboarding, armás tu perfil, postulás a tu primera campaña.",
    unlocks: ["Perfil público", "Postulación a campañas abiertas", "Acceso a cursos con precio de lanzamiento"],
  },
  {
    name: "Creator",
    range: "500 · 2.500 XP",
    color: "bg-[#B0E4EA]/60",
    desc: "Ya completaste tu primera campaña. Tu perfil empieza a tener historial y rating real.",
    unlocks: ["Badge de verificación", "Visibilidad en filtros de marcas", "Primeros microcertificados Academy"],
  },
  {
    name: "Pro",
    range: "2.500 · 8.000 XP",
    color: "bg-[#D6E889]/60",
    desc: "3+ campañas completadas con rating ≥ 4. Las marcas ya te buscan directamente.",
    unlocks: ["Cotizaciones premium", "Invitaciones a eventos Nation", "Canje de CoMaCoins por beneficios"],
  },
  {
    name: "Elite",
    range: "8.000 · 20.000 XP",
    color: "bg-[#FF4B2C]/40",
    desc: "Top performer: rapidez, calidad y ventas consistentes. Sos referencia en tu nicho.",
    unlocks: ["Speakership pagado en Nation", "Campañas exclusivas de marcas premium", "Prioridad en discovery"],
  },
  {
    name: "Legend",
    range: "20.000+ XP",
    color: "bg-foreground text-background",
    desc: "El círculo interno de CoMa. Los que definen el estándar. Acceso a todo.",
    unlocks: ["Embajador CoMa oficial", "Mentoría de nuevas creadoras", "Revenue share en programas aliados"],
  },
];

const XP_SOURCES = [
  { icon: "🎯", label: "Campaña completada", value: "+500 XP", tone: "primary" },
  { icon: "⚡", label: "Entrega antes de deadline", value: "+150 XP", tone: "teal" },
  { icon: "⭐", label: "Rating 5 del cliente", value: "+300 XP", tone: "lime" },
  { icon: "💰", label: "Venta atribuida por link/código", value: "+100 XP c/u", tone: "primary" },
  { icon: "🎓", label: "Microcertificado Academy", value: "+400 XP", tone: "yellow" },
  { icon: "🎤", label: "Asistencia a evento Nation", value: "+100 XP", tone: "teal" },
  { icon: "🧑‍🏫", label: "Speakership Nation", value: "+800 XP", tone: "lime" },
  { icon: "🤝", label: "Cocreación / mentoría", value: "+500 XP", tone: "primary" },
];

const AMBASSADOR_PATH = [
  {
    label: "Nuevo",
    desc: "Primer evento Nation o primera campaña completada.",
    color: "bg-[#F4D79D]/50",
  },
  {
    label: "Frecuente",
    desc: "3+ eventos o 3+ campañas en 6 meses. La comunidad te reconoce.",
    color: "bg-[#B0E4EA]/60",
  },
  {
    label: "Top performer",
    desc: "Creator Score ≥ 85. Participación activa: cocreaciones, paneles, mentorías.",
    color: "bg-[#D6E889]/60",
  },
  {
    label: "Embajador",
    desc: "Representás CoMa. Benefícios reales: acceso VIP, campañas premium, ingresos extra.",
    color: "bg-[#FF4B2C] text-background",
  },
];

export default function MetodoPage() {
  return (
    <div>
      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-br from-[#FF4B2C]/10 via-[#F4D79D]/20 to-[#B0E4EA]/20">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <p className="text-xs uppercase tracking-[0.2em] text-[#FF4B2C] font-semibold mb-3">
            El método CoMa
          </p>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight max-w-4xl">
            Un sistema que convierte <span className="text-[#FF4B2C]">creatividad</span> en carrera.
          </h1>
          <p className="mt-5 text-lg md:text-xl text-muted-foreground max-w-3xl leading-relaxed">
            CoMa no es una plataforma más. Es un ecosistema con reglas claras: niveles, XP,
            reputación medible, gamificación real y recompensas que importan. Así se mueve todo
            lo que hacés dentro de Connect, Academy y Nation.
          </p>
        </div>
      </section>

      {/* Niveles */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="mb-10">
            <p className="text-xs uppercase tracking-[0.2em] text-[#FF4B2C] font-semibold mb-2">Niveles</p>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-3">
              De Rookie a Legend. Tu carrera, con chapa.
            </h2>
            <p className="text-muted-foreground max-w-2xl">
              Cada acción dentro del ecosistema suma XP. Al acumular, subís de nivel y
              desbloqueás acceso, visibilidad y beneficios concretos.
            </p>
          </div>
          <div className="space-y-3">
            {LEVELS.map((lvl, i) => (
              <div key={lvl.name} className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className={`flex items-center gap-4 p-5 ${lvl.color}`}>
                  <span className="text-2xl font-bold tabular-nums shrink-0">{String(i + 1).padStart(2, "0")}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs uppercase tracking-widest opacity-70">Nivel {i + 1}</p>
                    <h3 className="text-2xl font-bold">{lvl.name}</h3>
                  </div>
                  <p className="text-sm font-mono opacity-80 shrink-0">{lvl.range}</p>
                </div>
                <div className="p-5">
                  <p className="text-foreground mb-3">{lvl.desc}</p>
                  <ul className="flex flex-wrap gap-2">
                    {lvl.unlocks.map((u) => (
                      <li key={u} className="rounded-full bg-muted px-3 py-1 text-xs">{u}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-6 italic">
            * Rangos de XP de referencia — el sistema se calibra con la operación real y puede
            ajustarse para que la progresión sea exigente pero alcanzable.
          </p>
        </div>
      </section>

      {/* XP sources */}
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="mb-10">
            <p className="text-xs uppercase tracking-[0.2em] text-[#FF4B2C] font-semibold mb-2">Cómo se gana XP</p>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight">
              Todo lo que hacés cuenta. Todo lo que cuenta, se ve.
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {XP_SOURCES.map((src) => (
              <div key={src.label} className="rounded-xl bg-background border border-border p-5">
                <p className="text-2xl mb-2">{src.icon}</p>
                <p className="font-semibold text-sm leading-tight">{src.label}</p>
                <p className="text-[#FF4B2C] font-bold mt-2">{src.value}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-8 italic">
            Y hay penalizaciones — retrasos, incumplimientos y campañas canceladas restan XP y
            bajan tu Creator Score. El sistema premia consistencia, no brillo puntual.
          </p>
        </div>
      </section>

      {/* Creator Score + Brand Score */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="mb-10">
            <p className="text-xs uppercase tracking-[0.2em] text-[#FF4B2C] font-semibold mb-2">Reputación con evidencia</p>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight">
              Dos scores públicos. Uno por cada lado de la mesa.
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-border bg-card p-7">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-xs uppercase tracking-widest text-[#FF4B2C] font-semibold">Creator Score</p>
                  <p className="text-sm text-muted-foreground">Para creadores · 0–100</p>
                </div>
                <p className="text-5xl font-bold text-[#FF4B2C]">87</p>
              </div>
              <p className="text-sm text-foreground mb-4 leading-relaxed">
                Combina 5 dimensiones de tu trabajo en campañas reales. Visible para marcas al
                elegir quién contratar.
              </p>
              <div className="space-y-2">
                {[
                  ["Rapidez", "Tiempo de respuesta + entrega antes de deadline"],
                  ["Calidad", "Rating del cliente + tasa de aprobación en primera revisión"],
                  ["Cumplimiento", "Campañas completadas sin cancelación"],
                  ["KPIs", "Views, engagement, saves según objetivo del brief"],
                  ["Ventas", "Conversiones atribuidas vía link o código único"],
                ].map(([k, v]) => (
                  <div key={k} className="flex gap-3 text-sm">
                    <span className="font-semibold text-foreground w-28 shrink-0">{k}</span>
                    <span className="text-muted-foreground">{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-7">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-xs uppercase tracking-widest text-teal-700 font-semibold">Brand Score</p>
                  <p className="text-sm text-muted-foreground">Para marcas · 0–100</p>
                </div>
                <p className="text-5xl font-bold text-teal-700">92</p>
              </div>
              <p className="text-sm text-foreground mb-4 leading-relaxed">
                Porque las marcas también se evalúan. Creadores eligen trabajar con quienes hacen
                bien las cosas.
              </p>
              <div className="space-y-2">
                {[
                  ["Claridad del brief", "Brief completo, ejemplos, hooks, CTAs definidos"],
                  ["Tiempo de aprobación", "Velocidad en revisión y feedback"],
                  ["Puntualidad de pago", "Días desde cierre hasta pago efectivo"],
                  ["Comunicación", "Calidad de interacción con el creador"],
                  ["Reincidencia", "Marcas que vuelven a contratar al mismo creador"],
                ].map(([k, v]) => (
                  <div key={k} className="flex gap-3 text-sm">
                    <span className="font-semibold text-foreground w-36 shrink-0">{k}</span>
                    <span className="text-muted-foreground">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-6 italic">
            Ejemplos de scoring — los 87 y 92 son referenciales. Los valores reales dependen de tu historial real en campañas.
          </p>
        </div>
      </section>

      {/* CoMaCoins */}
      <section className="border-b border-border bg-gradient-to-b from-muted/30 to-background">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid md:grid-cols-[1fr_1fr] gap-10 items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#FF4B2C] font-semibold mb-2">CoMaCoins</p>
              <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
                La moneda interna del ecosistema.
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Se ganan por desempeño: campañas, cursos, eventos, referidos. Se canjean por
                cosas que importan: items visuales de tu avatar, acceso VIP a Nation, bonos en
                campañas, descuentos en Academy y productos de marcas aliadas.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                No son crypto. No son dinero. Son un sistema de recompensa interno pensado para
                que cada movimiento dentro de CoMa tenga peso visible.
              </p>
            </div>
            <div className="rounded-3xl bg-foreground text-background p-8">
              <p className="text-sm opacity-60 uppercase tracking-widest">Tu wallet</p>
              <p className="text-6xl font-bold mt-2">🪙 1.240</p>
              <div className="mt-6 space-y-2 text-sm">
                <div className="flex justify-between"><span className="opacity-70">Campaña Comfandi #CM-0012</span><span className="text-[#D6E889]">+350</span></div>
                <div className="flex justify-between"><span className="opacity-70">Microcert. Storytelling</span><span className="text-[#D6E889]">+120</span></div>
                <div className="flex justify-between"><span className="opacity-70">Meetup Cali Abril</span><span className="text-[#D6E889]">+80</span></div>
                <div className="flex justify-between"><span className="opacity-70">Canje — skin avatar</span><span className="text-[#FF4B2C]">-200</span></div>
              </div>
              <p className="text-[11px] opacity-50 mt-6">* Visualización ilustrativa del wallet.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Embajadores */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="mb-10">
            <p className="text-xs uppercase tracking-[0.2em] text-[#FF4B2C] font-semibold mb-2">El camino de embajador</p>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight">
              Los que mueven la comunidad tienen otro lugar.
            </h2>
          </div>
          <div className="grid md:grid-cols-4 gap-3">
            {AMBASSADOR_PATH.map((p, i) => (
              <div key={p.label} className={`rounded-2xl p-5 ${p.color}`}>
                <p className="text-xs opacity-70 uppercase tracking-widest">Fase {i + 1}</p>
                <p className="font-bold text-xl mt-1">{p.label}</p>
                <p className="text-sm mt-2 opacity-90 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Avatar */}
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid md:grid-cols-[1fr_1.2fr] gap-10 items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#FF4B2C] font-semibold mb-2">Tu avatar</p>
              <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
                Tu progreso tiene cara.
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Inspirado en mundos como Habbo y ZEPETO, cada usuario tiene un avatar
                personalizable que evoluciona con su carrera. Items desbloqueables por nivel,
                skins exclusivas por logros, accesorios que se ganan en campañas y eventos.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                No es decoración. Es identidad, estatus visible y una forma de celebrar cada
                hito de tu camino.
              </p>
              <p className="text-xs text-muted-foreground mt-5 italic">
                * Sistema de avatar en roadmap V2. Diseño y mecánicas en desarrollo.
              </p>
            </div>
            <div className="rounded-3xl bg-gradient-to-br from-[#F4D79D]/40 via-[#B0E4EA]/40 to-[#FF4B2C]/20 p-12 text-center aspect-square max-w-md mx-auto flex flex-col items-center justify-center">
              <p className="text-8xl">🧑‍🎤</p>
              <p className="text-xs text-muted-foreground mt-4 uppercase tracking-widest">Avatar preview</p>
              <p className="text-sm font-semibold mt-1">Próximamente</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-foreground text-background">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-5 leading-tight">
            El sistema es real. Entrá a jugar en serio.
          </h2>
          <p className="opacity-70 mb-8 max-w-2xl mx-auto">
            Creá tu perfil, empezá tu primera campaña, tomá tu primer curso. El XP empieza a
            correr desde el día uno.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/register?role=creator"
              className="rounded-full bg-[#FF4B2C] text-white px-8 py-3.5 font-medium hover:opacity-90 transition"
            >
              Soy creador · empezar
            </Link>
            <Link
              href="/register?role=brand"
              className="rounded-full bg-background text-foreground px-8 py-3.5 font-medium hover:opacity-90 transition"
            >
              Soy marca · agendar demo
            </Link>
          </div>
        </div>
      </section>
      <CrossNav current="metodo" />
    </div>
  );
}
