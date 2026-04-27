/**
 * Instagram Graph API — pull de insights para una cuenta Business conectada.
 *
 * Métricas oficiales (verificadas por Meta) que extraemos:
 *  - Perfil: followers_count, reach, impressions, profile_views, website_clicks
 *  - Demografía: gender (female/male/other), age (13-17/18-24/.../55+)
 *  - Geografía: top ciudades, top países
 *
 * Requisitos:
 *  - accessToken long-lived obtenido vía meta-oauth.ts
 *  - La cuenta IG debe tener 100+ followers para que Meta devuelva demografía
 *    (requerimiento de privacy de Meta — menos que eso da {})
 */

const GRAPH_BASE = "https://graph.facebook.com/v21.0";

export interface ProfileInsights {
  followers: number | null;
  reach30d: number | null;
  impressions30d: number | null;
  profileViews30d: number | null;
  websiteClicks30d: number | null;

  genderFemalePct: number | null;
  genderMalePct: number | null;
  genderOtherPct: number | null;

  age13_17Pct: number | null;
  age18_24Pct: number | null;
  age25_34Pct: number | null;
  age35_44Pct: number | null;
  age45_54Pct: number | null;
  age55PlusPct: number | null;

  topCities: Array<{ name: string; pct: number }> | null;
  topCountries: Array<{ name: string; pct: number }> | null;

  rawPayload: unknown;
}

interface BreakdownRow {
  dimension_values: string[];
  value: number;
}

function pctMap(rows: BreakdownRow[]): Record<string, number> {
  const total = rows.reduce((s, r) => s + r.value, 0);
  if (total === 0) return {};
  return Object.fromEntries(
    rows.map((r) => [r.dimension_values[0], (r.value / total) * 100]),
  );
}

/**
 * Pull completo de insights para una IG Business Account.
 * Retorna null si alguna request crítica falla.
 */
export async function fetchInstagramInsights(
  igBusinessId: string,
  accessToken: string,
): Promise<ProfileInsights | null> {
  const rawPayload: Record<string, unknown> = {};

  // ── 1. Profile basics (followers_count siempre disponible) ──
  const profileRes = await fetch(
    `${GRAPH_BASE}/${igBusinessId}?fields=followers_count,media_count,username&access_token=${accessToken}`,
  );
  if (!profileRes.ok) return null;
  const profile = (await profileRes.json()) as {
    followers_count: number;
    media_count: number;
    username: string;
  };
  rawPayload.profile = profile;

  // ── 2. Insights de los últimos 30 días (reach, impressions, etc.) ──
  const until = Math.floor(Date.now() / 1000);
  const since = until - 30 * 24 * 60 * 60;
  const metricParams = [
    "reach",
    "impressions",
    "profile_views",
    "website_clicks",
  ].join(",");

  let reach30d: number | null = null;
  let impressions30d: number | null = null;
  let profileViews30d: number | null = null;
  let websiteClicks30d: number | null = null;

  try {
    const insightsRes = await fetch(
      `${GRAPH_BASE}/${igBusinessId}/insights?metric=${metricParams}&period=day&since=${since}&until=${until}&access_token=${accessToken}`,
    );
    if (insightsRes.ok) {
      const insights = (await insightsRes.json()) as {
        data: Array<{ name: string; values: Array<{ value: number }> }>;
      };
      rawPayload.insights = insights;

      for (const metric of insights.data) {
        const total = metric.values.reduce((s, v) => s + v.value, 0);
        if (metric.name === "reach") reach30d = total;
        else if (metric.name === "impressions") impressions30d = total;
        else if (metric.name === "profile_views") profileViews30d = total;
        else if (metric.name === "website_clicks") websiteClicks30d = total;
      }
    }
  } catch (err) {
    console.warn("[meta-insights] insights fetch falló:", err);
  }

  // ── 3. Demografía ──
  let gender: Record<string, number> = {};
  let age: Record<string, number> = {};
  let topCities: Array<{ name: string; pct: number }> | null = null;
  let topCountries: Array<{ name: string; pct: number }> | null = null;

  try {
    const demoRes = await fetch(
      `${GRAPH_BASE}/${igBusinessId}/insights?metric=audience_gender_age,audience_city,audience_country&period=lifetime&access_token=${accessToken}`,
    );
    if (demoRes.ok) {
      const demo = (await demoRes.json()) as {
        data: Array<{
          name: string;
          values: Array<{ value: Record<string, number> }>;
        }>;
      };
      rawPayload.demographics = demo;

      const genderAge = demo.data.find((d) => d.name === "audience_gender_age");
      if (genderAge?.values[0]?.value) {
        // Keys format: "F.18-24", "M.25-34", "U.55+"
        const values = genderAge.values[0].value;
        const genderTotals: Record<string, number> = { F: 0, M: 0, U: 0 };
        const ageTotals: Record<string, number> = {};
        let grand = 0;
        for (const [key, count] of Object.entries(values)) {
          const [g, a] = key.split(".");
          genderTotals[g] = (genderTotals[g] ?? 0) + count;
          ageTotals[a] = (ageTotals[a] ?? 0) + count;
          grand += count;
        }
        if (grand > 0) {
          gender = {
            F: (genderTotals.F / grand) * 100,
            M: (genderTotals.M / grand) * 100,
            U: (genderTotals.U / grand) * 100,
          };
          age = Object.fromEntries(
            Object.entries(ageTotals).map(([k, v]) => [k, (v / grand) * 100]),
          );
        }
      }

      const cityData = demo.data.find((d) => d.name === "audience_city");
      if (cityData?.values[0]?.value) {
        topCities = Object.entries(cityData.values[0].value)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
          .map((row) => {
            const all = Object.values(cityData.values[0].value).reduce(
              (s: number, v) => s + v,
              0,
            );
            return { name: row.name, pct: (row.count / all) * 100 };
          });
      }

      const countryData = demo.data.find((d) => d.name === "audience_country");
      if (countryData?.values[0]?.value) {
        topCountries = Object.entries(countryData.values[0].value)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
          .map((row) => {
            const all = Object.values(countryData.values[0].value).reduce(
              (s: number, v) => s + v,
              0,
            );
            return { name: row.name, pct: (row.count / all) * 100 };
          });
      }
    }
  } catch (err) {
    console.warn("[meta-insights] demographics fetch falló:", err);
  }

  return {
    followers: profile.followers_count ?? null,
    reach30d,
    impressions30d,
    profileViews30d,
    websiteClicks30d,
    genderFemalePct: gender.F ?? null,
    genderMalePct: gender.M ?? null,
    genderOtherPct: gender.U ?? null,
    age13_17Pct: age["13-17"] ?? null,
    age18_24Pct: age["18-24"] ?? null,
    age25_34Pct: age["25-34"] ?? null,
    age35_44Pct: age["35-44"] ?? null,
    age45_54Pct: age["45-54"] ?? null,
    age55PlusPct: age["55+"] ?? null,
    topCities,
    topCountries,
    rawPayload,
  };
}
