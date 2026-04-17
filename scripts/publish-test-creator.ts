import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const existing = await prisma.creator.findFirst({
    where: { email: "creadora@test.com" },
  });
  if (!existing) throw new Error("Creadora de prueba no encontrada");
  const c = await prisma.creator.update({
    where: { id: existing.id },
    data: {
      profileStatus: "PUBLISHED",
      profileVisibility: "PUBLIC",
      publishedAt: new Date(),
      artistName: "Valen Arce",
      headline: "Creadora UGC de lifestyle y moda en Cali",
      valuePitch:
        "Hago contenido orgánico para marcas que buscan conectar con audiencia joven en Colombia. Especialista en reels y fotografía editorial.",
      creatorTypes: ["UGC", "INFLUENCER"],
      contentFormats: ["REEL", "PHOTO"],
      languages: ["ES"],
      availability: "AVAILABLE",
    },
  });
  console.log("✓ Publicado:", c.slug);
  console.log("  URL: http://localhost:3000/@" + c.slug);
  console.log("  URL directa: http://localhost:3000/c/" + c.slug);
}
main().finally(() => prisma.$disconnect());
