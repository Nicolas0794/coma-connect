import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

async function updateCreator(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  const fullName = (formData.get("fullName") as string)?.trim();
  if (!fullName) redirect(`/creadores/${id}/editar?error=name`);

  const nichesRaw = (formData.get("niches") as string)?.trim();
  const niches = nichesRaw
    ? nichesRaw.split(",").map((n) => n.trim()).filter(Boolean)
    : [];

  await prisma.creator.update({
    where: { id },
    data: {
      fullName,
      email: (formData.get("email") as string)?.trim() || null,
      phone: (formData.get("phone") as string)?.trim() || null,
      city: (formData.get("city") as string)?.trim() || null,
      country: (formData.get("country") as string)?.trim() || null,
      bio: (formData.get("bio") as string)?.trim() || null,
      niches,
      notes: (formData.get("notes") as string)?.trim() || null,
    },
  });

  const igHandle = (formData.get("igHandle") as string)?.trim();
  const tkHandle = (formData.get("tkHandle") as string)?.trim();

  await prisma.creatorSocialProfile.deleteMany({ where: { creatorId: id } });

  const profiles = [];
  if (igHandle) {
    profiles.push({
      creatorId: id,
      platform: "INSTAGRAM" as const,
      handle: igHandle.replace("@", ""),
      url: `https://instagram.com/${igHandle.replace("@", "")}`,
      followers: parseInt(formData.get("igFollowers") as string) || null,
    });
  }
  if (tkHandle) {
    profiles.push({
      creatorId: id,
      platform: "TIKTOK" as const,
      handle: tkHandle.replace("@", ""),
      url: `https://tiktok.com/@${tkHandle.replace("@", "")}`,
      followers: parseInt(formData.get("tkFollowers") as string) || null,
    });
  }
  if (profiles.length > 0) {
    await prisma.creatorSocialProfile.createMany({ data: profiles });
  }

  redirect(`/creadores/${id}`);
}

export default async function EditarCreadorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  const creator = await prisma.creator.findUnique({
    where: { id },
    include: { socialProfiles: true },
  });
  if (!creator) notFound();

  const ig = creator.socialProfiles.find((s) => s.platform === "INSTAGRAM");
  const tk = creator.socialProfiles.find((s) => s.platform === "TIKTOK");

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <Link
          href={`/creadores/${id}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← {creator.fullName}
        </Link>
        <h1 className="text-2xl text-foreground mt-2">Editar creador</h1>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <form action={updateCreator} className="space-y-5">
          <input type="hidden" name="id" value={id} />

          <div>
            <h3 className="text-sm text-muted-foreground mb-3">Información personal</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Nombre completo *</Label>
                <Input name="fullName" defaultValue={creator.fullName} required />
                {sp.error === "name" && (
                  <p className="text-xs text-destructive">El nombre es obligatorio.</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Email</Label>
                <Input name="email" type="email" defaultValue={creator.email ?? ""} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3 mt-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Teléfono</Label>
                <Input name="phone" defaultValue={creator.phone ?? ""} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Ciudad</Label>
                <Input name="city" defaultValue={creator.city ?? ""} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">País</Label>
                <Input name="country" defaultValue={creator.country ?? "Colombia"} />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm text-muted-foreground mb-3">Perfil creativo</h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Nichos (separados por coma)</Label>
                <Input name="niches" defaultValue={creator.niches.join(", ")} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Bio</Label>
                <textarea
                  name="bio"
                  defaultValue={creator.bio ?? ""}
                  className="h-20 w-full rounded-lg border border-input/60 bg-secondary px-3 py-2 text-sm text-foreground outline-none transition-all duration-150 placeholder:text-muted-foreground/60 hover:border-input focus:border-accent focus:ring-2 focus:ring-accent/15 resize-none"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm text-muted-foreground mb-3">Redes sociales</h3>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Instagram @</Label>
                  <Input name="igHandle" defaultValue={ig?.handle ?? ""} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Seguidores IG</Label>
                  <Input name="igFollowers" type="number" defaultValue={ig?.followers ?? ""} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">TikTok @</Label>
                  <Input name="tkHandle" defaultValue={tk?.handle ?? ""} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Seguidores TK</Label>
                  <Input name="tkFollowers" type="number" defaultValue={tk?.followers ?? ""} />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Notas internas</Label>
            <textarea
              name="notes"
              defaultValue={creator.notes ?? ""}
              className="h-16 w-full rounded-lg border border-input/60 bg-secondary px-3 py-2 text-sm text-foreground outline-none transition-all duration-150 placeholder:text-muted-foreground/60 hover:border-input focus:border-accent focus:ring-2 focus:ring-accent/15 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit">Guardar cambios</Button>
            <Link href={`/creadores/${id}`}>
              <Button type="button" variant="ghost">Cancelar</Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
