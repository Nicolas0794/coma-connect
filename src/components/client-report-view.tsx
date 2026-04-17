import Link from "next/link";
import type { ClientReport } from "@/lib/client-report";

const statusMeta: Record<
  keyof ClientReport["statusCounts"],
  { label: string; color: string }
> = {
  DRAFT: { label: "Borrador", color: "text-stone-600 bg-stone-100" },
  ACTIVE: { label: "Activas", color: "text-[#FF4B2C] bg-[#FF4B2C]/10" },
  IN_REVIEW: { label: "En revisión", color: "text-amber-700 bg-amber-100" },
  PUBLISHING: { label: "Publicando", color: "text-teal-700 bg-[#B0E4EA]/30" },
  COMPLETED: { label: "Completadas", color: "text-lime-700 bg-[#D6E889]/30" },
  CANCELLED: { label: "Canceladas", color: "text-stone-500 bg-stone-100" },
};

function cop(n: number): string {
  return `$${n.toLocaleString("es-CO", { maximumFractionDigits: 0 })}`;
}

interface Props {
  report: ClientReport;
  campaignHrefBase?: string; // "/portal" para cliente, "/campanas" para admin
  showInvestment?: boolean;
}

export function ClientReportView({
  report,
  campaignHrefBase = "/portal",
  showInvestment = true,
}: Props) {
  const maxTimeline = Math.max(1, ...report.timeline.map((t) => t.count));

  return (
    <div className="space-y-8">
      {/* Tiles de estado de campañas */}
      <section>
        <h2 className="text-sm text-muted-foreground mb-3 uppercase tracking-wider font-medium">
          Campañas por estado
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {(Object.keys(statusMeta) as (keyof typeof statusMeta)[]).map((k) => {
            const meta = statusMeta[k];
            const value = report.statusCounts[k];
            return (
              <div
                key={k}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div
                  className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${meta.color}`}
                >
                  {meta.label}
                </div>
                <div className="text-2xl font-bold text-foreground mt-2">
                  {value}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* KPIs agregados */}
      <section>
        <h2 className="text-sm text-muted-foreground mb-3 uppercase tracking-wider font-medium">
          Resultados acumulados
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiCard label="Publicaciones" value={report.totalPublished.toLocaleString("es-CO")} />
          <KpiCard label="Vistas totales" value={report.totalViews.toLocaleString("es-CO")} />
          <KpiCard label="Likes + comentarios" value={(report.totalLikes + report.totalComments).toLocaleString("es-CO")} />
          <KpiCard label="Creadoras únicas" value={String(report.uniqueCreators)} />
        </div>
      </section>

      {/* Inversión */}
      {showInvestment && (
        <section>
          <h2 className="text-sm text-muted-foreground mb-3 uppercase tracking-wider font-medium">
            Inversión
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <KpiCard label="Inversión total" value={cop(report.totalInvestment)} tone="primary" />
            <KpiCard label="Inversión en campañas activas" value={cop(report.activeInvestment)} />
          </div>
        </section>
      )}

      {/* Timeline */}
      <section>
        <h2 className="text-sm text-muted-foreground mb-3 uppercase tracking-wider font-medium">
          Campañas creadas (últimos 12 meses)
        </h2>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-end gap-2 h-32">
            {report.timeline.map((m) => {
              const heightPct = (m.count / maxTimeline) * 100;
              return (
                <div key={m.month} className="flex flex-col items-center gap-1 flex-1 min-w-0">
                  <div className="flex-1 w-full flex items-end">
                    <div
                      className={`w-full rounded-t-sm transition-all ${
                        m.count > 0 ? "bg-[#FF4B2C]" : "bg-stone-200"
                      }`}
                      style={{ height: `${Math.max(heightPct, m.count > 0 ? 8 : 3)}%` }}
                      title={`${m.count} campaña${m.count !== 1 ? "s" : ""}`}
                    />
                  </div>
                  <div className="text-[9px] text-muted-foreground uppercase tracking-wide truncate w-full text-center">
                    {m.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pagos próximos a vencer */}
      {report.pendingPayments.length > 0 && (
        <section>
          <h2 className="text-sm text-muted-foreground mb-3 uppercase tracking-wider font-medium">
            Pagos pendientes ({report.pendingPayments.length})
          </h2>
          <p className="text-xs text-muted-foreground mb-3">
            Al cerrarse cada campaña, hay 20 días hábiles para completar el pago a la creadora.
          </p>
          <div className="space-y-2">
            {report.pendingPayments.map((p) => {
              const urgent = p.overdue || p.daysRemaining <= 5;
              const warning = !urgent && p.daysRemaining <= 10;
              const tone = p.overdue
                ? "border-destructive/40 bg-destructive/5"
                : urgent
                ? "border-[#FF4B2C]/40 bg-[#FF4B2C]/5"
                : warning
                ? "border-amber-400/40 bg-amber-50"
                : "border-border bg-card";
              const chipColor = p.overdue
                ? "text-destructive bg-destructive/10"
                : urgent
                ? "text-[#FF4B2C] bg-[#FF4B2C]/10"
                : warning
                ? "text-amber-700 bg-amber-100"
                : "text-lime-700 bg-[#D6E889]/30";
              return (
                <Link
                  key={p.campaignCreatorId}
                  href={`${campaignHrefBase}/${p.campaignId}`}
                  className={`flex items-center justify-between rounded-xl border ${tone} px-4 py-3 hover:shadow-sm transition-all`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground text-sm">
                        {p.creatorName}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {p.campaignCode} · {p.campaignName}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Cerró {p.closedAt.toLocaleDateString("es-CO", { day: "numeric", month: "short" })}{" "}
                      · Pago hasta{" "}
                      {p.deadline.toLocaleDateString("es-CO", { day: "numeric", month: "short" })}
                      {p.amount != null && ` · ${cop(p.amount)}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <div className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-bold ${chipColor}`}>
                      {p.overdue
                        ? `Vencido hace ${Math.abs(p.daysRemaining)}d`
                        : p.daysRemaining === 0
                        ? "Vence hoy"
                        : `${p.daysRemaining}d restantes`}
                    </div>
                    {p.hasDocsSubmitted && (
                      <div className="text-[10px] text-muted-foreground mt-1">
                        Docs recibidos
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Top creadoras */}
      {report.topCreators.length > 0 && (
        <section>
          <h2 className="text-sm text-muted-foreground mb-3 uppercase tracking-wider font-medium">
            Top creadoras por performance
          </h2>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground text-xs">Creadora</th>
                  <th className="text-right px-4 py-2 font-medium text-muted-foreground text-xs">Publicaciones</th>
                  <th className="text-right px-4 py-2 font-medium text-muted-foreground text-xs">Views</th>
                  <th className="text-right px-4 py-2 font-medium text-muted-foreground text-xs">Engagement</th>
                </tr>
              </thead>
              <tbody>
                {report.topCreators.map((c, i) => (
                  <tr key={c.creatorId} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <span className="inline-block w-5 text-xs text-muted-foreground mr-2">
                        {i + 1}
                      </span>
                      <span className="font-medium text-foreground">{c.creatorName}</span>
                    </td>
                    <td className="text-right px-4 py-3">{c.publishedPieces}</td>
                    <td className="text-right px-4 py-3">
                      {c.totalViews.toLocaleString("es-CO")}
                    </td>
                    <td className="text-right px-4 py-3">
                      {c.totalEngagement.toLocaleString("es-CO")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Empty states */}
      {report.totalCampaigns === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-muted-foreground text-sm">
            Todavía no hay campañas para reportar.
          </p>
        </div>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "primary";
}) {
  const accent = tone === "primary" ? "text-[#FF4B2C]" : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${accent}`}>{value}</p>
    </div>
  );
}

