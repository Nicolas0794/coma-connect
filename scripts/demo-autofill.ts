/**
 * Demo del flujo de autofill SIN llamar a Claude (gratis).
 *
 * Muestra:
 *   1. Qué extrae el scraper de Instagram público
 *   2. Qué se le mandaría exactamente a Claude (system prompt + user message)
 *   3. Un ejemplo canned de lo que Claude devolvería
 *   4. Cómo se normalizaría antes de aplicar al perfil
 *
 * Uso: pnpm tsx scripts/demo-autofill.ts @handle
 */
import "dotenv/config";
import { scrapeInstagramProfile } from "../src/lib/instagram-scrape";
import { slugifyNiche } from "../src/lib/niches";

const handle = process.argv[2] || "@nasa";

function section(title: string) {
  console.log(`\n${"═".repeat(70)}`);
  console.log(`  ${title}`);
  console.log(`${"═".repeat(70)}\n`);
}

async function main() {
  console.log(`\n🔎 Demo de autofill para: ${handle}`);
  console.log("   (no se hace ninguna llamada a Claude — cero costo)\n");

  // ── 1. SCRAPE ────────────────────────────────────────────────────
  section("PASO 1 · Scraping público (gratis, HTTP a instagram.com)");
  const profile = await scrapeInstagramProfile(handle);
  if (!profile) {
    console.log("❌ No se pudo leer el perfil (privado o no existe).");
    process.exit(1);
  }
  console.log("Extraído del HTML público (con Googlebot UA):");
  console.log("  handle:      ", profile.handle);
  console.log("  fullName:    ", profile.fullName);
  console.log("  bio:         ", profile.bio);
  console.log("  avatarUrl:   ", profile.avatarUrl?.slice(0, 60) + "...");
  console.log("  followers:   ", profile.followers?.toLocaleString("es-CO"));
  console.log("  following:   ", profile.following?.toLocaleString("es-CO"));
  console.log("  posts:       ", profile.posts?.toLocaleString("es-CO"));
  console.log("  profileUrl:  ", profile.profileUrl);

  // ── 2. WHAT WOULD GO TO CLAUDE ──────────────────────────────────
  section("PASO 2 · Qué se le mandaría a Claude");
  console.log("Si hubiera API key, se harían 2 inputs al modelo Sonnet 4.6:\n");
  console.log("  (a) Avatar del perfil como imagen (vision input, ~1500 tokens)");
  console.log(`      → se descarga ${profile.avatarUrl?.slice(0, 50)}...\n`);
  console.log("  (b) Texto envuelto en <instagram_profile> XML (anti-prompt-injection):");
  const xml = `<instagram_profile>
${JSON.stringify(
    {
      handle: profile.handle,
      fullName: profile.fullName,
      bio: profile.bio,
      followers: profile.followers,
      following: profile.following,
      posts: profile.posts,
      profileUrl: profile.profileUrl,
    },
    null,
    2,
  )}
</instagram_profile>`;
  console.log(xml.split("\n").map((l) => "      " + l).join("\n"));

  console.log("\nMás el system prompt (~800 tokens) y la tool_schema (~300 tokens).");
  console.log("Claude devuelve un structured tool_use — NO texto suelto, no hay parsing frágil.");

  // ── 3. WHAT CLAUDE WOULD RETURN ──────────────────────────────────
  section("PASO 3 · Ejemplo canned de lo que Claude devolvería");
  const mockResponse = {
    artistName: null,
    headline: "Exploración espacial para todos",
    valuePitch:
      "Te llevo al espacio con imágenes reales de misiones. Contenido de ciencia y exploración con data fidedigna y visuales espectaculares.",
    creatorTypes: ["PHOTOGRAPHER", "INFLUENCER"],
    contentFormats: ["PHOTO", "CAROUSEL", "REEL"],
    languages: ["EN", "ES"],
    niches: [
      { slug: "tecnologia", label: "Tecnología" },
      { slug: "educacion", label: "Educación" },
      { slug: "ciencia", label: "Ciencia" },
    ],
    suggestedBaseRateCOP: 2500000,
    suggestedCity: null,
    suggestedCountry: null,
  };
  console.log(JSON.stringify(mockResponse, null, 2));

  // ── 4. NORMALIZATION ────────────────────────────────────────────
  section("PASO 4 · Normalización antes de aplicar (nuestro código)");
  const normalized = mockResponse.niches.map((n) => ({
    slug: slugifyNiche(n.slug || n.label),
    label: n.label,
  }));
  console.log("niches normalizados con slugifyNiche (por si Claude fuera inconsistente):");
  console.log(JSON.stringify(normalized, null, 2));
  console.log(
    "\nSi algún slug no existe en la tabla Niche, se crea automáticamente",
  );
  console.log(
    "→ los nuevos nichos aparecen en los filtros del marketplace y en el selector",
  );
  console.log(
    "  de campañas de las marcas. (memoria 'propagar info en toda la plataforma')",
  );

  // ── 5. COST ESTIMATE ─────────────────────────────────────────────
  section("PASO 5 · Estimación de costo real");
  const inputTokens = 2800; // imagen + XML + system + tool schema
  const outputTokens = 350;
  const sonnetIn = (inputTokens / 1_000_000) * 3;
  const sonnetOut = (outputTokens / 1_000_000) * 15;
  const total = sonnetIn + sonnetOut;
  console.log(`  input tokens:  ~${inputTokens}`);
  console.log(`  output tokens: ~${outputTokens}`);
  console.log(`  modelo:        claude-sonnet-4-6`);
  console.log(`  costo:         ~$${total.toFixed(4)} USD (menos de 2 centavos)`);
  console.log(`\n  💡 100 autofills = ~$${(total * 100).toFixed(2)} USD`);
  console.log(`  💡 Créditos free de cuenta nueva: $5 = ~${Math.floor(5 / total)} autofills`);

  console.log("\n✅ Demo completo. Ningún centavo gastado — solo 1 fetch HTML público.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
