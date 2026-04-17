import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PAYMENT_DEADLINE_DAYS, computePaymentDeadline } from "@/lib/client-report";

function cop(n: number): string {
  return `$${n.toLocaleString("es-CO", { maximumFractionDigits: 0 })}`;
}

function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

export default async function HomePage() {
  const session = await auth();
  const role = session?.user?.role;

  if (role === "CLIENT") redirect("/portal");
  if (role === "CREATOR") redirect("/mi-espacio");

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    clientCount,
    creatorCount,
    campaignCount,
    activeCampaigns,
    inReviewCampaigns,
    publishingCampaigns,
    completedCampaigns,
    publishedThisMonth,
    pendingCampaignCreators,
  ] = await Promise.all([
    prisma.client.count(),
    prisma.creator.count(),
    prisma.campaign.count(),
    prisma.campaign.count({ where: { status: "ACTIVE" } }),
    prisma.campaign.count({ where: { status: "IN_REVIEW" } }),
    prisma.campaign.count({ where: { status: "PUBLISHING" } }),
    prisma.campaign.count({ where: { status: "COMPLETED" } }),
    prisma.contentPiece.count({
      where: { status: "PUBLISHED", actualPublishDate: { gte: startOfMonth } },
    }),
    // Pagos pendientes: CampaignCreator con completedAt y Payment.status != PAID
    prisma.campaignCreator.findMany({
      where: {
        completedAt: { not: null },
        OR: [{ payment: null }, { payment: { status: { not: "PAID" } } }],
      },
      select: {
        id: true,
        completedAt: true,
        fee: true,
        creator: { select: { fullName: true } },
        campaign: {
          select: { id: true, name: true, code: true, client: { select: { name: true } } },
        },
        payment: { select: { status: true, amount: true } },
      },
      orderBy: { completedAt: "asc" },
    }),
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

  const pendingPayments = pendingCampaignCreators
    .map((cc) => {
      const closedAt = cc.completedAt!;
      const deadline = computePaymentDeadline(closedAt);
      const daysRemaining = daysBetween(now, deadline);
      return {
        id: cc.id,
        closedAt,
        deadline,
        daysRemaining,
        overdue: daysRemaining < 0,
        campaignId: cc.campaign.id,
        campaignName: cc.campaign.name,
        campaignCode: cc.campaign.code,
        clientName: cc.campaign.client.name,
        creatorName: cc.creator.fullName,
        amount: cc.payment?.amount ? Number(cc.payment.amount) : cc.fee ? Number(cc.fee) : null,
        status: cc.payment?.status ?? null,
      };
    })
    .sort((a, b) => a.daysRemaining - b.daysRemaining);

  const overdueCount = pendingPayments.filter((p) => p.overdue).length;
  const dueSoonCount = pendingPayments.filter((p) => !p.overdue && p.daysRemaining <= 5).length;

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="animate-fade-in mb-8 mt-2">
        <h1 className="text-2xl text-foreground">Hola, {firstName}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Esto es lo que está pasando hoy en CoMa.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 mb-8">
        {stats.map((stat, i) => (
          <a
            key={stat.label}
            href={stat.href}
            className={`animate-slide-up stagger-${i + 1} rounded-xl border ${stat.border} ${stat.bg} p-5 transition-all duration-200 hover:shadow-md block`}
          >
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {stat.label}
            </p>
            <p className={`text-3xl font-medium mt-1 ${stat.accent}`}>{stat.value}</p>
          </a>
        ))}
      </div>

      {/* Estado de campañas */}
      <div className="mb-8">
        <h2 className="text-sm text-muted-foreground uppercase tracking-wider font-medium mb-3">
          Pipeline de campañas
        </h2>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          <StatusTile label="Activas" value={activeCampaigns} tone="primary" />
          <StatusTile label="En revisión" value={inReviewCampaigns} tone="amber" />
          <StatusTile label="Publicando" value={publishingCampaigns} tone="teal" />
          <StatusTile label="Completadas" value={completedCampaigns} tone="lime" />
        </div>
      </div>

      {/* Actividad del mes */}
      <div className="mb-8">
        <h2 className="text-sm text-muted-foreground uppercase tracking-wider font-medium mb-3">
          Este mes
        </h2>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs text-muted-foreground">Publicaciones</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {publishedThisMonth}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs text-muted-foreground">Pagos vencidos</p>
            <p
              className={`text-2xl font-bold mt-1 ${overdueCount > 0 ? "text-destructive" : "text-foreground"}`}
            >
              {overdueCount}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs text-muted-foreground">Pagos vencen en ≤5 días</p>
            <p
              className={`text-2xl font-bold mt-1 ${dueSoonCount > 0 ? "text-[#FF4B2C]" : "text-foreground"}`}
            >
              {dueSoonCount}
            </p>
          </div>
        </div>
      </div>

      {/* Pagos pendientes */}
      {pendingPayments.length > 0 && (
        <div>
          <h2 className="text-sm text-muted-foreground uppercase tracking-wider font-medium mb-2">
            Pagos pendientes ({pendingPayments.length})
          </h2>
          <p className="text-xs text-muted-foreground mb-3">
            Plazo de {PAYMENT_DEADLINE_DAYS} días desde el cierre de cada campaña.
          </p>
          <div className="space-y-2">
            {pendingPayments.slice(0, 12).map((p) => {
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
                  key={p.id}
                  href={`/campanas/${p.campaignId}`}
                  className={`flex items-center justify-between rounded-xl border ${tone} px-4 py-3 hover:shadow-sm transition-all`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground text-sm">
                        {p.creatorName}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {p.clientName} · {p.campaignCode}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Cerró{" "}
                      {p.closedAt.toLocaleDateString("es-CO", { day: "numeric", month: "short" })}
                      {" · Pago hasta "}
                      {p.deadline.toLocaleDateString("es-CO", { day: "numeric", month: "short" })}
                      {p.amount != null && ` · ${cop(p.amount)}`}
                    </p>
                  </div>
                  <div className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-bold shrink-0 ml-3 ${chipColor}`}>
                    {p.overdue
                      ? `Vencido hace ${Math.abs(p.daysRemaining)}d`
                      : p.daysRemaining === 0
                      ? "Vence hoy"
                      : `${p.daysRemaining}d`}
                  </div>
                </Link>
              );
            })}
            {pendingPayments.length > 12 && (
              <p className="text-xs text-muted-foreground text-center pt-2">
                + {pendingPayments.length - 12} más
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "primary" | "amber" | "teal" | "lime";
}) {
  const map = {
    primary: "text-[#FF4B2C] bg-[#FF4B2C]/10",
    amber: "text-amber-700 bg-amber-100",
    teal: "text-teal-700 bg-[#B0E4EA]/30",
    lime: "text-lime-700 bg-[#D6E889]/30",
  } as const;
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div
        className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${map[tone]}`}
      >
        {label}
      </div>
      <div className="text-2xl font-bold text-foreground mt-2">{value}</div>
    </div>
  );
}
