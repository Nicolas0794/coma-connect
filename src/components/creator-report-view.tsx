import type { CreatorReport } from "@/lib/creator-report";
import { TIER_META } from "@/lib/creator-report";
import { TierBadge } from "@/components/tier-badge";

interface Props {
  report: CreatorReport;
  timelineLimit?: number;
  showTimeline?: boolean;
}

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

function formatHours(h: number | null): string {
  if (h == null) return "—";
  if (h < 1) return `${Math.round(h * 60)} min`;
  if (h < 48) return `${h.toFixed(1)} h`;
  return `${(h / 24).toFixed(1)} d`;
}

function formatDays(d: number | null): string {
  if (d == null) return "—";
  return `${d.toFixed(1)} d`;
}

const eventStyle: Record<
  CreatorReport["timeline"][number]["type"],
  { dot: string }
> = {
  INVITED: { dot: "bg-stone-300" },
  ACCEPTED: { dot: "bg-[#FF4B2C]" },
  DECLINED: { dot: "bg-stone-400" },
  FIRST_SUBMITTED: { dot: "bg-amber-500" },
  APPROVED: { dot: "bg-teal-500" },
  PUBLISHED: { dot: "bg-lime-500" },
  COMPLETED: { dot: "bg-[#D6E889]" },
  RATED: { dot: "bg-[#F4D79D]" },
  REMOVED: { dot: "bg-stone-400" },
};

export function CreatorReportView({
  report,
  timelineLimit = 50,
  showTimeline = true,
}: Props) {
  const tierMeta = TIER_META[report.tier];
  const nextMeta = report.nextTier ? TIER_META[report.nextTier] : null;

  return (
    <div className="space-y-8">
      {/* Nivel + score */}
      <section
        className={`rounded-xl border border-border p-5 ${tierMeta.bg}`}
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="text-4xl" aria-hidden>
              {tierMeta.emoji}
            </span>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                Nivel actual
              </p>
              <p className={`text-2xl font-bold ${tierMeta.color}`}>
                {tierMeta.label}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Puntaje
            </p>
            <p className="text-3xl font-bold text-foreground">{report.score}</p>
            {nextMeta && report.scoreToNextTier != null && (
              <p className="text-[11px] text-muted-foreground mt-1">
                {report.scoreToNextTier > 0
                  ? `${report.scoreToNextTier} pts para ${nextMeta.label} ${nextMeta.emoji}`
                  : `Listo para ascender a ${nextMeta.label}`}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Badges */}
      {report.badges.length > 0 && (
        <section>
          <h2 className="text-sm text-muted-foreground mb-3 uppercase tracking-wider font-medium">
            Logros
          </h2>
          <div className="flex flex-wrap gap-2">
            {report.badges.map((b) => (
              <div
                key={b.id}
                title={b.description}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5"
              >
                <span className="text-base">{b.emoji}</span>
                <span className="text-xs font-semibold text-foreground">
                  {b.label}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* KPIs */}
      <section>
        <h2 className="text-sm text-muted-foreground mb-3 uppercase tracking-wider font-medium">
          Comportamiento
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Kpi label="Campañas completadas" value={String(report.totalCompleted)} />
          <Kpi label="En curso" value={String(report.totalInProgress)} />
          <Kpi
            label="Tasa de aceptación"
            value={report.totalInvited > 0 ? pct(report.acceptanceRate) : "—"}
          />
          <Kpi
            label="Tasa de finalización"
            value={report.totalAccepted > 0 ? pct(report.completionRate) : "—"}
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
          <Kpi
            label="Tiempo en aceptar"
            value={formatHours(report.avgHoursToAccept)}
          />
          <Kpi
            label="Primera entrega"
            value={formatDays(report.avgDaysToFirstDelivery)}
          />
          <Kpi
            label="Publicar tras aprobación"
            value={formatHours(report.avgHoursToPublishAfterApproval)}
          />
          <Kpi
            label="Rating promedio"
            value={
              report.avgClientRating != null
                ? `${report.avgClientRating.toFixed(1)} ★`
                : "—"
            }
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
          <Kpi label="Publicaciones" value={String(report.totalPublishedPieces)} />
          <Kpi label="Vistas totales" value={report.totalViews.toLocaleString("es-CO")} />
          <Kpi
            label="Engagement"
            value={report.totalEngagement.toLocaleString("es-CO")}
          />
          <Kpi label="Clientes distintos" value={String(report.uniqueClients)} />
        </div>
      </section>

      {/* Timeline de eventos */}
      {showTimeline && report.timeline.length > 0 && (
        <section>
          <h2 className="text-sm text-muted-foreground mb-3 uppercase tracking-wider font-medium">
            Actividad reciente
          </h2>
          <div className="rounded-xl border border-border bg-card p-5">
            <ol className="relative space-y-4">
              {report.timeline.slice(0, timelineLimit).map((e, i) => {
                const style = eventStyle[e.type];
                return (
                  <li key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className={`size-2.5 rounded-full ${style.dot} shrink-0 mt-1.5`} />
                      {i < Math.min(report.timeline.length, timelineLimit) - 1 && (
                        <span className="w-px flex-1 bg-border mt-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <p className="text-sm text-foreground">{e.label}</p>
                        <p className="text-[11px] text-muted-foreground whitespace-nowrap">
                          {e.at.toLocaleString("es-CO", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {e.campaignCode} · {e.campaignName} · {e.clientName}
                      </p>
                      {e.meta && (
                        <p className="text-[11px] text-muted-foreground mt-0.5 italic">
                          {e.meta}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
            {report.timeline.length > timelineLimit && (
              <p className="text-xs text-muted-foreground text-center mt-3">
                + {report.timeline.length - timelineLimit} eventos más
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
        {label}
      </p>
      <p className="text-xl font-bold text-foreground mt-1">{value}</p>
    </div>
  );
}

// Reexportar para shortcuts si hace falta
export { TierBadge };
