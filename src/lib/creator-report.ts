import { prisma } from "@/lib/prisma";

export type Tier = "BRONZE" | "SILVER" | "GOLD" | "DIAMOND";

export const TIER_META: Record<
  Tier,
  { label: string; emoji: string; min: number; color: string; bg: string }
> = {
  BRONZE: {
    label: "Bronze",
    emoji: "🥉",
    min: 0,
    color: "text-amber-800",
    bg: "bg-amber-100",
  },
  SILVER: {
    label: "Silver",
    emoji: "🥈",
    min: 200,
    color: "text-stone-700",
    bg: "bg-stone-200",
  },
  GOLD: {
    label: "Gold",
    emoji: "🥇",
    min: 600,
    color: "text-amber-700",
    bg: "bg-[#F4D79D]/60",
  },
  DIAMOND: {
    label: "Diamond",
    emoji: "💎",
    min: 1200,
    color: "text-teal-700",
    bg: "bg-[#B0E4EA]/40",
  },
};

export function tierForScore(score: number): Tier {
  if (score >= TIER_META.DIAMOND.min) return "DIAMOND";
  if (score >= TIER_META.GOLD.min) return "GOLD";
  if (score >= TIER_META.SILVER.min) return "SILVER";
  return "BRONZE";
}

export function nextTier(current: Tier): Tier | null {
  if (current === "BRONZE") return "SILVER";
  if (current === "SILVER") return "GOLD";
  if (current === "GOLD") return "DIAMOND";
  return null;
}

export interface Badge {
  id: string;
  label: string;
  description: string;
  emoji: string;
}

export interface TimelineEvent {
  at: Date;
  type:
    | "INVITED"
    | "ACCEPTED"
    | "DECLINED"
    | "FIRST_SUBMITTED"
    | "APPROVED"
    | "PUBLISHED"
    | "COMPLETED"
    | "RATED"
    | "REMOVED";
  label: string;
  campaignId: string;
  campaignName: string;
  campaignCode: string;
  clientName: string;
  meta?: string;
}

export interface CreatorReport {
  creatorId: string;
  creatorName: string;
  score: number;
  tier: Tier;
  scoreToNextTier: number | null;
  nextTier: Tier | null;
  badges: Badge[];
  totalInvited: number;
  totalAccepted: number;
  totalDeclined: number;
  totalCompleted: number;
  totalInProgress: number;
  acceptanceRate: number; // 0-1
  completionRate: number; // 0-1
  avgHoursToAccept: number | null;
  avgDaysToFirstDelivery: number | null;
  avgHoursToPublishAfterApproval: number | null;
  firstReviewApprovalRate: number | null; // piezas aprobadas sin ContentRevision extra
  avgClientRating: number | null;
  totalPublishedPieces: number;
  totalViews: number;
  totalEngagement: number;
  uniqueClients: number;
  timeline: TimelineEvent[];
}

function hoursBetween(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / (1000 * 60 * 60);
}

function daysBetween(a: Date, b: Date): number {
  return hoursBetween(a, b) / 24;
}

function avgOrNull(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export async function getCreatorReport(creatorId: string): Promise<CreatorReport | null> {
  const creator = await prisma.creator.findUnique({
    where: { id: creatorId },
    select: { id: true, fullName: true },
  });
  if (!creator) return null;

  const campaignCreators = await prisma.campaignCreator.findMany({
    where: { creatorId },
    include: {
      campaign: {
        select: {
          id: true,
          name: true,
          code: true,
          clientId: true,
          client: { select: { name: true } },
        },
      },
      contentPieces: {
        select: {
          id: true,
          status: true,
          firstSubmittedAt: true,
          approvedAt: true,
          actualPublishDate: true,
          publishedUrl: true,
          title: true,
          _count: { select: { revisions: true } },
          metrics: {
            orderBy: { capturedAt: "desc" },
            take: 1,
            select: { views: true, likes: true, comments: true },
          },
        },
      },
    },
    orderBy: { invitedAt: "desc" },
  });

  let totalInvited = 0;
  let totalAccepted = 0;
  let totalDeclined = 0;
  let totalCompleted = 0;
  let totalInProgress = 0;
  let totalPublishedPieces = 0;
  let totalViews = 0;
  let totalEngagement = 0;

  const acceptTimes: number[] = [];
  const firstDeliveryDays: number[] = [];
  const publishHours: number[] = [];
  const firstReviewFlags: boolean[] = [];
  const ratings: number[] = [];
  const clientsSet = new Set<string>();
  const timeline: TimelineEvent[] = [];

  let score = 0;
  let fastDeliveries = 0;
  let fastPublications = 0;
  let recurringClientHits = 0;
  let engagementStar = false;

  const campaignsByClient = new Map<string, number>();

  for (const cc of campaignCreators) {
    totalInvited++;
    clientsSet.add(cc.campaign.clientId);
    campaignsByClient.set(
      cc.campaign.clientId,
      (campaignsByClient.get(cc.campaign.clientId) ?? 0) + 1,
    );

    if (cc.status === "DECLINED") totalDeclined++;
    if (cc.status === "ACCEPTED" || cc.status === "ACTIVE" || cc.status === "ONBOARDING")
      totalInProgress++;
    if (cc.status === "COMPLETED") totalCompleted++;
    if (cc.status !== "DECLINED" && cc.status !== "REMOVED") totalAccepted++;

    // Eventos timeline
    timeline.push({
      at: cc.invitedAt,
      type: "INVITED",
      label: "Fue invitada",
      campaignId: cc.campaign.id,
      campaignName: cc.campaign.name,
      campaignCode: cc.campaign.code,
      clientName: cc.campaign.client.name,
    });

    if (cc.acceptedAt) {
      const h = hoursBetween(cc.invitedAt, cc.acceptedAt);
      acceptTimes.push(h);
      if (h < 24) score += 10;

      timeline.push({
        at: cc.acceptedAt,
        type: "ACCEPTED",
        label: "Aceptó la campaña",
        campaignId: cc.campaign.id,
        campaignName: cc.campaign.name,
        campaignCode: cc.campaign.code,
        clientName: cc.campaign.client.name,
        meta: `${h.toFixed(1)}h desde invitación`,
      });
    }

    if (cc.status === "DECLINED") {
      // si hay acceptedAt y luego declined, es peor que nunca aceptar
      if (cc.acceptedAt) score -= 50;
      timeline.push({
        at: cc.acceptedAt ?? cc.invitedAt,
        type: "DECLINED",
        label: "Rechazó la campaña",
        campaignId: cc.campaign.id,
        campaignName: cc.campaign.name,
        campaignCode: cc.campaign.code,
        clientName: cc.campaign.client.name,
      });
    }

    if (cc.status === "REMOVED") {
      score -= 30;
    }

    // Analizar piezas
    const firstSubmitted = cc.contentPieces
      .map((p) => p.firstSubmittedAt)
      .filter((d): d is Date => d != null)
      .sort((a, b) => a.getTime() - b.getTime())[0];

    if (cc.acceptedAt && firstSubmitted) {
      const d = daysBetween(cc.acceptedAt, firstSubmitted);
      firstDeliveryDays.push(d);
      if (d < 3) {
        score += 15;
        if (d < 2) fastDeliveries++;
      }
    }

    for (const piece of cc.contentPieces) {
      if (piece.firstSubmittedAt) {
        timeline.push({
          at: piece.firstSubmittedAt,
          type: "FIRST_SUBMITTED",
          label: `Entregó "${piece.title}"`,
          campaignId: cc.campaign.id,
          campaignName: cc.campaign.name,
          campaignCode: cc.campaign.code,
          clientName: cc.campaign.client.name,
        });
      }
      if (piece.approvedAt) {
        timeline.push({
          at: piece.approvedAt,
          type: "APPROVED",
          label: `"${piece.title}" aprobada`,
          campaignId: cc.campaign.id,
          campaignName: cc.campaign.name,
          campaignCode: cc.campaign.code,
          clientName: cc.campaign.client.name,
        });
        // aprobada sin revisiones extra = primera revisión ok
        const noRevisions = piece._count.revisions === 0;
        firstReviewFlags.push(noRevisions);
        if (noRevisions) score += 25;
      }
      if (piece.status === "PUBLISHED" && piece.actualPublishDate) {
        totalPublishedPieces++;
        timeline.push({
          at: piece.actualPublishDate,
          type: "PUBLISHED",
          label: `Publicó "${piece.title}"`,
          campaignId: cc.campaign.id,
          campaignName: cc.campaign.name,
          campaignCode: cc.campaign.code,
          clientName: cc.campaign.client.name,
          meta: piece.publishedUrl ?? undefined,
        });
        if (piece.approvedAt) {
          const h = hoursBetween(piece.approvedAt, piece.actualPublishDate);
          publishHours.push(h);
          if (h < 24) {
            score += 20;
            fastPublications++;
          }
        }
        const latest = piece.metrics[0];
        if (latest) {
          const v = latest.views ?? 0;
          totalViews += v;
          totalEngagement += (latest.likes ?? 0) + (latest.comments ?? 0);
          if (v >= 10000) engagementStar = true;
        }
      }
    }

    if (cc.completedAt) {
      score += 100;
      timeline.push({
        at: cc.completedAt,
        type: "COMPLETED",
        label: "Completó la campaña",
        campaignId: cc.campaign.id,
        campaignName: cc.campaign.name,
        campaignCode: cc.campaign.code,
        clientName: cc.campaign.client.name,
      });
    }

    if (cc.clientRating != null && cc.ratedAt) {
      ratings.push(cc.clientRating);
      score += cc.clientRating * 10;
      timeline.push({
        at: cc.ratedAt,
        type: "RATED",
        label: `Cliente calificó con ${cc.clientRating}★`,
        campaignId: cc.campaign.id,
        campaignName: cc.campaign.name,
        campaignCode: cc.campaign.code,
        clientName: cc.campaign.client.name,
        meta: cc.clientFeedback ?? undefined,
      });
    }
  }

  for (const count of campaignsByClient.values()) {
    if (count >= 3) recurringClientHits++;
  }

  score = Math.max(0, Math.round(score));

  const tier = tierForScore(score);
  const next = nextTier(tier);
  const scoreToNextTier = next ? TIER_META[next].min - score : null;

  // Badges
  const badges: Badge[] = [];
  if (totalCompleted >= 1)
    badges.push({
      id: "first-campaign",
      emoji: "🎬",
      label: "Primera campaña",
      description: "Completó su primera campaña con CoMa.",
    });
  if (fastDeliveries >= 3)
    badges.push({
      id: "top-speed",
      emoji: "⚡",
      label: "Top speed",
      description: "Entregó 3 o más piezas en menos de 2 días.",
    });
  if (fastPublications >= 5)
    badges.push({
      id: "puntual",
      emoji: "⏱️",
      label: "Puntual",
      description: "5+ publicaciones hechas en menos de 24h tras aprobación.",
    });
  if (recurringClientHits >= 1)
    badges.push({
      id: "recurrente",
      emoji: "🔁",
      label: "Recurrente",
      description: "Trabajó 3+ veces con un mismo cliente.",
    });
  if (engagementStar)
    badges.push({
      id: "engagement-star",
      emoji: "🌟",
      label: "Engagement star",
      description: "Una pieza superó las 10 000 vistas.",
    });
  if (totalCompleted >= 10)
    badges.push({
      id: "fiel",
      emoji: "💪",
      label: "Fiel",
      description: "10 campañas completadas.",
    });
  if (totalCompleted >= 25)
    badges.push({
      id: "leyenda",
      emoji: "🏆",
      label: "Leyenda",
      description: "25 campañas completadas.",
    });

  timeline.sort((a, b) => b.at.getTime() - a.at.getTime());

  const acceptanceRate = totalInvited > 0 ? totalAccepted / totalInvited : 0;
  const completionRate = totalAccepted > 0 ? totalCompleted / totalAccepted : 0;
  const firstReviewApprovalRate =
    firstReviewFlags.length > 0
      ? firstReviewFlags.filter((f) => f).length / firstReviewFlags.length
      : null;

  return {
    creatorId: creator.id,
    creatorName: creator.fullName,
    score,
    tier,
    scoreToNextTier,
    nextTier: next,
    badges,
    totalInvited,
    totalAccepted,
    totalDeclined,
    totalCompleted,
    totalInProgress,
    acceptanceRate,
    completionRate,
    avgHoursToAccept: avgOrNull(acceptTimes),
    avgDaysToFirstDelivery: avgOrNull(firstDeliveryDays),
    avgHoursToPublishAfterApproval: avgOrNull(publishHours),
    firstReviewApprovalRate,
    avgClientRating: avgOrNull(ratings),
    totalPublishedPieces,
    totalViews,
    totalEngagement,
    uniqueClients: clientsSet.size,
    timeline,
  };
}

// Lightweight tier lookup for cards without full report.
export async function getCreatorTier(creatorId: string): Promise<Tier> {
  const report = await getCreatorReport(creatorId);
  return report?.tier ?? "BRONZE";
}

// Batch tier lookup — single DB query, score simplificado (no timeline/eventos).
// Usar en listas con muchos creadores. Devuelve Map<creatorId, Tier>.
export async function getCreatorTiersBatch(
  creatorIds: string[],
): Promise<Map<string, Tier>> {
  if (creatorIds.length === 0) return new Map();

  const rows = await prisma.campaignCreator.findMany({
    where: { creatorId: { in: creatorIds } },
    select: {
      creatorId: true,
      status: true,
      invitedAt: true,
      acceptedAt: true,
      completedAt: true,
      clientRating: true,
      campaignId: true,
      contentPieces: {
        select: {
          status: true,
          firstSubmittedAt: true,
          approvedAt: true,
          actualPublishDate: true,
          _count: { select: { revisions: true } },
          metrics: {
            orderBy: { capturedAt: "desc" },
            take: 1,
            select: { views: true },
          },
        },
      },
    },
  });

  const scores = new Map<string, number>();
  const perClientCount = new Map<string, Map<string, number>>();

  for (const cc of rows) {
    let s = scores.get(cc.creatorId) ?? 0;

    if (cc.acceptedAt) {
      const h = (cc.acceptedAt.getTime() - cc.invitedAt.getTime()) / 3_600_000;
      if (h < 24) s += 10;
    }
    if (cc.status === "DECLINED" && cc.acceptedAt) s -= 50;
    if (cc.status === "REMOVED") s -= 30;
    if (cc.completedAt) s += 100;
    if (cc.clientRating != null) s += cc.clientRating * 10;

    for (const p of cc.contentPieces) {
      if (p.approvedAt) {
        if (cc.acceptedAt && p.firstSubmittedAt) {
          const d = (p.firstSubmittedAt.getTime() - cc.acceptedAt.getTime()) / 86_400_000;
          if (d < 3) s += 15;
        }
        if (p._count.revisions === 0) s += 25;
      }
      if (p.status === "PUBLISHED" && p.approvedAt && p.actualPublishDate) {
        const h = (p.actualPublishDate.getTime() - p.approvedAt.getTime()) / 3_600_000;
        if (h < 24) s += 20;
      }
    }

    scores.set(cc.creatorId, s);

    // per-client count para badge "Recurrente" — no afecta tier pero mantengo el map por simetría
    const m = perClientCount.get(cc.creatorId) ?? new Map<string, number>();
    m.set(cc.campaignId, (m.get(cc.campaignId) ?? 0) + 1);
    perClientCount.set(cc.creatorId, m);
  }

  const out = new Map<string, Tier>();
  for (const id of creatorIds) {
    const score = Math.max(0, Math.round(scores.get(id) ?? 0));
    out.set(id, tierForScore(score));
  }
  return out;
}
