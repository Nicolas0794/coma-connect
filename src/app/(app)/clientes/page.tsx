import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function ClientesPage() {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { campaigns: true } },
    },
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

      {clients.length > 0 && (
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
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">
                  Contacto
                </th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">
                  Campañas
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
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
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                    {client.email ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-medium">{client._count.campaigns}</span>
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
