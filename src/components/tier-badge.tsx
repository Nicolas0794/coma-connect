import { TIER_META, type Tier } from "@/lib/creator-report";

interface Props {
  tier: Tier;
  size?: "sm" | "md";
  showLabel?: boolean;
}

export function TierBadge({ tier, size = "sm", showLabel = true }: Props) {
  const meta = TIER_META[tier];
  const padding = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";
  return (
    <span
      title={`Nivel ${meta.label}`}
      className={`inline-flex items-center gap-1 rounded-md font-semibold ${padding} ${meta.bg} ${meta.color}`}
    >
      <span aria-hidden>{meta.emoji}</span>
      {showLabel && <span>{meta.label}</span>}
    </span>
  );
}
