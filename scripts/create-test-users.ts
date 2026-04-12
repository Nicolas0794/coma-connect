import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

async function main() {
  const passwordHash = await bcrypt.hash("test1234", 10);

  // Usuario cliente
  const clientUser = await prisma.user.upsert({
    where: { email: "cliente@test.com" },
    update: { passwordHash, role: "CLIENT" },
    create: {
      email: "cliente@test.com",
      name: "María López (Comfandi)",
      passwordHash,
      role: "CLIENT",
    },
  });

  // Crear client Comfandi si no existe
  let comfandi = await prisma.client.findFirst({ where: { name: "Comfandi" } });
  if (!comfandi) {
    comfandi = await prisma.client.create({
      data: { name: "Comfandi", industry: "Caja de compensación" },
    });
  }

  // Vincular usuario al cliente
  await prisma.clientMember.upsert({
    where: { clientId_userId: { clientId: comfandi.id, userId: clientUser.id } },
    update: {},
    create: { clientId: comfandi.id, userId: clientUser.id, isPrimary: true },
  });

  // Usuario creadora
  const creatorUser = await prisma.user.upsert({
    where: { email: "creadora@test.com" },
    update: { passwordHash, role: "CREATOR" },
    create: {
      email: "creadora@test.com",
      name: "Valentina Arce",
      passwordHash,
      role: "CREATOR",
    },
  });

  // Crear perfil de creadora
  await prisma.creator.upsert({
    where: { userId: creatorUser.id },
    update: {},
    create: {
      userId: creatorUser.id,
      fullName: "Valentina Arce Rincón",
      email: "creadora@test.com",
      phone: "3026697590",
      city: "Cali",
      country: "Colombia",
      niches: ["lifestyle", "moda"],
    },
  });

  console.log("✓ Usuarios de prueba creados:");
  console.log("");
  console.log("  CLIENTE:");
  console.log("  Email: cliente@test.com");
  console.log("  Contraseña: test1234");
  console.log("");
  console.log("  CREADORA:");
  console.log("  Email: creadora@test.com");
  console.log("  Contraseña: test1234");
  console.log("");
  console.log("  ADMIN: el que ya creaste antes");
  console.log("");
  console.log("Para probar cada portal, cerrá sesión y logueate con cada email.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
