import Link from "next/link";
import { levelForXp, estimateCoins, LEVELS } from "@/lib/creator-level";

type Props = {
  xp: number;
  creatorScore: number; // 0-100
  coinsOverride?: number;
  stats: {
    completedCampaigns: number;
    microcertificates: number;
    eventsAttended: number;
  };
};

export function CreatorGamification({ xp, creatorScore, coinsOverride, stats }: Props) {
  const level = levelForXp(xp);
  const coins = coinsOverride ?? estimateCoins(xp);
  const scoreLabel =
    creatorScore >= 90 ? "Excepcional" : creatorScore >= 75 ? "Sólido" : creatorScore >= 50 ? "En construcción" : "Nuevo";

  return (
    <div className="relative mb-8 rounded-2xl border border-border bg-[#1F1B18] text-stone-200 p-6 overflow-hidden">
      {/* grid pattern */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />
      {/* scanline top */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[2px] opacity-70"
        style={{
          background: `linear-gradient(90deg, transparent, ${level.color}, transparent)`,
          animation: "marquee 6s linear infinite",
        }}
      />

      <div className="relative grid lg:grid-cols-[1.2fr_1fr_1fr] gap-6 items-center">
        {/* Level + XP progress */}
        <div>
          <p className="text-[10px] font-mono tracking-widest text-stone-500 mb-1">
            NIVEL · #{String(level.index + 1).padStart(2, "0")}
          </p>
          <div className="flex items-baseline gap-3 mb-3">
            <h2 className="text-4xl font-bold" style={{ color: level.color }}>
              {level.label}
            </h2>
            {level.nextLabel && (
              <p className="text-xs text-stone-400 font-mono">
                → {level.nextLabel} en {level.xpForNext?.toLocaleString("es-CO")} XP
              </p>
            )}
            {!level.nextLabel && (
              <p className="text-xs text-stone-400 font-mono">Máximo nivel alcanzado</p>
            )}
          </div>
          <div className="relative h-2 w-full rounded-full bg-white/[0.08] overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all"
              style={{
                width: `${level.progressPct}%`,
                background: `linear-gradient(90deg, ${level.color}, ${level.color}88)`,
              }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-[11px] font-mono text-stone-500">
            <span>{xp.toLocaleString("es-CO")} XP</span>
            <span>{level.progressPct}%</span>
          </div>
        </div>

        {/* Creator Score */}
        <div className="lg:border-x lg:border-white/[0.08] lg:px-6">
          <p className="text-[10px] font-mono tracking-widest text-stone-500 mb-1">
            CREATOR SCORE
          </p>
          <div className="flex items-baseline gap-2">
            <p
              className="text-4xl font-bold tabular-nums"
              style={{ color: level.color }}
            >
              {creatorScore}
            </p>
            <span className="text-sm text-stone-400">/ 100</span>
          </div>
          <p className="text-xs text-stone-400 mt-1">{scoreLabel}</p>
          <Link
            href="/metodo"
            className="text-[11px] font-mono text-stone-500 hover:text-stone-300 mt-3 inline-block"
          >
            ver cómo se calcula →
          </Link>
        </div>

        {/* CoMaCoins */}
        <div>
          <p className="text-[10px] font-mono tracking-widest text-stone-500 mb-1">
            COMACOINS
          </p>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-bold text-[#F4D79D] tabular-nums">
              🪙 {coins.toLocaleString("es-CO")}
            </p>
          </div>
          <p className="text-xs text-stone-400 mt-1">Canjea por beneficios reales</p>
          <span className="inline-block mt-3 text-[10px] font-mono text-stone-600">
            próximamente — marketplace de canjes
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="relative mt-6 pt-5 border-t border-white/[0.08] grid grid-cols-3 gap-4 text-center">
        <Stat label="Campañas" value={stats.completedCampaigns} emoji="🎯" />
        <Stat label="Certificados" value={stats.microcertificates} emoji="🎓" />
        <Stat label="Eventos Nation" value={stats.eventsAttended} emoji="🎤" />
      </div>

      {/* Roadmap chips */}
      <div className="relative mt-5 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1">
          {LEVELS.map((l, i) => {
            const done = i < level.index;
            const current = i === level.index;
            return (
              <div
                key={l.key}
                className={`rounded-full px-2.5 py-1 text-[10px] font-mono tracking-wider border ${
                  current
                    ? "border-white/60 text-white font-bold"
                    : done
                    ? "border-white/20 text-stone-300 opacity-80"
                    : "border-white/10 text-stone-500"
                }`}
                style={current ? { background: `${l.color}22` } : undefined}
              >
                {done ? "✓ " : ""}{l.label}
              </div>
            );
          })}
        </div>
        <Link
          href="/metodo"
          className="text-xs font-semibold text-[#FF7A66] hover:text-[#FF4B2C] transition"
        >
          Ver el método completo →
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value, emoji }: { label: string; value: number; emoji: string }) {
  return (
    <div>
      <p className="text-2xl mb-1">{emoji}</p>
      <p className="text-xl font-bold text-white tabular-nums">{value}</p>
      <p className="text-[10px] font-mono tracking-widest text-stone-500 mt-1">{label}</p>
    </div>
  );
}
