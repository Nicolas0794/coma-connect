/* eslint-disable @next/next/no-img-element */

type Archetype = {
  seed: string;
  handle: string;
  role: string;
  area: string;
  prop: string;
  propLabel: string;
  style: "notionists" | "lorelei" | "adventurer" | "micah";
  accent: string;
  accentBg: string;
  propBg: string;
  followers: string;
  score: number;
};

const ARCHETYPES: Archetype[] = [
  {
    seed: "NovaStyle",
    handle: "@nova.style",
    role: "Fashion Creator",
    area: "MODA · UGC",
    prop: "📸",
    propLabel: "Ring light + DSLR",
    style: "notionists",
    accent: "#FF4B2C",
    accentBg: "bg-[#FF4B2C]",
    propBg: "bg-[#FF4B2C]",
    followers: "245K",
    score: 92,
  },
  {
    seed: "AmaraCook",
    handle: "@amara.cooks",
    role: "Food Storyteller",
    area: "GASTRO · REELS",
    prop: "🍳",
    propLabel: "Cámara cenital + overlay IA",
    style: "adventurer",
    accent: "#F4D79D",
    accentBg: "bg-[#F4D79D]",
    propBg: "bg-[#E8C272]",
    followers: "128K",
    score: 88,
  },
  {
    seed: "KiraTechX",
    handle: "@kira.tech",
    role: "Tech Reviewer",
    area: "TECH · LONG VIDEO",
    prop: "🎧",
    propLabel: "Setup studio + neural lens",
    style: "lorelei",
    accent: "#B0E4EA",
    accentBg: "bg-[#B0E4EA]",
    propBg: "bg-[#7BC7CE]",
    followers: "512K",
    score: 95,
  },
  {
    seed: "FitPulse",
    handle: "@pulse.fit",
    role: "Fitness Coach",
    area: "WELLNESS · SHORTS",
    prop: "🏋️",
    propLabel: "Wearable tracker + 360 cam",
    style: "micah",
    accent: "#D6E889",
    accentBg: "bg-[#D6E889]",
    propBg: "bg-[#B8D14F]",
    followers: "89K",
    score: 86,
  },
  {
    seed: "LunaGlow",
    handle: "@luna.glow",
    role: "Beauty Guru",
    area: "BEAUTY · UGC",
    prop: "💄",
    propLabel: "Macro lens + holo-mirror",
    style: "lorelei",
    accent: "#F4C0D1",
    accentBg: "bg-[#F4C0D1]",
    propBg: "bg-[#E590AB]",
    followers: "1.2M",
    score: 97,
  },
  {
    seed: "RexGamer",
    handle: "@rex.play",
    role: "Gaming Streamer",
    area: "GAMING · LIVE",
    prop: "🎮",
    propLabel: "Rig dual + capture IA",
    style: "adventurer",
    accent: "#FF7A66",
    accentBg: "bg-[#FF7A66]",
    propBg: "bg-[#FF4B2C]",
    followers: "870K",
    score: 91,
  },
  {
    seed: "AyaWander",
    handle: "@aya.wander",
    role: "Travel Vlogger",
    area: "VIAJES · CINEMATIC",
    prop: "🎥",
    propLabel: "Drone + gimbal neural",
    style: "notionists",
    accent: "#B0E4EA",
    accentBg: "bg-[#B0E4EA]",
    propBg: "bg-[#7BC7CE]",
    followers: "334K",
    score: 89,
  },
  {
    seed: "SonicMuse",
    handle: "@sonic.muse",
    role: "Music Artist",
    area: "MÚSICA · REELS",
    prop: "🎙️",
    propLabel: "Condensador + AI mastering",
    style: "micah",
    accent: "#F4D79D",
    accentBg: "bg-[#F4D79D]",
    propBg: "bg-[#E8C272]",
    followers: "156K",
    score: 84,
  },
];

function dicebearUrl(style: string, seed: string, bg = "transparent") {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${bg}&radius=50`;
}

function FuturisticCard({ a, index }: { a: Archetype; index: number }) {
  return (
    <div
      className="group relative rounded-3xl border border-border bg-[#1F1B18] text-stone-200 overflow-hidden card-interactive"
      style={{ animation: `slide-up 0.5s ease-out ${index * 0.05}s both` }}
    >
      {/* grid pattern + scanline */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[2px] opacity-60 blur-[0.5px]"
        style={{
          background: `linear-gradient(90deg, transparent, ${a.accent}, transparent)`,
          animation: "marquee 6s linear infinite",
        }}
      />

      {/* Header — ID tag */}
      <div className="relative flex items-center justify-between px-5 pt-4 text-[10px] font-mono">
        <span className="flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-70"
              style={{ backgroundColor: a.accent }}
            />
            <span
              className="relative inline-flex h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: a.accent }}
            />
          </span>
          <span className="tracking-widest text-stone-400">CREATOR.ID</span>
        </span>
        <span className="tracking-widest text-stone-500">#{String(index + 1).padStart(3, "0")}</span>
      </div>

      {/* Avatar con frame hexagonal + aura neón */}
      <div className="relative flex justify-center py-5">
        <div className="relative">
          {/* aura */}
          <div
            aria-hidden
            className="absolute inset-0 rounded-[2rem] blur-2xl opacity-50 scale-110"
            style={{ backgroundColor: a.accent }}
          />
          {/* frame */}
          <div
            className="relative w-28 h-28 overflow-hidden border-2"
            style={{
              borderColor: a.accent,
              clipPath: "polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%)",
            }}
          >
            <div
              className={`absolute inset-0 ${a.accentBg} opacity-25`}
            />
            <img
              src={dicebearUrl(a.style, a.seed)}
              alt={`${a.role} avatar`}
              loading="lazy"
              className="relative w-full h-full transition-transform duration-500 group-hover:scale-110"
            />
            {/* scanline */}
            <div
              aria-hidden
              className="absolute inset-x-0 h-[2px] opacity-60"
              style={{
                backgroundColor: a.accent,
                animation: "scanline 3s ease-in-out infinite",
              }}
            />
          </div>

          {/* Prop icon flotando */}
          <div
            className={`absolute -bottom-2 -right-3 w-12 h-12 rounded-2xl ${a.propBg} flex items-center justify-center text-2xl border-2 border-[#1F1B18] shadow-lg group-hover:animate-wiggle`}
            title={a.propLabel}
          >
            {a.prop}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="relative px-5 pb-5 text-center">
        <p
          className="text-[10px] font-mono tracking-widest mb-1"
          style={{ color: a.accent }}
        >
          {a.area}
        </p>
        <p className="font-bold text-base text-white leading-tight">{a.role}</p>
        <p className="text-[11px] text-stone-500 font-mono mt-0.5">{a.handle}</p>

        {/* Stats tipo dashboard */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-left">
          <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] px-2.5 py-1.5">
            <p className="text-[9px] uppercase tracking-widest text-stone-500 font-mono">Followers</p>
            <p className="text-sm font-bold text-white tabular-nums">{a.followers}</p>
          </div>
          <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] px-2.5 py-1.5">
            <p className="text-[9px] uppercase tracking-widest text-stone-500 font-mono">CScore</p>
            <p className="text-sm font-bold tabular-nums" style={{ color: a.accent }}>
              {a.score}
            </p>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-center gap-1.5 text-[10px] font-mono text-stone-500 tracking-widest">
          <span className="opacity-60">⌁</span>
          <span>HERRAMIENTA · {a.prop}</span>
          <span className="opacity-60">⌁</span>
        </div>
      </div>
    </div>
  );
}

export function CreatorAvatarGrid() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-grain">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[20%] left-[-8%] w-[400px] h-[400px] rounded-full bg-[#FF4B2C]/10 blur-3xl animate-blob" />
        <div className="absolute bottom-[-10%] right-[5%] w-[360px] h-[360px] rounded-full bg-[#B0E4EA]/20 blur-3xl animate-blob-slow" />
      </div>
      <div className="mx-auto max-w-6xl px-6 py-20 relative">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.2em] text-[#FF4B2C] font-semibold mb-3 font-mono">
            Creator.Archetypes · v1
          </p>
          <h2 className="text-3xl md:text-5xl font-bold leading-tight max-w-3xl mx-auto">
            Los creadores del futuro operan en <span className="text-[#FF4B2C]">CoMa</span>.
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            Cada uno con su arena, sus herramientas y su reputación medible. Así se ve un perfil
            en el sistema — estética cyber, datos reales.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {ARCHETYPES.map((a, i) => (
            <FuturisticCard key={a.seed} a={a} index={i} />
          ))}
        </div>
        <p className="text-center text-[10px] font-mono text-stone-500 mt-8 tracking-widest">
          // PERFILES ILUSTRATIVOS · LOS DATOS SE GENERAN DINÁMICAMENTE DESDE CAMPAÑAS REALES
        </p>
      </div>
    </section>
  );
}

/** Mini avatares flotantes decorativos para heros. */
export function FloatingAvatars({ variant = "trio" }: { variant?: "duo" | "trio" }) {
  const picks =
    variant === "trio"
      ? [ARCHETYPES[0], ARCHETYPES[2], ARCHETYPES[5]]
      : [ARCHETYPES[1], ARCHETYPES[6]];

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {picks.map((a, i) => {
        const positions = [
          "top-[12%] right-[5%]",
          "top-[50%] right-[15%]",
          "bottom-[14%] right-[3%]",
        ];
        const sizes = ["w-24 h-24", "w-20 h-20", "w-28 h-28"];
        const anims = ["animate-blob", "animate-blob-slow", "animate-wiggle"];
        return (
          <div
            key={a.seed}
            className={`absolute ${positions[i]} ${sizes[i]} ${anims[i]}`}
            style={{ animationDelay: `${i * -4}s` }}
          >
            {/* aura */}
            <div
              className="absolute inset-0 rounded-full blur-xl opacity-60 scale-110"
              style={{ backgroundColor: a.accent }}
            />
            {/* frame + avatar */}
            <div
              className="relative w-full h-full overflow-hidden border-2 bg-background"
              style={{
                borderColor: a.accent,
                clipPath: "polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%)",
              }}
            >
              <img
                src={dicebearUrl(a.style, a.seed)}
                alt=""
                loading="lazy"
                className="w-full h-full"
              />
            </div>
            {/* prop mini */}
            <div
              className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-xl ${a.propBg} flex items-center justify-center text-base border-2 border-background shadow-md`}
            >
              {a.prop}
            </div>
          </div>
        );
      })}
    </div>
  );
}
