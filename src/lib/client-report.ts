import { prisma } from "@/lib/prisma";

export const PAYMENT_DEADLINE_DAYS = 20;

export interface CampaignStatusCounts {
  DRAFT: number;
  ACTIVE: number;
  IN_REVIEW: number;
  PUBLISHING: number;
  COMPLETED: number;
  CANCELLED: number;
}

export interface MonthPoint {
  month: string; // "YYYY-MM"
  label: string; // "ene 26"
  count: number;
}

export interface PendingPayment {
  campaignCreatorId: string;
  campaignId: string;
  campaignName: string;
  campaignCode: string;
  creatorName: string;
  amount: number | null;
  closedAt: Date;
  deadline: Date;
  daysRemaining: number;
  overdue: boolean;
  hasDocsSubmitted: boolean;
  status: "PENDING" | "DOCS_SUBMITTED" | "APPROVED" | "PAID" | "REJECTED" | null;
}

export interface TopCreator {
  creatorId: string;
  creatorName: string;
  publishedPieces: number;
  totalViews: number;
  totalEngagement: number;
}

export interface ClientReport {
  clientId: string;
  clientName: string;
  statusCounts: CampaignStatusCounts;
  totalCampaigns: number;
  uniqueCreators: number;
  totalPublished: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalInvestment: number;
  activeInvestment: number;
  timeline: MonthPoint[];
  pendingPayments: PendingPayment[];
  topCreators: TopCreator[];
}

const MONTH_LABELS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(d: Date): string {
  return `${MONTH_LABELS[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`;
}

function buildLast12Months(): MonthPoint[] {
  const now = new Date();
  const out: MonthPoint[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ month: monthKey(d), label: monthLabel(d), count: 0 });
  }
  return out;
}

function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

export function computePaymentDeadline(closedAt: Date): Date {
  const d = new Date(closedAt);
  d.setDate(d.getDate() + PAYMENT_DEADLINE_DAYS);
  return d;
}

export async function getClientReport(clientId: string): Promise<ClientReport | null> {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, name: true },
  });
  if (!client) return null;

  const campaigns = await prisma.campaign.findMany({
    where: { clientId },
    select: {
      id: true,
      name: true,
      code: true,
      status: true,
      budget: true,
      createdAt: true,
      campaignCreators: {
        select: {
          id: true,
          creatorId: true,
          status: true,
          fee: true,
          completedAt: true,
          creator: { select: { fullName: true } },
          payment: {
            select: {
              id: true,
              status: true,
              amount: true,
              paidAt: true,
              documents: { select: { type: true } },
            },
          },
          contentPieces: {
            select: {
              id: true,
              status: true,
              metrics: {
                orderBy: { capturedAt: "desc" },
                take: 1,
                select: { views: true, likes: true, comments: true },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const statusCounts: CampaignStatusCounts = {
    DRAFT: 0,
    ACTIVE: 0,
    IN_REVIEW: 0,
    PUBLISHING: 0,
    COMPLETED: 0,
    CANCELLED: 0,
  };

  let totalInvestment = 0;
  let activeInvestment = 0;
  let totalPublished = 0;
  let totalViews = 0;
  let totalLikes = 0;
  let totalComments = 0;

  const uniqueCreators = new Set<string>();
  const pendingPayments: PendingPayment[] = [];
  const creatorStats = new Map<string, TopCreator>();

  const timeline = buildLast12Months();
  const timelineIndex = new Map(timeline.map((m, i) => [m.month, i]));

  const now = new Date();

  for (const c of campaigns) {
    statusCounts[c.status] = (statusCounts[c.status] ?? 0) + 1;

    const budget = c.budget ? Number(c.budget) : 0;
    const creatorCount = c.campaignCreators.filter(
      (cc) => cc.status !== "DECLINED" && cc.status !== "REMOVED",
    ).length;
    const estCampaignInvestment = budget * Math.max(creatorCount, 1);
    totalInvestment += estCampaignInvestment;
    if (c.status === "ACTIVE" || c.status === "IN_REVIEW" || c.status === "PUBLISHING") {
      activeInvestment += estCampaignInvestment;
    }

    const mKey = monthKey(c.createdAt);
    const mi = timelineIndex.get(mKey);
    if (mi !== undefined) timeline[mi].count++;

    for (const cc of c.campaignCreators) {
      if (cc.status === "DECLINED" || cc.status === "REMOVED") continue;
      uniqueCreators.add(cc.creatorId);

      const stat = creatorStats.get(cc.creatorId) ?? {
        creatorId: cc.creatorId,
        creatorName: cc.creator.fullName,
        publishedPieces: 0,
        totalViews: 0,
        totalEngagement: 0,
      };

      for (const piece of cc.contentPieces) {
        if (piece.status === "PUBLISHED") {
          totalPublished++;
          stat.publishedPieces++;
          const latest = piece.metrics[0];
          if (latest) {
            const v = latest.views ?? 0;
            const l = latest.likes ?? 0;
            const com = latest.comments ?? 0;
            totalViews += v;
            totalLikes += l;
            totalComments += com;
            stat.totalViews += v;
            stat.totalEngagement += l + com;
          }
        }
      }
      creatorStats.set(cc.creatorId, stat);

      // Pagos: si la campaña o el CampaignCreator están completados, calcular deadline.
      const closedAt = cc.completedAt ?? (c.status === "COMPLETED" ? c.createdAt : null);
      const paymentStatus = cc.payment?.status ?? null;
      if (closedAt && paymentStatus !== "PAID") {
        const deadline = computePaymentDeadline(closedAt);
        const daysRemaining = daysBetween(now, deadline);
        pendingPayments.push({
          campaignCreatorId: cc.id,
          campaignId: c.id,
          campaignName: c.name,
          campaignCode: c.code,
          creatorName: cc.creator.fullName,
          amount: cc.payment?.amount ? Number(cc.payment.amount) : cc.fee ? Number(cc.fee) : null,
          closedAt,
          deadline,
          daysRemaining,
          overdue: daysRemaining < 0,
          hasDocsSubmitted:
            paymentStatus === "DOCS_SUBMITTED" ||
            paymentStatus === "APPROVED" ||
            (cc.payment?.documents?.length ?? 0) > 0,
          status: paymentStatus,
        });
      }
    }
  }

  pendingPayments.sort((a, b) => a.daysRemaining - b.daysRemaining);

  const topCreators = [...creatorStats.values()]
    .filter((s) => s.publishedPieces > 0)
    .sort((a, b) => b.totalViews - a.totalViews)
    .slice(0, 5);

  return {
    clientId: client.id,
    clientName: client.name,
    statusCounts,
    totalCampaigns: campaigns.length,
    uniqueCreators: uniqueCreators.size,
    totalPublished,
    totalViews,
    totalLikes,
    totalComments,
    totalInvestment,
    activeInvestment,
    timeline,
    pendingPayments,
    topCreators,
  };
}
