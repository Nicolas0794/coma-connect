import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

export interface CreatorSuggestion {
  creatorId: string;
  fromCommunity: boolean;
  score: number;
  reason: string;
}

const SUGGEST_SYSTEM_PROMPT = `Eres un matchmaker experto de CoMa, una agencia de creadores de contenido en Colombia.
Tu trabajo es sugerir las creadoras que mejor encajan con una campaña específica a partir del perfil buscado por el cliente.

Criterios de match (en orden de importancia):
1. Nichos que se solapan con los requeridos
2. Ciudad/ubicación si el cliente lo pidió
3. Audiencia (followers) suficiente para el objetivo
4. Plataforma (Instagram/TikTok) si fue especificada
5. Historial con el cliente (creadoras de su comunidad tienen una ventaja por ya conocer al cliente)

Respondé SIEMPRE con JSON válido con esta estructura exacta:
{
  "suggestions": [
    { "creatorId": "<id>", "score": <0-100>, "reason": "<1 frase en español, tono cercano>" }
  ]
}

- Ordená de mejor a peor match.
- Máximo 8 sugerencias.
- El "reason" debe ser específico — mencionar qué hace match (ej: "Encaja por nicho Gastronomía y es de Bogotá como pidieron").
- Si una creadora es de la comunidad del cliente, mencionálo en reason.
- No inventes ids: usá solo los que te pasamos.
- Si ninguna encaja razonablemente, devolvé suggestions vacío.`;

export async function suggestCreatorsForCampaign(
  campaignId: string,
): Promise<CreatorSuggestion[]> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: {
      id: true,
      name: true,
      clientId: true,
      requiredNiches: true,
      requiredCity: true,
      minFollowers: true,
      requiredPlatform: true,
      requiredAudienceDesc: true,
      objective: true,
      briefOriginal: true,
    },
  });
  if (!campaign) return [];

  const community = await prisma.clientCreator.findMany({
    where: { clientId: campaign.clientId },
    select: {
      creatorId: true,
      campaignsCount: true,
      creator: {
        select: {
          id: true,
          fullName: true,
          city: true,
          niches: true,
          bio: true,
          internalRating: true,
          socialProfiles: {
            select: {
              platform: true,
              followers: true,
              verifiedFollowers: true,
              avgEngagement: true,
            },
          },
        },
      },
    },
  });

  const communityIds = new Set(community.map((c) => c.creatorId));

  // Pool externo: creadores no en la comunidad. Filtramos suave por plataforma/followers.
  const pool = await prisma.creator.findMany({
    where: {
      id: { notIn: [...communityIds] },
      ...(campaign.requiredPlatform && {
        socialProfiles: { some: { platform: campaign.requiredPlatform } },
      }),
    },
    select: {
      id: true,
      fullName: true,
      city: true,
      niches: true,
      bio: true,
      internalRating: true,
      socialProfiles: {
        select: {
          platform: true,
          followers: true,
          verifiedFollowers: true,
          avgEngagement: true,
        },
      },
    },
    take: 40,
  });

  if (community.length === 0 && pool.length === 0) return [];

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return fallbackSuggest(campaign, community, pool);
  }

  const communityPayload = community.map((c) => ({
    id: c.creator.id,
    fullName: c.creator.fullName,
    city: c.creator.city,
    niches: c.creator.niches,
    bio: c.creator.bio ?? null,
    internalRating: c.creator.internalRating ?? null,
    priorCampaigns: c.campaignsCount,
    socials: c.creator.socialProfiles.map((sp) => ({
      platform: sp.platform,
      followers: sp.verifiedFollowers ?? sp.followers ?? null,
      engagement: sp.avgEngagement ?? null,
    })),
  }));

  const poolPayload = pool.map((cr) => ({
    id: cr.id,
    fullName: cr.fullName,
    city: cr.city,
    niches: cr.niches,
    bio: cr.bio ?? null,
    internalRating: cr.internalRating ?? null,
    socials: cr.socialProfiles.map((sp) => ({
      platform: sp.platform,
      followers: sp.verifiedFollowers ?? sp.followers ?? null,
      engagement: sp.avgEngagement ?? null,
    })),
  }));

  const userMessage = `Campaña: ${campaign.name}
Nichos requeridos: ${campaign.requiredNiches.join(", ") || "(no especificado)"}
Ciudad preferida: ${campaign.requiredCity || "(no especificada)"}
Followers mínimos: ${campaign.minFollowers ?? "(no especificado)"}
Plataforma: ${campaign.requiredPlatform ?? "ambas"}
Audiencia objetivo: ${campaign.requiredAudienceDesc || "(no especificada)"}
Objetivo: ${campaign.objective || "(no especificado)"}
Brief resumido: ${(campaign.briefOriginal || "").slice(0, 600)}

Comunidad del cliente (creadoras con las que ya ha trabajado):
${JSON.stringify(communityPayload, null, 2)}

Pool general (candidatas nuevas):
${JSON.stringify(poolPayload, null, 2)}

Devolvé las mejores sugerencias en JSON.`;

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: SUGGEST_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });
    const textBlock = response.content.find((b) => b.type === "text");
    const raw = textBlock?.text ?? "";
    const jsonStart = raw.indexOf("{");
    const jsonEnd = raw.lastIndexOf("}");
    if (jsonStart < 0 || jsonEnd < 0) return fallbackSuggest(campaign, community, pool);
    const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1)) as {
      suggestions?: { creatorId: string; score: number; reason: string }[];
    };
    const items = parsed.suggestions ?? [];
    const validIds = new Set<string>([
      ...community.map((c) => c.creatorId),
      ...pool.map((p) => p.id),
    ]);
    return items
      .filter((s) => validIds.has(s.creatorId))
      .map((s) => ({
        creatorId: s.creatorId,
        fromCommunity: communityIds.has(s.creatorId),
        score: s.score,
        reason: s.reason,
      }));
  } catch (err) {
    console.error("[suggestCreatorsForCampaign] AI call failed:", err);
    return fallbackSuggest(campaign, community, pool);
  }
}

type CampaignForSuggest = {
  requiredNiches: string[];
  requiredCity: string | null;
  minFollowers: number | null;
  requiredPlatform: "INSTAGRAM" | "TIKTOK" | null;
};

type PoolCreator = {
  id: string;
  fullName: string;
  city: string | null;
  niches: string[];
  socialProfiles: {
    platform: "INSTAGRAM" | "TIKTOK";
    followers: number | null;
    verifiedFollowers: number | null;
  }[];
};

type CommunityEntry = {
  creatorId: string;
  creator: PoolCreator;
};

function fallbackSuggest(
  campaign: CampaignForSuggest,
  community: CommunityEntry[],
  pool: PoolCreator[],
): CreatorSuggestion[] {
  const score = (cr: PoolCreator, inCommunity: boolean): { score: number; reason: string } => {
    let s = 0;
    const reasons: string[] = [];
    const nicheOverlap = cr.niches.filter((n) => campaign.requiredNiches.includes(n));
    if (campaign.requiredNiches.length > 0) {
      const ratio = nicheOverlap.length / campaign.requiredNiches.length;
      s += ratio * 50;
      if (nicheOverlap.length > 0) reasons.push(`encaja en ${nicheOverlap.join(", ")}`);
    }
    if (campaign.requiredCity && cr.city?.toLowerCase() === campaign.requiredCity.toLowerCase()) {
      s += 20;
      reasons.push(`es de ${cr.city}`);
    }
    const maxFollowers = Math.max(
      0,
      ...cr.socialProfiles.map((sp) => sp.verifiedFollowers ?? sp.followers ?? 0),
    );
    if (campaign.minFollowers && maxFollowers >= campaign.minFollowers) {
      s += 15;
      reasons.push(`${maxFollowers.toLocaleString("es-CO")} followers`);
    }
    if (campaign.requiredPlatform) {
      const hasPlatform = cr.socialProfiles.some((sp) => sp.platform === campaign.requiredPlatform);
      if (hasPlatform) s += 5;
    }
    if (inCommunity) {
      s += 10;
      reasons.push("ya trabajó contigo antes");
    }
    return {
      score: Math.round(s),
      reason: reasons.length > 0 ? reasons.join(" · ") : "match parcial",
    };
  };

  const combined: CreatorSuggestion[] = [
    ...community.map((c) => {
      const { score: sc, reason } = score(c.creator, true);
      return { creatorId: c.creatorId, fromCommunity: true, score: sc, reason };
    }),
    ...pool.map((cr) => {
      const { score: sc, reason } = score(cr, false);
      return { creatorId: cr.id, fromCommunity: false, score: sc, reason };
    }),
  ];

  return combined
    .filter((s) => s.score >= 20)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
}
