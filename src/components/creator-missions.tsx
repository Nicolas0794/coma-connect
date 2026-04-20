import Link from "next/link";

export type Mission = {
  key: string;
  title: string;
  desc: string;
  xp: number;
  href: string;
  cta: string;
  icon: string;
  tone: "primary" | "teal" | "lime" | "yellow" | "pink";
  completed?: boolean;
};

const TONES: Record<Mission["tone"], { bg: string; text: string; border: string }> = {
  primary: { bg: "bg-[#FF4B2C]/8", text: "text-[#FF4B2C]", border: "border-[#FF4B2C]/20" },
  teal: { bg: "bg-[#B0E4EA]/30", text: "text-teal-700", border: "border-[#B0E4EA]/50" },
  lime: { bg: "bg-[#D6E889]/30", text: "text-lime-700", border: "border-[#D6E889]/50" },
  yellow: { bg: "bg-[#F4D79D]/30", text: "text-amber-700", border: "border-[#F4D79D]/50" },
  pink: { bg: "bg-[#F4C0D1]/30", text: "text-pink-700", border: "border-[#F4C0D1]/50" },
};

export function CreatorMissions({ missions }: { missions: Mission[] }) {
  const totalPossible = missions.reduce((s, m) => (m.completed ? s : s + m.xp), 0);

  return (
    <section className="mb-8 rounded-2xl border border-border bg-card p-6">
      <div className="flex items-end justify-between mb-5 gap-3 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#FF4B2C] font-semibold mb-1">
            Misiones disponibles
          </p>
          <h2 className="text-2xl font-bold leading-tight">
            Próximo paso: ganar <span className="text-[#FF4B2C]">+{totalPossible.toLocaleString("es-CO")} XP</span>
          </h2>
        </div>
        <Link
          href="/metodo"
          className="text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          ¿Cómo se calcula el XP? →
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {missions.map((m) => {
          const tone = TONES[m.tone];
          return (
            <Link
              key={m.key}
              href={m.href}
              className={`group relative flex items-start gap-3 rounded-xl border ${tone.border} ${tone.bg} p-4 hover:shadow-md hover:-translate-y-0.5 transition-all ${
                m.completed ? "opacity-60" : ""
              }`}
            >
              <div className="text-2xl shrink-0">{m.icon}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className={`text-[10px] font-mono tracking-widest font-bold ${tone.text}`}>
                    +{m.xp.toLocaleString("es-CO")} XP
                  </p>
                  {m.completed && (
                    <span className="text-[10px] font-semibold text-lime-700">✓ hecho</span>
                  )}
                </div>
                <p className="font-semibold text-foreground text-sm leading-tight">
                  {m.title}
                </p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {m.desc}
                </p>
                <p className="text-xs font-semibold text-foreground mt-2 opacity-70 group-hover:opacity-100">
                  {m.cta} →
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
