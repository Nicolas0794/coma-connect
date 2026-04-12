import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

async function createCreator(formData: FormData) {
  "use server";
  const fullName = (formData.get("fullName") as string)?.trim();
  if (!fullName) redirect("/creadores/nuevo?error=name");

  const nichesRaw = (formData.get("niches") as string)?.trim();
  const niches = nichesRaw
    ? nichesRaw.split(",").map((n) => n.trim()).filter(Boolean)
    : [];

  const creator = await prisma.creator.create({
    data: {
      fullName,
      email: (formData.get("email") as string)?.trim() || null,
      phone: (formData.get("phone") as string)?.trim() || null,
      city: (formData.get("city") as string)?.trim() || null,
      country: (formData.get("country") as string)?.trim() || "Colombia",
      bio: (formData.get("bio") as string)?.trim() || null,
      niches,
      notes: (formData.get("notes") as string)?.trim() || null,
    },
  });

  const igHandle = (formData.get("igHandle") as string)?.trim();
  const tkHandle = (formData.get("tkHandle") as string)?.trim();

  const profiles = [];
  if (igHandle) {
    profiles.push({
      creatorId: creator.id,
      platform: "INSTAGRAM" as const,
      handle: igHandle.replace("@", ""),
      url: `https://instagram.com/${igHandle.replace("@", "")}`,
      followers: parseInt(formData.get("igFollowers") as string) || null,
    });
  }
  if (tkHandle) {
    profiles.push({
      creatorId: creator.id,
      platform: "TIKTOK" as const,
      handle: tkHandle.replace("@", ""),
      url: `https://tiktok.com/@${tkHandle.replace("@", "")}`,
      followers: parseInt(formData.get("tkFollowers") as string) || null,
    });
  }

  if (profiles.length > 0) {
    await prisma.creatorSocialProfile.createMany({ data: profiles });
  }

  redirect(`/creadores/${creator.id}`);
}

export default async function NuevoCreadorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <Link
          href="/creadores"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Creadores
        </Link>
        <h1 className="text-2xl text-foreground mt-2">Nuevo creador</h1>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <form action={createCreator} className="space-y-5">
          <div>
            <h3 className="text-sm text-muted-foreground mb-3">
              Información personal
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Nombre completo *
                </Label>
                <Input name="fullName" placeholder="Nombre del creador" required />
                {params.error === "name" && (
                  <p className="text-xs text-destructive">El nombre es obligatorio.</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Email</Label>
                <Input name="email" type="email" placeholder="correo@ejemplo.com" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3 mt-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Teléfono</Label>
                <Input name="phone" placeholder="+57 300 000 0000" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Ciudad</Label>
                <Input name="city" placeholder="Ej: Cali" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">País</Label>
                <Input name="country" defaultValue="Colombia" />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm text-muted-foreground mb-3">
              Perfil creativo
            </h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Nichos (separados por coma)
                </Label>
                <Input
                  name="niches"
                  placeholder="Ej: moda, lifestyle, fitness"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Bio</Label>
                <textarea
                  name="bio"
                  placeholder="Breve descripción del creador..."
                  className="h-20 w-full rounded-lg border border-input/60 bg-secondary px-3 py-2 text-sm text-foreground outline-none transition-all duration-150 placeholder:text-muted-foreground/60 hover:border-input focus:border-accent focus:ring-2 focus:ring-accent/15 resize-none"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm text-muted-foreground mb-3">
              Redes sociales
            </h3>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Instagram @
                  </Label>
                  <Input name="igHandle" placeholder="usuario" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Seguidores IG
                  </Label>
                  <Input name="igFollowers" type="number" placeholder="Ej: 50000" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    TikTok @
                  </Label>
                  <Input name="tkHandle" placeholder="usuario" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Seguidores TK
                  </Label>
                  <Input name="tkFollowers" type="number" placeholder="Ej: 120000" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Notas internas
            </Label>
            <textarea
              name="notes"
              placeholder="Observaciones del equipo..."
              className="h-16 w-full rounded-lg border border-input/60 bg-secondary px-3 py-2 text-sm text-foreground outline-none transition-all duration-150 placeholder:text-muted-foreground/60 hover:border-input focus:border-accent focus:ring-2 focus:ring-accent/15 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit">Crear creador</Button>
            <Link href="/creadores">
              <Button type="button" variant="ghost">Cancelar</Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
