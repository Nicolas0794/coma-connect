import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { getNextCampaignCode } from "../src/lib/campaign-code";

async function step(n: number, name: string) {
  console.log(`\n── ${n}. ${name} ──`);
}

async function main() {
  await step(1, "Buscar creadora publicada");
  const creator = await prisma.creator.findFirst({
    where: { profileStatus: "PUBLISHED", profileVisibility: "PUBLIC", slug: { not: null } },
    select: { id: true, slug: true, fullName: true, email: true },
  });
  if (!creator) {
    console.log("  ✗ Ningún creador publicado. Abortando.");
    return;
  }
  console.log(`  ✓ ${creator.fullName} (${creator.slug})`);

  // Limpiar inquiries previas de este flow (para testear repetible)
  await prisma.inquiry.deleteMany({
    where: { creatorId: creator.id, contactEmail: "test-brand@example.com" },
  });

  await step(2, "Marca envía inquiry desde el perfil público");
  const inquiry = await prisma.inquiry.create({
    data: {
      creatorId: creator.id,
      contactName: "Luis (Restaurante X)",
      contactEmail: "test-brand@example.com",
      contactPhone: "+573001234567",
      brief:
        "Necesitamos 2 reels UGC para el lanzamiento de nuestro nuevo combo en Medellín. Buscamos autenticidad, energía cálida y mostrar el producto en uso real.",
      budgetCOP: 800000,
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
      status: "PENDING",
    },
  });
  console.log(`  ✓ Inquiry #${inquiry.id.slice(-6)} — status=${inquiry.status}`);

  await step(3, "Creadora abre (se marca VIEWED)");
  await prisma.inquiry.update({ where: { id: inquiry.id }, data: { status: "VIEWED" } });
  const i2 = await prisma.inquiry.findUnique({ where: { id: inquiry.id }, select: { status: true } });
  console.log(`  ✓ status=${i2?.status}`);

  await step(4, "Creadora envía cotización");
  const quote = await prisma.quote.create({
    data: {
      inquiryId: inquiry.id,
      priceCOP: 1200000,
      scope: "2 Reels UGC de 30s + 3 stories. Uso orgánico 30 días. 1 ronda de revisiones incluida.",
      deliveryDays: 7,
      terms: "50% anticipado. Derechos de uso pagado 30 días.",
    },
  });
  await prisma.inquiry.update({ where: { id: inquiry.id }, data: { status: "QUOTED" } });
  console.log(`  ✓ Quote $${Number(quote.priceCOP).toLocaleString("es-CO")} COP, status=QUOTED`);

  await step(5, "Mensaje ida y vuelta");
  // creator → client (sender = creator's user)
  const creatorFull = await prisma.creator.findUnique({
    where: { id: creator.id },
    select: { userId: true },
  });
  if (creatorFull?.userId) {
    await prisma.inquiryMessage.create({
      data: {
        inquiryId: inquiry.id,
        senderId: creatorFull.userId,
        body: "Hola Luis, te envié la cotización. Cualquier duda me avisás.",
      },
    });
  }
  const mcount = await prisma.inquiryMessage.count({ where: { inquiryId: inquiry.id } });
  console.log(`  ✓ ${mcount} mensaje(s)`);

  await step(6, "Aceptar y convertir en campaña");
  // Crear Client mínimo
  const lead = await prisma.client.create({
    data: {
      name: "Luis (Restaurante X)",
      email: "test-brand@example.com",
      phone: "+573001234567",
      notes: "Lead generado desde Inquiry pública (test flow)",
    },
  });
  const code = await getNextCampaignCode();
  const campaign = await prisma.campaign.create({
    data: {
      clientId: lead.id,
      code,
      name: `${creator.fullName} × Luis (Restaurante X)`.slice(0, 80),
      status: "ACTIVE",
      objective: inquiry.brief.slice(0, 500),
      budget: quote.priceCOP,
      startDate: new Date(),
      endDate: inquiry.deadline,
      briefOriginal: inquiry.brief,
    },
  });
  await prisma.campaignCreator.create({
    data: {
      campaignId: campaign.id,
      creatorId: creator.id,
      status: "ACCEPTED",
      fee: quote.priceCOP,
      acceptedAt: new Date(),
    },
  });
  await prisma.inquiry.update({
    where: { id: inquiry.id },
    data: { status: "CONVERTED_TO_CAMPAIGN", campaignId: campaign.id },
  });
  console.log(`  ✓ Campaign ${campaign.code} — ${campaign.name}`);
  console.log(`  ✓ Client nuevo: ${lead.name}`);
  console.log(`  ✓ CampaignCreator ACCEPTED con fee $${Number(quote.priceCOP).toLocaleString("es-CO")}`);

  await step(7, "Estado final de la inquiry");
  const final = await prisma.inquiry.findUnique({
    where: { id: inquiry.id },
    include: {
      campaign: { select: { code: true, name: true, status: true } },
      quotes: true,
      _count: { select: { messages: true } },
    },
  });
  console.log(`  status: ${final?.status}`);
  console.log(`  → Campaña: ${final?.campaign?.code} (${final?.campaign?.status})`);
  console.log(`  mensajes: ${final?._count.messages}, cotizaciones: ${final?.quotes.length}`);

  console.log(`\n🎉 Flujo completo. Abrí:`);
  console.log(`   http://localhost:3000/mi-espacio/inquiries  (bandeja creadora)`);
  console.log(`   http://localhost:3000/mi-espacio/inquiries/${inquiry.id}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
