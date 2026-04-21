/**
 * Invitar a alguien a registrarse con un rol elevado (TEAM, ADMIN, CLIENT).
 *
 * Uso:
 *   pnpm tsx scripts/invite-email.ts <email> <role> [nota]
 *
 * Ejemplo:
 *   pnpm tsx scripts/invite-email.ts juan@coma.co TEAM "Nuevo account manager"
 *
 * Si el email ya tiene usuario, el rol NO se cambia automáticamente —
 * este script solo prepara la whitelist para el próximo signup.
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import type { UserRole } from "../src/generated/prisma/enums";

const VALID_ROLES: UserRole[] = ["ADMIN", "TEAM", "CLIENT", "CREATOR"];

async function main() {
  const [rawEmail, rawRole, ...rest] = process.argv.slice(2);
  const note = rest.join(" ") || undefined;

  if (!rawEmail || !rawRole) {
    console.error(
      "Uso: pnpm tsx scripts/invite-email.ts <email> <role> [nota]",
    );
    process.exit(1);
  }

  const email = rawEmail.toLowerCase().trim();
  const role = rawRole.toUpperCase() as UserRole;

  if (!VALID_ROLES.includes(role)) {
    console.error(`Rol inválido "${role}". Válidos: ${VALID_ROLES.join(", ")}`);
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.warn(
      `⚠️  El email ${email} ya tiene usuario (rol actual: ${existing.role}).`,
    );
    console.warn("    La whitelist NO cambia roles de usuarios existentes.");
    console.warn("    Si querés cambiarle el rol, hacelo manualmente en DB.");
  }

  const invite = await prisma.invitedEmail.upsert({
    where: { email },
    create: { email, role, note, invitedBy: process.env.USER ?? null },
    update: { role, note, usedAt: null },
  });

  console.log(`✅ Email ${email} invitado con rol ${role}`);
  console.log(`   ID: ${invite.id}`);
  if (note) console.log(`   Nota: ${note}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
