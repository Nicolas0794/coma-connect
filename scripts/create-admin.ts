import "dotenv/config";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

async function main() {
  const rl = readline.createInterface({ input, output });

  const email = (await rl.question("Email: ")).trim().toLowerCase();
  const name = (await rl.question("Nombre: ")).trim();
  const password = (await rl.question("Contraseña (mín. 8 caracteres): ")).trim();

  rl.close();

  if (!email || !password || password.length < 8) {
    console.error("❌ Email y contraseña son obligatorios. Contraseña debe tener 8+ caracteres.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { name, passwordHash, role: "ADMIN" },
    create: { email, name, passwordHash, role: "ADMIN" },
  });

  console.log(`✓ Admin listo: ${user.email} (rol: ${user.role})`);
}

main()
  .catch((err) => {
    console.error("Error creando admin:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
