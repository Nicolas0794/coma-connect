"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import Link from "next/link";

type Level = "ROOKIE" | "CREATOR" | "PRO" | "ELITE" | "LEGEND";

const LEVEL_ORDER: Level[] = ["ROOKIE", "CREATOR", "PRO", "ELITE", "LEGEND"];

function hasLevel(current: Level, required: Level): boolean {
  return LEVEL_ORDER.indexOf(current) >= LEVEL_ORDER.indexOf(required);
}

const STYLES = [
  { key: "notionists", label: "Notion" },
  { key: "adventurer", label: "Adventurer" },
  { key: "lorelei", label: "Ilustrado" },
  { key: "micah", label: "Minimal" },
  { key: "personas", label: "Personas" },
] as const;

const FRAMES = [
  { key: "circle", label: "Círculo", required: "ROOKIE" as Level },
  { key: "hex", label: "Hex cyber", required: "CREATOR" as Level },
  { key: "ring", label: "Neon ring", required: "PRO" as Level },
  { key: "gem", label: "Diamante", required: "ELITE" as Level },
  { key: "halo", label: "Halo dorado", required: "LEGEND" as Level },
];

const ACCESSORIES = [
  { key: "cam", emoji: "📸", label: "Cámara creator", required: "ROOKIE" as Level, xp: 0 },
  { key: "light", emoji: "💡", label: "Ring light pro", required: "CREATOR" as Level, xp: 500 },
  { key: "mic", emoji: "🎙️", label: "Mic studio", required: "CREATOR" as Level, xp: 800 },
  { key: "headset", emoji: "🎧", label: "Auriculares gaming", required: "PRO" as Level, xp: 2500 },
  { key: "drone", emoji: "🚁", label: "Drone 4K", required: "PRO" as Level, xp: 4000 },
  { key: "vr", emoji: "🥽", label: "AR/VR studio", required: "ELITE" as Level, xp: 8000 },
  { key: "crown", emoji: "👑", label: "Corona Legend", required: "LEGEND" as Level, xp: 20000 },
];

const BACKGROUNDS = [
  { key: "peach", color: "#FFDCC8", label: "Peach", required: "ROOKIE" as Level },
  { key: "sky", color: "#B0E4EA", label: "Sky", required: "ROOKIE" as Level },
  { key: "lime", color: "#D6E889", label: "Lime", required: "CREATOR" as Level },
  { key: "magma", color: "#FF4B2C", label: "Magma", required: "PRO" as Level },
  { key: "cyber", color: "#1F1B18", label: "Cyber", required: "ELITE" as Level },
];

function dicebearUrl(style: string, seed: string, bgHex: string) {
  const bg = bgHex.replace("#", "");
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${bg}&radius=50`;
}

export function AvatarStudio({
  seed,
  currentLevel,
}: {
  seed: string;
  currentLevel: Level;
}) {
  const [style, setStyle] = useState<(typeof STYLES)[number]["key"]>("notionists");
  const [frame, setFrame] = useState<string>("hex");
  const [bg, setBg] = useState<string>("#FFDCC8");
  const [accessory, setAccessory] = useState<string>("cam");

  const currentAcc = ACCESSORIES.find((a) => a.key === accessory);
  const frameStyle = (() => {
    switch (frame) {
      case "hex":
        return {
          clipPath: "polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%)",
        };
      case "gem":
        return {
          clipPath: "polygon(50% 0, 100% 38%, 82% 100%, 18% 100%, 0 38%)",
        };
      case "halo":
      case "ring":
      case "circle":
      default:
        return { borderRadius: "50%" };
    }
  })();

  const frameRingClass =
    frame === "ring"
      ? "ring-4 ring-[#FF4B2C] ring-offset-4 ring-offset-[#1F1B18]"
      : frame === "halo"
      ? "ring-4 ring-[#F4D79D] ring-offset-4 ring-offset-[#1F1B18]"
      : "";

  return (
    <section className="mb-8 rounded-2xl border border-border bg-[#1F1B18] text-stone-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
        <div>
          <p className="text-[10px] font-mono tracking-widest text-stone-500">AVATAR STUDIO · BETA</p>
          <h2 className="text-lg font-bold text-white mt-0.5">Personalizá tu alter ego CoMa</h2>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-stone-400 tracking-widest">
          NIVEL · {currentLevel}
        </span>
      </div>

      <div className="grid lg:grid-cols-[320px_1fr]">
        {/* Preview */}
        <div className="relative p-8 flex flex-col items-center border-b lg:border-b-0 lg:border-r border-white/[0.06]">
          <div className="relative">
            {/* aura */}
            <div
              aria-hidden
              className="absolute inset-0 rounded-full blur-2xl opacity-60 scale-110"
              style={{ backgroundColor: bg }}
            />
            <div
              className={`relative w-48 h-48 overflow-hidden border-2 border-white/10 ${frameRingClass}`}
              style={frameStyle}
            >
              <img
                src={dicebearUrl(style, seed, bg)}
                alt="Tu avatar"
                loading="lazy"
                className="w-full h-full transition-transform duration-500"
                key={`${style}-${bg}`}
              />
            </div>
            {/* Accesorio equipado */}
            {currentAcc && (
              <div
                className="absolute -bottom-3 -right-3 w-16 h-16 rounded-2xl bg-[#FF4B2C] flex items-center justify-center text-3xl border-2 border-[#1F1B18] shadow-xl animate-wiggle"
                title={currentAcc.label}
              >
                {currentAcc.emoji}
              </div>
            )}
          </div>
          <p className="mt-6 font-bold text-white">@{seed.toLowerCase().replace(/\s+/g, ".")}</p>
          <p className="text-[11px] font-mono tracking-widest text-stone-500 mt-1">
            {STYLES.find((s) => s.key === style)?.label} · {frame} · {currentAcc?.label}
          </p>

          <button
            className="mt-5 rounded-full bg-[#FF4B2C] text-white px-5 py-2 text-sm font-semibold hover:opacity-90 transition opacity-60 cursor-not-allowed"
            disabled
            title="Próximamente"
          >
            Guardar look
          </button>
          <p className="text-[10px] text-stone-500 mt-2">
            💾 persistencia — próximamente
          </p>
        </div>

        {/* Wardrobe */}
        <div className="p-6 space-y-6">
          <Section title="Estilo">
            <div className="flex flex-wrap gap-2">
              {STYLES.map((s) => (
                <Chip
                  key={s.key}
                  active={style === s.key}
                  onClick={() => setStyle(s.key)}
                  label={s.label}
                />
              ))}
            </div>
          </Section>

          <Section title="Frame">
            <div className="flex flex-wrap gap-2">
              {FRAMES.map((f) => {
                const unlocked = hasLevel(currentLevel, f.required);
                return (
                  <Chip
                    key={f.key}
                    active={frame === f.key}
                    onClick={() => unlocked && setFrame(f.key)}
                    disabled={!unlocked}
                    label={unlocked ? f.label : `🔒 ${f.label}`}
                    sublabel={unlocked ? undefined : `${f.required}`}
                  />
                );
              })}
            </div>
          </Section>

          <Section title="Fondo">
            <div className="flex flex-wrap gap-2">
              {BACKGROUNDS.map((b) => {
                const unlocked = hasLevel(currentLevel, b.required);
                return (
                  <button
                    key={b.key}
                    type="button"
                    disabled={!unlocked}
                    onClick={() => unlocked && setBg(b.color)}
                    className={`relative h-9 w-9 rounded-full border-2 transition ${
                      bg === b.color ? "border-white scale-110" : "border-white/20"
                    } ${!unlocked ? "opacity-30 cursor-not-allowed" : "hover:scale-105"}`}
                    style={{ backgroundColor: b.color }}
                    title={unlocked ? b.label : `Desbloquea en ${b.required}`}
                  >
                    {!unlocked && (
                      <span className="absolute inset-0 flex items-center justify-center text-xs">🔒</span>
                    )}
                  </button>
                );
              })}
            </div>
          </Section>

          <Section title="Accesorio">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {ACCESSORIES.map((a) => {
                const unlocked = hasLevel(currentLevel, a.required);
                return (
                  <button
                    key={a.key}
                    type="button"
                    disabled={!unlocked}
                    onClick={() => unlocked && setAccessory(a.key)}
                    className={`relative aspect-square rounded-xl border flex flex-col items-center justify-center gap-0.5 text-xs transition ${
                      accessory === a.key
                        ? "border-[#FF4B2C] bg-[#FF4B2C]/10 text-white"
                        : "border-white/10 bg-white/[0.03] text-stone-400 hover:bg-white/[0.06]"
                    } ${!unlocked ? "opacity-40 cursor-not-allowed" : ""}`}
                  >
                    <span className="text-2xl">{unlocked ? a.emoji : "🔒"}</span>
                    <span className="text-[9px] font-mono tracking-widest leading-tight text-center px-1">
                      {unlocked ? a.label : a.required}
                    </span>
                  </button>
                );
              })}
            </div>
          </Section>

          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-3 flex items-center justify-between">
            <p className="text-xs text-stone-400">
              Subí de nivel para desbloquear más estilo.
            </p>
            <Link
              href="/metodo"
              className="text-xs font-semibold text-[#FF7A66] hover:text-[#FF4B2C]"
            >
              Ver sistema →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-mono tracking-widest text-stone-500 mb-2">
        {title.toUpperCase()}
      </p>
      {children}
    </div>
  );
}

function Chip({
  active,
  disabled,
  onClick,
  label,
  sublabel,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: string;
  sublabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full px-3 py-1.5 text-xs border transition ${
        active
          ? "border-[#FF4B2C] bg-[#FF4B2C]/10 text-white font-semibold"
          : "border-white/10 bg-white/[0.03] text-stone-400 hover:bg-white/[0.06]"
      } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
    >
      {label}
      {sublabel && <span className="ml-1 text-[9px] font-mono opacity-70">{sublabel}</span>}
    </button>
  );
}
