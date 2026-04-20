import Link from "next/link";

type Section = "home" | "connect" | "academy" | "nation" | "metodo";

const SECTIONS: Record<
  Exclude<Section, "home">,
  { href: string; label: string; title: string; desc: string; accent: string }
> = {
  connect: {
    href: "/talento",
    label: "CoMa Connect",
    title: "Campañas end-to-end",
    desc: "Descubrí la red profesional de creadores verificados.",
    accent: "from-[#FF4B2C]/15 to-[#FF4B2C]/5",
  },
  academy: {
    href: "/academy",
    label: "CoMa Academy",
    title: "Formación con resultados",
    desc: "6 cursos certificados + tutor IA 24/7. Tu carrera, entrenada.",
    accent: "from-[#F4D79D]/30 to-[#F4D79D]/10",
  },
  nation: {
    href: "/nation",
    label: "CoMa Nation",
    title: "Comunidad en movimiento",
    desc: "Meetups, workshops y el evento anual. La escena en vivo.",
    accent: "from-[#B0E4EA]/30 to-[#B0E4EA]/10",
  },
  metodo: {
    href: "/metodo",
    label: "El método",
    title: "Niveles, XP y CoMaCoins",
    desc: "Cómo el sistema convierte creatividad en carrera.",
    accent: "from-[#D6E889]/30 to-[#D6E889]/10",
  },
};

export function CrossNav({ current }: { current: Section }) {
  const others = (Object.keys(SECTIONS) as Array<keyof typeof SECTIONS>).filter(
    (k) => k !== current,
  );

  return (
    <section className="border-t border-border bg-muted/20">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#FF4B2C] font-semibold mb-2">
              Seguí explorando
            </p>
            <h2 className="text-2xl md:text-3xl font-bold leading-tight">
              Todo el ecosistema, un click.
            </h2>
          </div>
          <Link
            href="/"
            className="text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            ← Volver al home
          </Link>
        </div>
        <div className={`grid gap-4 ${others.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
          {others.map((key) => {
            const s = SECTIONS[key];
            return (
              <Link
                key={key}
                href={s.href}
                className={`group rounded-2xl border border-border bg-gradient-to-br ${s.accent} p-6 hover:shadow-xl hover:-translate-y-1 transition-all`}
              >
                <p className="text-xs uppercase tracking-widest text-[#FF4B2C] font-semibold mb-2">
                  {s.label}
                </p>
                <h3 className="text-lg font-bold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{s.desc}</p>
                <span className="text-sm font-semibold text-foreground group-hover:text-[#FF4B2C] transition-colors">
                  Ir →
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
