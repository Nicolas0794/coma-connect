import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireInternalRole } from "@/lib/require-role";
import { Button } from "@/components/ui/button";
import type { BrandLeadStatus } from "@/generated/prisma/enums";
import { approveLead, markContacted, rejectLead } from "./actions";

const STATUS_LABEL: Record<BrandLeadStatus, string> = {
  PENDING: "Pendiente",
  CONTACTED: "Contactado",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
};

const STATUS_STYLE: Record<BrandLeadStatus, string> = {
  PENDING:
    "bg-[#FF4B2C]/10 text-[#FF4B2C] border border-[#FF4B2C]/30",
  CONTACTED:
    "bg-[#F4D79D]/25 text-[#7a5700] border border-[#F4D79D]/60",
  APPROVED:
    "bg-[#D6E889]/30 text-[#4a5f10] border border-[#D6E889]/60",
  REJECTED:
    "bg-muted text-muted-foreground border border-border",
};

const TAB_STATUSES: (BrandLeadStatus | "ALL")[] = [
  "PENDING",
  "CONTACTED",
  "APPROVED",
  "REJECTED",
  "ALL",
];

const TAB_LABEL: Record<BrandLeadStatus | "ALL", string> = {
  PENDING: "Pendientes",
  CONTACTED: "Contactados",
  APPROVED: "Aprobados",
  REJECTED: "Rechazados",
  ALL: "Todos",
};

export default async function LeadsMarcasPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    done?: string;
    brand?: string;
    error?: string;
  }>;
}) {
  await requireInternalRole();
  const params = await searchParams;

  const status =
    params.status && TAB_STATUSES.includes(params.status as BrandLeadStatus | "ALL")
      ? (params.status as BrandLeadStatus | "ALL")
      : "PENDING";

  const leads = await prisma.brandLead.findMany({
    where: status === "ALL" ? {} : { status },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const counts = await prisma.brandLead.groupBy({
    by: ["status"],
    _count: true,
  });
  const countMap: Record<string, number> = {};
  for (const c of counts) countMap[c.status] = c._count;
  const total = counts.reduce((acc, c) => acc + c._count, 0);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[#FF4B2C] font-semibold mb-1">
            Marcas
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Leads de marcas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Solicitudes que llegaron desde{" "}
            <Link href="/sumar-marca" className="text-[#FF4B2C] hover:underline">
              /sumar-marca
            </Link>
            . Aprobar crea la invitación en whitelist + envía email.
          </p>
        </div>
      </div>

      {params.done === "approved" && (
        <div className="mb-4 rounded-lg border border-[#D6E889]/60 bg-[#D6E889]/20 px-4 py-3 text-sm">
          ✅ Marca aprobada{params.brand ? `: ${decodeURIComponent(params.brand)}` : ""}. Email enviado.
        </div>
      )}
      {params.done === "rejected" && (
        <div className="mb-4 rounded-lg border border-border bg-muted px-4 py-3 text-sm">
          Solicitud rechazada. Email enviado.
        </div>
      )}
      {params.error && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Error: {params.error}
        </div>
      )}

      <div className="flex gap-1 mb-6 border-b border-border">
        {TAB_STATUSES.map((s) => {
          const active = status === s;
          const count = s === "ALL" ? total : countMap[s] ?? 0;
          return (
            <Link
              key={s}
              href={s === "PENDING" ? "/leads-marcas" : `/leads-marcas?status=${s}`}
              className={`px-4 py-2 text-sm border-b-2 -mb-px transition-colors ${
                active
                  ? "border-[#FF4B2C] text-foreground font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {TAB_LABEL[s]}{" "}
              <span className="ml-1 text-[11px] text-muted-foreground">
                {count}
              </span>
            </Link>
          );
        })}
      </div>

      {leads.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center text-muted-foreground">
          Sin leads en esta bandeja.
        </div>
      ) : (
        <div className="space-y-4">
          {leads.map((lead) => (
            <article
              key={lead.id}
              className="rounded-xl border border-border bg-card p-5"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold">{lead.brandName}</h3>
                    <span
                      className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_STYLE[lead.status]}`}
                    >
                      {STATUS_LABEL[lead.status]}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(lead.createdAt).toLocaleString("es-CO", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                    {lead.industry ? ` · ${lead.industry}` : ""}
                  </p>
                </div>
                {lead.website && (
                  <a
                    href={lead.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#FF4B2C] hover:underline truncate max-w-[240px]"
                  >
                    {lead.website.replace(/^https?:\/\//, "")} ↗
                  </a>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm mb-3">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-0.5">
                    Contacto
                  </p>
                  <p className="font-medium">{lead.contactName}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-0.5">
                    Email
                  </p>
                  <a
                    href={`mailto:${lead.contactEmail}`}
                    className="hover:underline font-medium"
                  >
                    {lead.contactEmail}
                  </a>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-0.5">
                    Teléfono
                  </p>
                  <p className="font-medium">
                    {lead.contactPhone ? (
                      <a
                        href={`https://wa.me/${lead.contactPhone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline text-[#25D366]"
                      >
                        {lead.contactPhone}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </p>
                </div>
              </div>

              {lead.message && (
                <div className="mb-4 rounded-lg bg-muted/40 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                    Mensaje
                  </p>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {lead.message}
                  </p>
                </div>
              )}

              {lead.notes && (
                <div className="mb-4 rounded-lg border border-border px-4 py-2">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-0.5">
                    Notas internas
                  </p>
                  <p className="text-sm">{lead.notes}</p>
                </div>
              )}

              {lead.status === "PENDING" || lead.status === "CONTACTED" ? (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                  <form action={approveLead} className="flex-1 flex gap-2">
                    <input type="hidden" name="id" value={lead.id} />
                    <input
                      name="notes"
                      placeholder="Nota interna opcional"
                      className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#FF4B2C]/30"
                      maxLength={500}
                    />
                    <Button type="submit" size="sm">
                      Aprobar →
                    </Button>
                  </form>
                  {lead.status === "PENDING" && (
                    <form action={markContacted}>
                      <input type="hidden" name="id" value={lead.id} />
                      <Button type="submit" size="sm" variant="ghost">
                        Marcar contactado
                      </Button>
                    </form>
                  )}
                  <form action={rejectLead}>
                    <input type="hidden" name="id" value={lead.id} />
                    <input type="hidden" name="notes" value="" />
                    <Button type="submit" size="sm" variant="ghost" className="text-destructive">
                      Rechazar
                    </Button>
                  </form>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                  {lead.status === "APPROVED" && "Aprobado"}
                  {lead.status === "REJECTED" && "Rechazado"}
                  {lead.reviewedAt && (
                    <> · {new Date(lead.reviewedAt).toLocaleString("es-CO", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}</>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
