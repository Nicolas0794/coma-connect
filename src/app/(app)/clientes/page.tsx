import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function cop(n: number): string {
  return `$${n.toLocaleString("es-CO", { maximumFractionDigits: 0 })}`;
}

const activeStatuses = ["ACTIVE", "IN_REVIEW", "PUBLISHING"] as const;

export default async function ClientesPage() {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      campaigns: {
        select: {
          status: true,
          budget: true,
          updatedAt: true,
          campaignCreators: {
            select: { status: true },
          },
        },
      },
      _count: { select: { campaigns: true } },
    },
  });

  const enriched = clients.map((c) => {
    let activeCount = 0;
    let totalInvestment = 0;
    let latest: Date | null = null;

    for (const camp of c.campaigns) {
      if ((activeStatuses as readonly string[]).includes(camp.status)) {
        activeCount++;
      }
      const budget = camp.budget ? Number(camp.budget) : 0;
      const creators = camp.campaignCreators.filter(
        (cc) => cc.status !== "DECLINED" && cc.status !== "REMOVED",
      ).length;
      totalInvestment += budget * Math.max(creators, 1);
      if (!latest || camp.updatedAt > latest) latest = camp.updatedAt;
    }

    return {
      ...c,
      activeCount,
      totalInvestment,
      lastActivity: latest,
    };
  });

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl text-foreground">Clientes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {clients.length === 0
              ? "Todavía no hay clientes cargados."
              : `${clients.length} cliente${clients.length > 1 ? "s" : ""} registrado${clients.length > 1 ? "s" : ""}`}
          </p>
        </div>
        <Link href="/clientes/nuevo">
          <Button>Nuevo cliente</Button>
        </Link>
      </div>

      {enriched.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Nombre
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">
                  Industria
                </th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">
                  Activas
                </th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">
                  Total
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">
                  Inversión
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">
                  Última actividad
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {enriched.map((client) => (
                <tr
                  key={client.id}
                  className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/clientes/${client.id}`}
                      className="font-medium text-foreground hover:text-primary transition-colors"
                    >
                      {client.name}
                    </Link>
                    {client.legalName && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {client.legalName}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {client.industry ? (
                      <Badge variant="secondary">{client.industry}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {client.activeCount > 0 ? (
                      <Badge className="bg-[#FF4B2C]/10 text-[#FF4B2C] border-0">
                        {client.activeCount}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    <span className="font-medium">{client._count.campaigns}</span>
                  </td>
                  <td className="px-4 py-3 text-right hidden lg:table-cell text-muted-foreground">
                    {client.totalInvestment > 0 ? cop(client.totalInvestment) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right hidden lg:table-cell text-muted-foreground text-xs">
                    {client.lastActivity
                      ? client.lastActivity.toLocaleDateString("es-CO", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/clientes/${client.id}`}>
                      <Button variant="ghost" size="xs">
                        Ver
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {clients.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-muted-foreground mb-4">
            Cargá tu primer cliente para empezar a crear campañas.
          </p>
          <Link href="/clientes/nuevo">
            <Button>Crear primer cliente</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
