/* eslint-disable @next/next/no-img-element */

// Estilos de DiceBear con humanos ilustrados (nada de robots):
// - adventurer: humanos estilizados con mucha variedad
// - lorelei: retratos ilustrados modernos
// - notionists: estilo Notion, limpio y editorial
// - micah: humanos minimalistas
const ARCHETYPES = [
  { seed: "NovaStyle", role: "Fashion Creator", style: "notionists", color: "FF4B2C", area: "Moda / UGC", bg: "bg-[#FF4B2C]/10" },
  { seed: "AmaraCook", role: "Food Storyteller", style: "adventurer", color: "F4D79D", area: "Gastronomía", bg: "bg-[#F4D79D]/30" },
  { seed: "KiraTechX", role: "Tech Reviewer", style: "lorelei", color: "B0E4EA", area: "Tecnología", bg: "bg-[#B0E4EA]/40" },
  { seed: "FitPulse", role: "Fitness Coach", style: "micah", color: "D6E889", area: "Bienestar", bg: "bg-[#D6E889]/40" },
  { seed: "LunaGlow", role: "Beauty Guru", style: "lorelei", color: "F4C0D1", area: "Belleza", bg: "bg-[#F4C0D1]/40" },
  { seed: "RexGamer", role: "Gaming Streamer", style: "adventurer", color: "FF7A66", area: "Gaming", bg: "bg-[#FF4B2C]/15" },
  { seed: "AyaWander", role: "Travel Vlogger", style: "notionists", color: "B0E4EA", area: "Viajes", bg: "bg-[#B0E4EA]/40" },
  { seed: "SonicMuse", role: "Music Artist", style: "micah", color: "F4D79D", area: "Música", bg: "bg-[#F4D79D]/40" },
];

function dicebearUrl(style: string, seed: string, bg: string) {
  const backgroundColor = bg.replace("#", "");
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${backgroundColor}&radius=50`;
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
          <p className="text-xs uppercase tracking-[0.2em] text-[#FF4B2C] font-semibold mb-3">
            Los creadores del futuro
          </p>
          <h2 className="text-3xl md:text-5xl font-bold leading-tight max-w-3xl mx-auto">
            Cada creatividad, su propia <span className="text-[#FF4B2C]">arena</span>.
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            Moda, comida, tech, fitness, música, viajes, gaming, beauty. CoMa abraza todas las
            áreas donde la creatividad se vuelve carrera.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {ARCHETYPES.map((a, i) => (
            <div
              key={a.seed}
              className="group relative rounded-3xl border border-border bg-card p-5 card-interactive text-center"
              style={{ animation: `slide-up 0.5s ease-out ${i * 0.05}s both` }}
            >
              <div className={`relative mx-auto mb-3 aspect-square w-28 rounded-full ${a.bg} overflow-hidden`}>
                <img
                  src={dicebearUrl(a.style, a.seed, a.color)}
                  alt={`${a.role} avatar`}
                  loading="lazy"
                  className="w-full h-full transition-transform duration-500 group-hover:scale-110"
                />
                {/* halo pulsante visible en hover */}
                <div className="absolute inset-0 rounded-full ring-2 ring-[#FF4B2C]/0 group-hover:ring-[#FF4B2C]/30 transition-all" />
              </div>
              <p className="text-[11px] uppercase tracking-widest text-[#FF4B2C] font-semibold">
                {a.area}
              </p>
              <p className="font-bold text-sm mt-1">{a.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Mini floating avatars — decorativos para heros. */
export function FloatingAvatars({ variant = "trio" }: { variant?: "duo" | "trio" }) {
  const picks = variant === "trio"
    ? [ARCHETYPES[0], ARCHETYPES[2], ARCHETYPES[5]]
    : [ARCHETYPES[1], ARCHETYPES[6]];

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {picks.map((a, i) => {
        const positions = [
          "top-[15%] right-[6%]",
          "top-[55%] right-[18%]",
          "bottom-[18%] right-[4%]",
        ];
        const sizes = ["w-20 h-20", "w-16 h-16", "w-24 h-24"];
        const anims = ["animate-blob", "animate-blob-slow", "animate-wiggle"];
        return (
          <div
            key={a.seed}
            className={`absolute ${positions[i]} ${sizes[i]} ${anims[i]} rounded-full ${a.bg} shadow-xl border-2 border-background overflow-hidden`}
            style={{ animationDelay: `${i * -4}s` }}
          >
            <img
              src={dicebearUrl(a.style, a.seed, a.color)}
              alt=""
              loading="lazy"
              className="w-full h-full"
            />
          </div>
        );
      })}
    </div>
  );
}
