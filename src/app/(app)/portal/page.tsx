import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const statusLabels: Record<string, string> = {
  DRAFT: "Borrador",
  ACTIVE: "Activa",
  IN_REVIEW: "En revisión",
  PUBLISHING: "Publicando",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
};

export default async function PortalClientePage() {
  const session = await auth();
  if (session?.user?.role !== "CLIENT") redirect("/");

  const membership = await prisma.clientMember.findFirst({
    where: { userId: session.user.id },
    select: { clientId: true, client: { select: { name: true } } },
  });

  if (!membership) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <h1 className="text-2xl text-foreground">Portal del cliente</h1>
        <p className="text-muted-foreground mt-2">
          Tu cuenta todavía no está vinculada a un cliente. Contactá al equipo de CoMa.
        </p>
      </div>
    );
  }

  const campaigns = await prisma.campaign.findMany({
    where: { clientId: membership.clientId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { campaignCreators: true } },
    },
  });

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl text-foreground">{membership.client.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Bienvenido a Orange Space
          </p>
        </div>
        <Link href="/portal/nueva-campana">
          <Button>Nueva campaña</Button>
        </Link>
      </div>

      {campaigns.length > 0 ? (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <Link
              key={c.id}
              href={`/portal/${c.id}`}
              className="group flex items-center justify-between rounded-xl border border-border bg-card p-5 hover:shadow-md transition-all"
            >
              <div>
                <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                  {c.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {c._count.campaignCreators} creador{c._count.campaignCreators !== 1 ? "es" : ""}
                  {c.startDate && ` · ${new Date(c.startDate).toLocaleDateString("es-CO", { month: "short", year: "numeric" })}`}
                </p>
              </div>
              <Badge variant="outline">{statusLabels[c.status] ?? c.status}</Badge>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">Todavía no tenés campañas activas.</p>
        </div>
      )}
    </div>
  );
}
