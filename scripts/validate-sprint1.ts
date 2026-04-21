/**
 * Validación automática de Sprint 1 (sin DB):
 * 1. Validators zod — rechazan payloads maliciosos (CRÍTICA-4).
 * 2. Role helpers — homeForRole devuelve lo correcto (CRÍTICA-1).
 *
 * Uso: pnpm tsx scripts/validate-sprint1.ts
 */
import {
  createInquirySchema,
  httpsUrl,
  saveIdentitySchema,
  saveSocialProfileSchema,
} from "../src/lib/validators";
import { homeForRole } from "../src/lib/require-role";

let failed = 0;

function assert(name: string, cond: boolean, detail?: string) {
  if (cond) {
    console.log(`  ✓ ${name}`);
  } else {
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
    failed += 1;
  }
}

console.log("\n🔒 CRÍTICA-4 — validators anti-XSS\n");

// httpsUrl bloquea javascript: y data:
assert(
  "httpsUrl rechaza 'javascript:alert(1)'",
  !httpsUrl.safeParse("javascript:alert(1)").success,
);
assert(
  "httpsUrl rechaza 'data:text/html,<script>'",
  !httpsUrl.safeParse("data:text/html,<script>").success,
);
assert(
  "httpsUrl acepta 'https://foo.com/img.jpg'",
  httpsUrl.safeParse("https://foo.com/img.jpg").success,
);
assert(
  "httpsUrl rechaza string > 500 chars",
  !httpsUrl.safeParse("https://" + "x".repeat(510)).success,
);

// saveIdentity bloquea profileImageUrl malicioso
const malicious = saveIdentitySchema.safeParse({
  profileImageUrl: "javascript:alert(document.cookie)",
});
assert("saveIdentitySchema rechaza profileImageUrl=javascript:", !malicious.success);

// createInquiry exige email válido
assert(
  "createInquirySchema rechaza email inválido",
  !createInquirySchema.safeParse({
    slug: "maria",
    brief: "Un brief suficientemente largo para pasar",
    contactName: "Nico",
    contactEmail: "no-es-email",
  }).success,
);
assert(
  "createInquirySchema rechaza brief < 20 chars",
  !createInquirySchema.safeParse({
    slug: "maria",
    brief: "corto",
    contactName: "Nico",
    contactEmail: "a@b.co",
  }).success,
);
assert(
  "createInquirySchema rechaza slug con /",
  !createInquirySchema.safeParse({
    slug: "hack/../admin",
    brief: "Un brief suficientemente largo para pasar",
    contactName: "Nico",
    contactEmail: "a@b.co",
  }).success,
);
assert(
  "createInquirySchema acepta payload válido",
  createInquirySchema.safeParse({
    slug: "maria",
    brief: "Necesito un UGC de 30s para lanzamiento.",
    contactName: "Nico García",
    contactEmail: "nico@coma.co",
  }).success,
);

// saveSocialProfile rechaza handle con caracteres raros
assert(
  "saveSocialProfileSchema rechaza handle con <script>",
  !saveSocialProfileSchema.safeParse({
    platform: "INSTAGRAM",
    handle: "<script>alert(1)</script>",
  }).success,
);
assert(
  "saveSocialProfileSchema rechaza platform inválida",
  !saveSocialProfileSchema.safeParse({
    platform: "FACEBOOK",
    handle: "maria",
  }).success,
);

console.log("\n🛡️  CRÍTICA-1 — role → home\n");
assert("CREATOR → /mi-espacio", homeForRole("CREATOR") === "/mi-espacio");
assert("CLIENT → /portal", homeForRole("CLIENT") === "/portal");
assert("ADMIN → /dashboard", homeForRole("ADMIN") === "/dashboard");
assert("TEAM → /dashboard", homeForRole("TEAM") === "/dashboard");
assert("desconocido → /login", homeForRole("HACKER") === "/login");

console.log(
  `\n${failed === 0 ? "✅" : "❌"} ${failed === 0 ? "Todos los checks pasaron" : `${failed} checks fallaron`}\n`,
);
process.exit(failed > 0 ? 1 : 0);
