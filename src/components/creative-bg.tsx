export function CreativeBg({ variant = "default" }: { variant?: "default" | "warm" | "cool" | "lime" }) {
  const palettes = {
    default: [
      { color: "#FF4B2C", pos: "top-[-10%] left-[-5%]", size: "w-[420px] h-[420px]" },
      { color: "#F4D79D", pos: "top-[30%] right-[-8%]", size: "w-[360px] h-[360px]", slow: true },
      { color: "#B0E4EA", pos: "bottom-[-12%] left-[25%]", size: "w-[480px] h-[480px]" },
    ],
    warm: [
      { color: "#FF4B2C", pos: "top-[-15%] right-[-10%]", size: "w-[500px] h-[500px]" },
      { color: "#F4C0D1", pos: "bottom-[-10%] left-[-5%]", size: "w-[420px] h-[420px]", slow: true },
      { color: "#F4D79D", pos: "top-[45%] left-[40%]", size: "w-[320px] h-[320px]" },
    ],
    cool: [
      { color: "#B0E4EA", pos: "top-[-10%] left-[-10%]", size: "w-[500px] h-[500px]" },
      { color: "#D6E889", pos: "bottom-[-15%] right-[5%]", size: "w-[420px] h-[420px]", slow: true },
      { color: "#FF4B2C", pos: "top-[40%] right-[-12%]", size: "w-[300px] h-[300px]" },
    ],
    lime: [
      { color: "#D6E889", pos: "top-[-10%] left-[30%]", size: "w-[480px] h-[480px]" },
      { color: "#F4D79D", pos: "bottom-[-10%] left-[-8%]", size: "w-[380px] h-[380px]", slow: true },
      { color: "#FF4B2C", pos: "top-[35%] right-[-10%]", size: "w-[320px] h-[320px]" },
    ],
  };

  const blobs = palettes[variant];

  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
      {blobs.map((b, i) => (
        <div
          key={i}
          className={`absolute ${b.pos} ${b.size} rounded-full blur-3xl opacity-[0.35] ${
            b.slow ? "animate-blob-slow" : "animate-blob"
          }`}
          style={{ backgroundColor: b.color, animationDelay: `${i * -6}s` }}
        />
      ))}
      {/* sparkles decorativos */}
      <Sparkle className="top-[18%] left-[12%] text-[#FF4B2C]" delay={0} />
      <Sparkle className="top-[60%] right-[20%] text-[#FF4B2C]" delay={1} />
      <Sparkle className="top-[35%] right-[8%] text-foreground" delay={2} />
      <Sparkle className="bottom-[22%] left-[45%] text-foreground" delay={0.5} />
    </div>
  );
}

function Sparkle({ className, delay = 0 }: { className: string; delay?: number }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`absolute w-5 h-5 animate-sparkle opacity-60 ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <path d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z" />
    </svg>
  );
}
