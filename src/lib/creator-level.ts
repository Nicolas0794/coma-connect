// Sistema de niveles y XP del ecosistema CoMa.
// Narrativa y rangos definidos en /metodo (Rookie → Legend).

export const LEVELS = [
  { key: "ROOKIE", label: "Rookie", min: 0, color: "#F4D79D" },
  { key: "CREATOR", label: "Creator", min: 500, color: "#B0E4EA" },
  { key: "PRO", label: "Pro", min: 2500, color: "#D6E889" },
  { key: "ELITE", label: "Elite", min: 8000, color: "#FF7A66" },
  { key: "LEGEND", label: "Legend", min: 20000, color: "#2C2C2A" },
] as const;

export type LevelKey = (typeof LEVELS)[number]["key"];

export type LevelInfo = {
  key: LevelKey;
  label: string;
  color: string;
  index: number;
  xpIntoLevel: number;
  xpForNext: number | null;
  nextLabel: string | null;
  progressPct: number; // 0-100 dentro del nivel actual
};

export function levelForXp(xp: number): LevelInfo {
  let idx = 0;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].min) {
      idx = i;
      break;
    }
  }
  const current = LEVELS[idx];
  const next = LEVELS[idx + 1] ?? null;
  const xpIntoLevel = xp - current.min;
  const xpForNext = next ? next.min - xp : null;
  const progressPct = next
    ? Math.min(100, Math.round((xpIntoLevel / (next.min - current.min)) * 100))
    : 100;
  return {
    key: current.key,
    label: current.label,
    color: current.color,
    index: idx,
    xpIntoLevel,
    xpForNext,
    nextLabel: next?.label ?? null,
    progressPct,
  };
}

/** Cálculo simple de XP a partir de actividad. Los valores siguen /metodo. */
export function computeXp(input: {
  completedCampaigns?: number;
  fiveStarReviews?: number;
  microcertificates?: number;
  eventsAttended?: number;
  speakerships?: number;
}): number {
  return (
    (input.completedCampaigns ?? 0) * 500 +
    (input.fiveStarReviews ?? 0) * 300 +
    (input.microcertificates ?? 0) * 400 +
    (input.eventsAttended ?? 0) * 100 +
    (input.speakerships ?? 0) * 800
  );
}

/** CoMaCoins ganadas: heurística inicial proporcional al XP. */
export function estimateCoins(xp: number): number {
  return Math.round(xp * 0.06);
}
