import "dotenv/config";
import { prisma } from "../src/lib/prisma";

const SKILLS = [
  { name: "Storytelling para marca", category: "STORYTELLING" as const },
  { name: "Producción de Reels", category: "PRODUCTION" as const },
  { name: "Edición ágil en CapCut", category: "EDITING" as const },
  { name: "Fotografía editorial", category: "PRODUCTION" as const },
  { name: "Copy publicitario", category: "BRAND" as const },
  { name: "Estrategia de contenido", category: "STRATEGY" as const },
  { name: "Iluminación y sonido básico", category: "PRODUCTION" as const },
  { name: "Comunicación con clientes", category: "SOFT" as const },
];

const COURSES = [
  {
    slug: "reels-que-convierten",
    title: "Reels que convierten",
    summary: "Aprende a crear reels de marca que generan resultados reales.",
    description:
      "Curso práctico para crear reels que cumplen objetivos de negocio: awareness, conversión o comunidad. Incluye 6 módulos con ejemplos reales de campañas CoMa.",
    coverUrl: "https://picsum.photos/seed/reels/800/450",
    level: "BEGINNER" as const,
    durationMin: 180,
    skillSlugs: ["produccion-de-reels", "edicion-agil-en-capcut", "storytelling-para-marca"],
  },
  {
    slug: "fundamentos-ugc",
    title: "Fundamentos UGC para marcas",
    summary: "Todo lo que una creadora UGC necesita: autenticidad, ritmo y entrega.",
    description:
      "Desde cómo leer un brief hasta cómo entregar UGC que el cliente pueda reutilizar. 4 módulos. Con checklist descargable.",
    coverUrl: "https://picsum.photos/seed/ugc/800/450",
    level: "BEGINNER" as const,
    durationMin: 120,
    skillSlugs: ["comunicacion-con-clientes", "storytelling-para-marca"],
  },
  {
    slug: "estrategia-creator",
    title: "Estrategia de contenido para tu marca personal",
    summary: "Pensá como un estratega, no solo como ejecutor.",
    description:
      "Aprende a definir pilares, calendarios y métricas para hacer crecer tu marca como creadora.",
    coverUrl: "https://picsum.photos/seed/strat/800/450",
    level: "INTERMEDIATE" as const,
    durationMin: 240,
    skillSlugs: ["estrategia-de-contenido", "copy-publicitario"],
  },
];

const EVENTS = [
  {
    slug: "coma-meetup-cali-mayo",
    name: "CoMa Meetup Cali — Mayo",
    description: "Encuentro mensual de creadoras en Cali. Networking + café + charla relámpago.",
    type: "MEETUP" as const,
    city: "Cali",
    venue: "Usaquén Coworking",
    startAt: new Date("2026-05-15T19:00:00-05:00"),
    endAt: new Date("2026-05-15T22:00:00-05:00"),
    capacity: 50,
    status: "PUBLISHED" as const,
    tags: ["networking", "cali"],
  },
  {
    slug: "workshop-ugc-bogota",
    name: "Workshop UGC Bogotá",
    description: "Taller práctico de UGC. Grabá 1 reel y recibí feedback en vivo.",
    type: "WORKSHOP" as const,
    city: "Bogotá",
    venue: "Estudio CoMa",
    startAt: new Date("2026-06-01T14:00:00-05:00"),
    endAt: new Date("2026-06-01T18:00:00-05:00"),
    capacity: 20,
    status: "PUBLISHED" as const,
    tags: ["workshop", "ugc", "bogota"],
  },
];

function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  console.log("→ Skills");
  for (const s of SKILLS) {
    await prisma.skill.upsert({
      where: { slug: slugify(s.name) },
      update: {},
      create: { name: s.name, slug: slugify(s.name), category: s.category },
    });
  }
  console.log(`  ✓ ${SKILLS.length} skills`);

  console.log("→ Courses");
  for (const c of COURSES) {
    const course = await prisma.course.upsert({
      where: { slug: c.slug },
      update: {},
      create: {
        slug: c.slug,
        title: c.title,
        summary: c.summary,
        description: c.description,
        coverUrl: c.coverUrl,
        level: c.level,
        status: "PUBLISHED",
        durationMin: c.durationMin,
        publishedAt: new Date(),
      },
    });

    // módulo + lecciones mock si no existen
    const existingModules = await prisma.courseModule.count({ where: { courseId: course.id } });
    if (existingModules === 0) {
      for (let m = 1; m <= 3; m++) {
        const mod = await prisma.courseModule.create({
          data: {
            courseId: course.id,
            title: `Módulo ${m} — ${c.title}`,
            summary: `Contenido del módulo ${m}`,
            order: m,
          },
        });
        for (let l = 1; l <= 3; l++) {
          await prisma.lesson.create({
            data: {
              moduleId: mod.id,
              title: `Lección ${m}.${l}`,
              bodyMd: `Contenido de la lección ${m}.${l}. (mock)`,
              durationMin: 15,
              order: l,
            },
          });
        }
      }
    }

    // Linkear skills
    for (const skillSlug of c.skillSlugs) {
      const skill = await prisma.skill.findUnique({ where: { slug: skillSlug } });
      if (skill) {
        await prisma.courseSkill.upsert({
          where: { courseId_skillId: { courseId: course.id, skillId: skill.id } },
          update: {},
          create: { courseId: course.id, skillId: skill.id },
        });
      }
    }
  }
  console.log(`  ✓ ${COURSES.length} cursos`);

  console.log("→ Events");
  for (const e of EVENTS) {
    const event = await prisma.event.upsert({
      where: { slug: e.slug },
      update: {},
      create: {
        slug: e.slug,
        name: e.name,
        description: e.description,
        type: e.type,
        city: e.city,
        venue: e.venue,
        startAt: e.startAt,
        endAt: e.endAt,
        capacity: e.capacity,
        status: e.status,
      },
    });
    for (const tag of e.tags) {
      await prisma.eventTag.upsert({
        where: { eventId_tag: { eventId: event.id, tag } },
        update: {},
        create: { eventId: event.id, tag },
      });
    }
  }
  console.log(`  ✓ ${EVENTS.length} eventos`);

  console.log("→ Backfill UserAchievement desde campañas COMPLETED");
  const completedCCs = await prisma.campaignCreator.findMany({
    where: { status: "COMPLETED" },
    include: {
      creator: { select: { userId: true, fullName: true } },
      campaign: { select: { name: true, code: true } },
    },
  });
  let achievementsAdded = 0;
  for (const cc of completedCCs) {
    const userId = cc.creator?.userId;
    if (!userId) continue;
    const existing = await prisma.userAchievement.findFirst({
      where: { userId, type: "CAMPAIGN_COMPLETED", sourceId: cc.id },
    });
    if (existing) continue;
    await prisma.userAchievement.create({
      data: {
        userId,
        type: "CAMPAIGN_COMPLETED",
        title: cc.campaign.name,
        description: `Campaña ${cc.campaign.code} completada`,
        emoji: "🎯",
        sourceId: cc.id,
        issuedAt: cc.completedAt ?? new Date(),
      },
    });
    achievementsAdded += 1;
  }
  console.log(`  ✓ ${achievementsAdded} achievements de campañas`);

  console.log("\n✅ Seed Academy+Nation completo.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
