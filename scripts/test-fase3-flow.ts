import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import {
  generateUniqueSlug,
  recomputeCreatorCompleteness,
} from "../src/lib/creator-profile";

async function step(name: string) {
  console.log(`\n── ${name} ──`);
}

async function main() {
  const email = "maria.prueba@test.com";
  const name = "María Prueba Fase 3";

  await step("1. Reset");
  await prisma.user.deleteMany({ where: { email } });
  console.log("✓ limpio");

  await step("2. Simular registro (crea User + Creator + slug)");
  const passwordHash = await bcrypt.hash("test1234", 10);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role: "CREATOR" },
  });
  const slug = await generateUniqueSlug(name);
  const creator = await prisma.creator.create({
    data: {
      userId: user.id,
      fullName: name,
      email,
      slug,
      profileStatus: "DRAFT",
      profileVisibility: "PRIVATE",
    },
  });
  console.log(`✓ Creator creado: slug=${creator.slug}, status=${creator.profileStatus}`);

  await step("3. Completitud inicial");
  let c = await prisma.creator.findUnique({
    where: { id: creator.id },
    select: { profileCompleteness: true, profileStatus: true },
  });
  console.log(`  completeness: ${c?.profileCompleteness}%`);

  await step("4. Llenar identidad");
  await prisma.creator.update({
    where: { id: creator.id },
    data: {
      artistName: "Mari",
      headline: "Creadora de contenido foodie en Medellín",
      valuePitch:
        "Hago contenido gastronómico para marcas locales y restaurantes de Medellín. Producción ágil, estética cálida y audiencia fiel.",
      profileImageUrl: "https://picsum.photos/seed/mari/400",
      city: "Medellín",
      country: "Colombia",
    },
  });
  await recomputeCreatorCompleteness(creator.id);
  c = await prisma.creator.findUnique({
    where: { id: creator.id },
    select: { profileCompleteness: true, profileStatus: true },
  });
  console.log(`  completeness: ${c?.profileCompleteness}%`);

  await step("5. Llenar clasificación");
  await prisma.creator.update({
    where: { id: creator.id },
    data: {
      creatorTypes: ["UGC", "INFLUENCER"],
      contentFormats: ["REEL", "PHOTO"],
      languages: ["ES"],
      niches: ["comida", "lifestyle"],
      yearsOfExperience: 3,
    },
  });
  await recomputeCreatorCompleteness(creator.id);
  c = await prisma.creator.findUnique({
    where: { id: creator.id },
    select: { profileCompleteness: true, profileStatus: true },
  });
  console.log(`  completeness: ${c?.profileCompleteness}%`);

  await step("6. Agregar redes sociales");
  await prisma.creatorSocialProfile.create({
    data: {
      creatorId: creator.id,
      platform: "INSTAGRAM",
      handle: "mari_foodie",
      url: "https://instagram.com/mari_foodie",
      verifiedFollowers: 12500,
    },
  });
  await recomputeCreatorCompleteness(creator.id);
  c = await prisma.creator.findUnique({
    where: { id: creator.id },
    select: { profileCompleteness: true, profileStatus: true },
  });
  console.log(`  completeness: ${c?.profileCompleteness}%`);

  await step("7. Agregar 3 items de portafolio");
  for (let i = 1; i <= 3; i++) {
    await prisma.portfolioItem.create({
      data: {
        creatorId: creator.id,
        title: `Campaña ${i} — Restaurante X`,
        brandName: `Marca ${i}`,
        externalUrl: `https://instagram.com/p/example${i}`,
        coverImageUrl: `https://picsum.photos/seed/p${i}/600/400`,
      },
    });
  }
  await recomputeCreatorCompleteness(creator.id);
  c = await prisma.creator.findUnique({
    where: { id: creator.id },
    select: { profileCompleteness: true, profileStatus: true },
  });
  console.log(`  completeness: ${c?.profileCompleteness}%`);

  await step("8. Agregar un servicio");
  await prisma.service.create({
    data: {
      creatorId: creator.id,
      title: "Reel UGC 30s food review",
      description: "Review orgánico en tu local, entrega en 5 días con 2 revisiones.",
      priceCOP: 350000,
      deliveryDays: 5,
    },
  });
  await recomputeCreatorCompleteness(creator.id);
  c = await prisma.creator.findUnique({
    where: { id: creator.id },
    select: { profileCompleteness: true, profileStatus: true },
  });
  console.log(`  completeness: ${c?.profileCompleteness}%, status: ${c?.profileStatus}`);

  await step("9. Enviar a revisión (simulando botón)");
  if ((c?.profileCompleteness ?? 0) >= 60) {
    await prisma.creator.update({
      where: { id: creator.id },
      data: { profileStatus: "PENDING_REVIEW" },
    });
    console.log(`  ✓ status → PENDING_REVIEW`);
  } else {
    console.log(`  ✗ NO SE PUEDE: completitud < 60%`);
  }

  await step("10. Admin lo aprueba (simulando botón 'Aprobar y publicar')");
  await prisma.creator.update({
    where: { id: creator.id },
    data: {
      profileStatus: "PUBLISHED",
      profileVisibility: "PUBLIC",
      publishedAt: new Date(),
    },
  });
  const final = await prisma.creator.findUnique({
    where: { id: creator.id },
    select: { slug: true, profileStatus: true, profileVisibility: true, profileCompleteness: true },
  });
  console.log(`  ✓ ${JSON.stringify(final, null, 2)}`);

  console.log(`\n🎉 Perfil listo en:`);
  console.log(`   http://localhost:3000/@${final?.slug}`);
  console.log(`   http://localhost:3000/talento`);
  console.log(`\nLogin para testear perfil editor (creator space):`);
  console.log(`   email: ${email}`);
  console.log(`   pass:  test1234`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
