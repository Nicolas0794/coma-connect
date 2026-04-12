import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const session = await auth();
  const role = session?.user?.role;

  if (role === "CLIENT") redirect("/portal");
  if (role === "CREATOR") redirect("/mi-espacio");

  const [clientCount, creatorCount, campaignCount] = await Promise.all([
    prisma.client.count(),
    prisma.creator.count(),
    prisma.campaign.count(),
  ]);

  const firstName = session?.user?.name?.split(" ")[0] ?? session?.user?.email;

  const stats = [
    {
      label: "Clientes",
      value: clientCount,
      bg: "bg-[#FF4B2C]/8",
      border: "border-[#FF4B2C]/15",
      accent: "text-[#FF4B2C]",
      href: "/clientes",
    },
    {
      label: "Creadores",
      value: creatorCount,
      bg: "bg-[#B0E4EA]/25",
      border: "border-[#B0E4EA]/50",
      accent: "text-teal-700",
      href: "/creadores",
    },
    {
      label: "Campañas",
      value: campaignCount,
      bg: "bg-[#D6E889]/25",
      border: "border-[#D6E889]/50",
      accent: "text-lime-700",
      href: "/campanas",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="animate-fade-in mb-8 mt-2">
        <h1 className="text-2xl text-foreground">Hola, {firstName}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Esto es lo que está pasando hoy en CoMa.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map((stat, i) => (
          <a
            key={stat.label}
            href={stat.href}
            className={`animate-slide-up stagger-${i + 1} rounded-xl border ${stat.border} ${stat.bg} p-5 transition-all duration-200 hover:shadow-md block`}
          >
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {stat.label}
            </p>
            <p className={`text-3xl font-medium mt-1 ${stat.accent}`}>
              {stat.value}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
