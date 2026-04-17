import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Nueva", className: "bg-[#FF4B2C]/10 text-[#FF4B2C] border-[#FF4B2C]/20" },
  VIEWED: { label: "Vista", className: "bg-muted text-foreground" },
  QUOTED: { label: "Cotizada", className: "bg-amber-50 text-amber-700 border-amber-200" },
  ACCEPTED: { label: "Aceptada", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  REJECTED: { label: "Rechazada", className: "bg-muted text-muted-foreground" },
  CONVERTED_TO_CAMPAIGN: { label: "En campaña", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  EXPIRED: { label: "Expirada", className: "bg-muted text-muted-foreground" },
};

export default async function InquiriesInbox() {
  const session = await auth();
  if (session?.user?.role !== "CREATOR") redirect("/");

  const creator = await prisma.creator.findUnique({
    where: { userId: session.user.id! },
    select: { id: true },
  });
  if (!creator) redirect("/mi-espacio");

  const inquiries = await prisma.inquiry.findMany({
    where: { creatorId: creator.id },
    include: {
      _count: { select: { messages: true, quotes: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  const byStatus: Record<string, typeof inquiries> = {};
  for (const i of inquiries) {
    if (!byStatus[i.status]) byStatus[i.status] = [];
    byStatus[i.status].push(i);
  }

  const orderedBuckets = ["PENDING", "VIEWED", "QUOTED", "ACCEPTED", "CONVERTED_TO_CAMPAIGN", "REJECTED", "EXPIRED"].filter(
    (k) => byStatus[k]?.length,
  );

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <Link
          href="/mi-espacio"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Volver
        </Link>
        <h1 className="text-2xl text-foreground mt-2">Solicitudes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Marcas que te contactaron desde tu perfil público.
        </p>
      </div>

      {inquiries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">Aún no tenés solicitudes.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Asegurate de que tu perfil esté publicado para que las marcas te encuentren.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {orderedBuckets.map((status) => (
            <section key={status}>
              <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                {STATUS_LABELS[status]?.label ?? status} ({byStatus[status].length})
              </h2>
              <div className="space-y-2">
                {byStatus[status].map((inq) => (
                  <Link
                    key={inq.id}
                    href={`/mi-espacio/inquiries/${inq.id}`}
                    className="block rounded-xl border border-border bg-card p-4 hover:border-foreground/20 transition"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{inq.contactName}</span>
                          <Badge className={STATUS_LABELS[inq.status]?.className}>
                            {STATUS_LABELS[inq.status]?.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {inq.brief}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                          {inq.budgetCOP && (
                            <span>
                              💰 ${Number(inq.budgetCOP).toLocaleString("es-CO")} COP
                            </span>
                          )}
                          {inq.deadline && (
                            <span>📅 {new Date(inq.deadline).toLocaleDateString("es-CO")}</span>
                          )}
                          {inq._count.messages > 0 && <span>💬 {inq._count.messages}</span>}
                          {inq._count.quotes > 0 && <span>📄 {inq._count.quotes} cotización</span>}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(inq.createdAt).toLocaleDateString("es-CO", {
                          day: "numeric",
                          month: "short",
                        })}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
