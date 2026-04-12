const avatars = [
  { src: "/creators/creator-1.png", size: 80, top: "6%", left: "4%", delay: "0s" },
  { src: "/creators/creator-3.png", size: 64, top: "4%", right: "7%", delay: "0.3s" },
  { src: "/creators/creator-4.png", size: 72, top: "38%", left: "1%", delay: "0.1s" },
  { src: "/creators/creator-2.png", size: 88, top: "30%", right: "2%", delay: "0.4s" },
  { src: "/creators/creator-6.png", size: 60, top: "68%", left: "6%", delay: "0.2s" },
  { src: "/creators/creator-8.png", size: 68, top: "62%", right: "5%", delay: "0.5s" },
  { src: "/creators/creator-7.png", size: 56, top: "88%", left: "15%", delay: "0.15s" },
];

export function CreatorAvatarsBg() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {avatars.map((av, i) => {
        const pos: React.CSSProperties = {
          top: av.top,
          animationDelay: av.delay,
        };
        if ("left" in av && av.left) pos.left = av.left;
        if ("right" in av && av.right) pos.right = av.right;

        return (
          <div
            key={i}
            className="absolute animate-fade-in"
            style={pos}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={av.src}
              alt=""
              width={av.size}
              height={av.size}
              className="rounded-full object-cover shadow-lg opacity-25 hover:opacity-50 transition-opacity duration-500"
              style={{ width: av.size, height: av.size }}
            />
          </div>
        );
      })}
    </div>
  );
}
