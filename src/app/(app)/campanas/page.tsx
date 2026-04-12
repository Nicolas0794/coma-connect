import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const statusLabels: Record<string, string> = {
  DRAFT: "Borrador",
  ACTIVE: "Activa",
  IN_REVIEW: "En revisión",
  PUBLISHING: "Publicando",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
};

const statusColors: Record<string, string> = {
  DRAFT: "bg-secondary text-muted-foreground",
  ACTIVE: "bg-[#D6E889]/30 text-lime-700 border-[#D6E889]/50",
  IN_REVIEW: "bg-[#F4D79D]/30 text-amber-700 border-[#F4D79D]/50",
  PUBLISHING: "bg-[#B0E4EA]/30 text-teal-700 border-[#B0E4EA]/50",
  COMPLETED: "bg-primary/10 text-primary border-primary/20",
  CANCELLED: "bg-destructive/10 text-destructive border-destructive/20",
};

export default async function CampanasPage() {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { name: true } },
      _count: { select: { campaignCreators: true } },
    },
  });

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl text-foreground">Campañas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {campaigns.length === 0
              ? "Todavía no hay campañas creadas."
              : `${campaigns.length} campaña${campaigns.length > 1 ? "s" : ""}`}
          </p>
        </div>
        <Link href="/campanas/nueva">
          <Button>Nueva campaña</Button>
        </Link>
      </div>

      {campaigns.length > 0 ? (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <Link
              key={c.id}
              href={`/campanas/${c.id}`}
              className="group flex items-center justify-between rounded-xl border border-border bg-card p-5 hover:shadow-md transition-all duration-200"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {c.name}
                  </h3>
                  <span className="text-xs text-muted-foreground">{c.code}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {c.client.name}
                  {c.startDate && (
                    <span className="ml-2">
                      · {new Date(c.startDate).toLocaleDateString("es-CO", { month: "short", year: "numeric" })}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {c._count.campaignCreators} creador{c._count.campaignCreators !== 1 ? "es" : ""}
                </span>
                <Badge variant="outline" className={statusColors[c.status]}>
                  {statusLabels[c.status] ?? c.status}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-muted-foreground mb-4">
            Cargá clientes y creadores primero, después creá tu primera campaña.
          </p>
          <Link href="/campanas/nueva">
            <Button>Crear primera campaña</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
