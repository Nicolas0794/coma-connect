import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { redirect } from "next/navigation";
import { getClientReport } from "@/lib/client-report";
import { ClientReportView } from "@/components/client-report-view";

async function deleteClient(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  await prisma.client.delete({ where: { id } });
  redirect("/clientes");
}

export default async function ClienteDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      campaigns: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          code: true,
          status: true,
          startDate: true,
          endDate: true,
          campaignCreators: {
            select: {
              id: true,
              status: true,
              acceptedAt: true,
              completedAt: true,
              creator: {
                select: { id: true, fullName: true, profileImageUrl: true },
              },
              contentPieces: {
                select: { id: true, status: true },
              },
            },
            orderBy: { invitedAt: "desc" },
          },
        },
      },
      _count: { select: { campaigns: true, members: true } },
    },
  });

  if (!client) notFound();

  const report = await getClientReport(id);

  const campaignStatusLabels: Record<string, string> = {
    DRAFT: "Borrador",
    ACTIVE: "Activa",
    IN_REVIEW: "En revisión",
    PUBLISHING: "Publicando",
    COMPLETED: "Completada",
    CANCELLED: "Cancelada",
  };

  const ccStatusMeta: Record<string, { label: string; tone: string }> = {
    INVITED: { label: "Invitada", tone: "text-stone-600 bg-stone-100" },
    ACCEPTED: { label: "Aceptada", tone: "text-[#FF4B2C] bg-[#FF4B2C]/10" },
    DECLINED: { label: "Rechazada", tone: "text-stone-500 bg-stone-100" },
    ONBOARDING: { label: "Onboarding", tone: "text-amber-700 bg-amber-100" },
    ACTIVE: { label: "En producción", tone: "text-teal-700 bg-[#B0E4EA]/30" },
    COMPLETED: { label: "Completada", tone: "text-lime-700 bg-[#D6E889]/30" },
    REMOVED: { label: "Retirada", tone: "text-stone-500 bg-stone-100" },
  };

  const fields = [
    { label: "Razón social", value: client.legalName },
    { label: "Industria", value: client.industry },
    { label: "Email", value: client.email },
    { label: "Teléfono", value: client.phone },
    { label: "Sitio web", value: client.website },
  ];

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <Link
          href="/clientes"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Clientes
        </Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl text-foreground">{client.name}</h1>
          {client.industry && (
            <Badge variant="secondary" className="mt-2">
              {client.industry}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Link href={`/clientes/${id}/editar`}>
            <Button variant="outline" size="sm">
              Editar
            </Button>
          </Link>
          <form action={deleteClient}>
            <input type="hidden" name="id" value={id} />
            <Button
              type="submit"
              variant="destructive"
              size="sm"
            >
              Eliminar
            </Button>
          </form>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm text-muted-foreground mb-3">Información</h3>
          <dl className="space-y-2.5">
            {fields.map((f) => (
              <div key={f.label}>
                <dt className="text-xs text-muted-foreground">{f.label}</dt>
                <dd className="text-sm text-foreground mt-0.5">
                  {f.value ?? (
                    <span className="text-muted-foreground">—</span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm text-muted-foreground mb-3">Resumen</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-secondary p-3">
              <div className="text-2xl font-bold text-primary">
                {client._count.campaigns}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Campañas
              </div>
            </div>
            <div className="rounded-lg bg-secondary p-3">
              <div className="text-2xl font-bold text-foreground">
                {client._count.members}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Miembros
              </div>
            </div>
          </div>
        </div>
      </div>

      {client.notes && (
        <div className="rounded-xl border border-border bg-card p-5 mb-8">
          <h3 className="text-sm text-muted-foreground mb-2">Notas internas</h3>
          <p className="text-sm text-foreground whitespace-pre-wrap">
            {client.notes}
          </p>
        </div>
      )}

      {report && (
        <div className="mb-8">
          <ClientReportView report={report} campaignHrefBase="/campanas" />
        </div>
      )}

      <div>
        <h3 className="text-sm text-muted-foreground mb-4 uppercase tracking-wider font-medium">
          Detalle por campaña
        </h3>
        {client.campaigns.length > 0 ? (
          <div className="space-y-4">
            {client.campaigns.map((campaign) => {
              const activeCreators = campaign.campaignCreators.filter(
                (cc) => cc.status !== "DECLINED" && cc.status !== "REMOVED",
              );
              const declinedCount = campaign.campaignCreators.length - activeCreators.length;
              return (
                <div
                  key={campaign.id}
                  className="rounded-xl border border-border bg-card overflow-hidden"
                >
                  <Link
                    href={`/campanas/${campaign.id}`}
                    className="flex items-center justify-between px-5 py-3 bg-secondary/40 border-b border-border hover:bg-secondary transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-foreground">
                          {campaign.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {campaign.code}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {activeCreators.length} creadora
                        {activeCreators.length !== 1 ? "s" : ""}
                        {declinedCount > 0 && ` · ${declinedCount} rechazada${declinedCount !== 1 ? "s" : ""}`}
                        {campaign.startDate && (
                          <>
                            {" · "}Inicio{" "}
                            {new Date(campaign.startDate).toLocaleDateString("es-CO", {
                              day: "numeric",
                              month: "short",
                            })}
                          </>
                        )}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {campaignStatusLabels[campaign.status] ?? campaign.status}
                    </Badge>
                  </Link>

                  {activeCreators.length > 0 ? (
                    <ul className="divide-y divide-border">
                      {activeCreators.map((cc) => {
                        const meta =
                          ccStatusMeta[cc.status] ?? { label: cc.status, tone: "" };
                        const publishedPieces = cc.contentPieces.filter(
                          (p) => p.status === "PUBLISHED",
                        ).length;
                        const totalPieces = cc.contentPieces.length;
                        const initials = cc.creator.fullName
                          .split(" ")
                          .map((w) => w[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase();
                        return (
                          <li
                            key={cc.id}
                            className="flex items-center justify-between px-5 py-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {cc.creator.fullName}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                  {totalPieces > 0
                                    ? `${publishedPieces}/${totalPieces} pieza${totalPieces !== 1 ? "s" : ""} publicada${publishedPieces !== 1 ? "s" : ""}`
                                    : "Sin piezas aún"}
                                  {cc.acceptedAt && (
                                    <>
                                      {" · "}Aceptada{" "}
                                      {new Date(cc.acceptedAt).toLocaleDateString("es-CO", {
                                        day: "numeric",
                                        month: "short",
                                      })}
                                    </>
                                  )}
                                </p>
                              </div>
                            </div>
                            <div
                              className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold ${meta.tone}`}
                            >
                              {meta.label}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="px-5 py-4 text-xs text-muted-foreground">
                      Sin creadoras asignadas todavía.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Este cliente todavía no tiene campañas.
          </p>
        )}
      </div>
    </div>
  );
}
