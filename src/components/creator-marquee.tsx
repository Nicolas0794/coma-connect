const TAGS = [
  "UGC", "Storytelling", "Reels", "TikTok", "Filmmaking", "Fotografía",
  "IA para creadores", "Edición", "Copywriting", "Diseño",
  "Beauty", "Moda", "Food", "Lifestyle", "Tech", "Gaming",
  "Fitness", "Viajes", "Música", "Educación", "Sostenibilidad",
  "Automotriz", "Arte", "Comedia", "Parenting",
];

const COLORS = [
  "bg-[#FF4B2C]/10 text-[#FF4B2C] border-[#FF4B2C]/30",
  "bg-[#F4D79D]/30 text-stone-700 border-[#F4D79D]/60",
  "bg-[#B0E4EA]/30 text-teal-700 border-[#B0E4EA]/60",
  "bg-[#D6E889]/30 text-lime-700 border-[#D6E889]/60",
  "bg-[#F4C0D1]/30 text-pink-700 border-[#F4C0D1]/60",
];

export function CreatorMarquee() {
  // Duplicamos los tags para loop infinito sin salto
  const loop = [...TAGS, ...TAGS];

  return (
    <div className="relative border-y border-border bg-muted/30 py-5 overflow-hidden">
      <div className="flex gap-3 animate-marquee whitespace-nowrap will-change-transform">
        {loop.map((tag, i) => (
          <span
            key={i}
            className={`shrink-0 rounded-full border px-5 py-1.5 text-sm font-medium ${
              COLORS[i % COLORS.length]
            }`}
          >
            {tag}
          </span>
        ))}
      </div>
      {/* Fade edges */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent"
      />
    </div>
  );
}
