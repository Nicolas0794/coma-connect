import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  saveIdentity,
  saveLocation,
  saveClassification,
  saveAvailability,
  saveSocialProfile,
  addPortfolioItem,
  removePortfolioItem,
  addService,
  removeService,
  submitForReview,
  promoteContentPieceToPortfolio,
} from "./actions";

const CREATOR_TYPES = [
  { key: "UGC", label: "UGC" },
  { key: "INFLUENCER", label: "Influencer" },
  { key: "FILMMAKER", label: "Filmmaker" },
  { key: "PHOTOGRAPHER", label: "Fotografía" },
  { key: "EDITOR", label: "Edición" },
  { key: "STRATEGIST", label: "Estrategia" },
  { key: "COPYWRITER", label: "Copywriter" },
  { key: "DESIGNER", label: "Diseño" },
  { key: "MODEL", label: "Modelo" },
];

const CONTENT_FORMATS = [
  { key: "REEL", label: "Reel" },
  { key: "TIKTOK_VIDEO", label: "TikTok" },
  { key: "PHOTO", label: "Foto" },
  { key: "LONG_VIDEO", label: "Video largo" },
  { key: "CAROUSEL", label: "Carrusel" },
  { key: "LIVE", label: "Live" },
  { key: "PODCAST", label: "Podcast" },
  { key: "BLOG", label: "Blog" },
];

const LANGUAGES = [
  { key: "ES", label: "Español" },
  { key: "EN", label: "Inglés" },
  { key: "PT", label: "Portugués" },
];

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Borrador",
  PENDING_REVIEW: "En revisión",
  PUBLISHED: "Publicado",
  SUSPENDED: "Suspendido",
};

type SP = Promise<{ error?: string; sent?: string; autofilled?: string }>;

export default async function PerfilPage({ searchParams }: { searchParams: SP }) {
  const session = await auth();
  if (session?.user?.role !== "CREATOR") redirect("/");

  const creator = await prisma.creator.findUnique({
    where: { userId: session.user.id! },
    include: {
      socialProfiles: true,
      portfolioItems: { orderBy: { order: "asc" } },
      services: { orderBy: { order: "asc" } },
    },
  });

  if (!creator) {
    redirect("/mi-espacio");
  }

  // Piezas reales publicadas que aún no están en el portafolio
  const promotablePieces = await prisma.contentPiece.findMany({
    where: {
      status: "PUBLISHED",
      portfolioItem: null,
      campaignCreator: { creatorId: creator.id },
    },
    include: {
      campaignCreator: {
        select: { campaign: { select: { name: true, client: { select: { name: true } } } } },
      },
      metrics: { orderBy: { capturedAt: "desc" }, take: 1, select: { views: true } },
    },
    orderBy: { actualPublishDate: "desc" },
    take: 10,
  });

  const { error, sent, autofilled } = await searchParams;
  const ig = creator.socialProfiles.find((s) => s.platform === "INSTAGRAM");
  const tk = creator.socialProfiles.find((s) => s.platform === "TIKTOK");

  const checklist = [
    { done: Boolean(creator.profileImageUrl), label: "Foto de perfil" },
    { done: Boolean(creator.headline), label: "Headline" },
    { done: Boolean(creator.valuePitch || creator.bio), label: "Sobre mí (pitch)" },
    { done: Boolean(creator.city && creator.country), label: "Ubicación" },
    { done: creator.creatorTypes.length > 0, label: "Tipos de creador" },
    { done: creator.contentFormats.length > 0, label: "Formatos de contenido" },
    { done: creator.niches.length > 0, label: "Nichos" },
    { done: creator.languages.length > 0, label: "Idiomas" },
    { done: creator.socialProfiles.length > 0, label: "Al menos una red social" },
    { done: creator.portfolioItems.length >= 3, label: "3+ items de portafolio" },
    { done: creator.services.length > 0, label: "Al menos un servicio" },
  ];

  const canSubmit = creator.profileCompleteness >= 60 && creator.profileStatus === "DRAFT";
  const showAutofillHero =
    !creator.autofillAt && creator.profileCompleteness < 40;

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-6">
      {/* Hero de autofill para perfiles nuevos / incompletos */}
      {showAutofillHero && (
        <Link
          href="/mi-espacio/perfil/autofill"
          className="group block rounded-2xl border border-[#FF4B2C]/30 bg-gradient-to-br from-[#FF4B2C]/8 via-[#FF7A66]/5 to-transparent p-5 sm:p-6 hover:border-[#FF4B2C]/60 hover:shadow-[0_8px_32px_-12px_rgba(255,75,44,0.35)] transition-all"
        >
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#FF4B2C] to-[#FF7A66] flex items-center justify-center text-white text-2xl shrink-0 shadow-sm">
              ✨
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] uppercase tracking-[0.16em] text-[#FF4B2C] font-semibold mb-1">
                Empezá rápido
              </p>
              <h2 className="text-lg sm:text-xl font-semibold mb-1.5 tracking-tight">
                Completar mi perfil con IA desde Instagram
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Pegás tu @handle y Claude lee tu perfil público para proponer
                headline, nichos, tipos de contenido y tarifa base. Vos revisás
                y ajustás antes de guardar. Te ahorra ~10 min.
              </p>
            </div>
            <span className="text-[#FF4B2C] font-semibold text-sm shrink-0 group-hover:translate-x-0.5 transition-transform">
              →
            </span>
          </div>
        </Link>
      )}

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl text-foreground">Tu perfil Connect</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Este es el perfil público que las marcas van a ver.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {!showAutofillHero && (
            <Link
              href="/mi-espacio/perfil/autofill"
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#FF4B2C] to-[#FF7A66] px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-90 transition"
            >
              ✨ Autocompletar con IA
            </Link>
          )}
          <Badge variant="outline">{STATUS_LABEL[creator.profileStatus]}</Badge>
          {creator.profileStatus === "PUBLISHED" && creator.slug && (
            <Link
              href={`/@${creator.slug}`}
              target="_blank"
              className="text-xs text-primary hover:underline"
            >
              Ver perfil público ↗
            </Link>
          )}
        </div>
      </div>

      {/* Alertas */}
      {autofilled === "1" && (
        <div className="rounded-lg bg-[#D6E889]/25 border border-[#D6E889]/60 px-4 py-3 text-sm">
          ✨ Completamos tu perfil con lo que leímos de tu Instagram. Revisá
          cada sección y ajustá lo que haga falta antes de enviar a revisión.
        </div>
      )}
      {sent === "1" && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
          ✓ Perfil enviado a revisión. Te avisaremos cuando el equipo de CoMa lo apruebe.
        </div>
      )}
      {error === "incomplete" && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          Necesitás al menos 60% de completitud para enviar a revisión.
        </div>
      )}
      {error === "validation" && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          Revisá los datos ingresados — el formato de alguno no es válido.
        </div>
      )}

      {/* Completitud + checklist */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Completitud</h2>
            <span className="text-2xl font-bold">{creator.profileCompleteness}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full bg-[#FF4B2C] transition-all"
              style={{ width: `${creator.profileCompleteness}%` }}
            />
          </div>
          <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-sm">
            {checklist.map((item) => (
              <li key={item.label} className="flex items-center gap-2">
                <span className={item.done ? "text-emerald-600" : "text-muted-foreground"}>
                  {item.done ? "✓" : "○"}
                </span>
                <span className={item.done ? "text-foreground" : "text-muted-foreground"}>
                  {item.label}
                </span>
              </li>
            ))}
          </ul>

          {canSubmit && (
            <form action={submitForReview} className="mt-5">
              <Button type="submit" className="bg-[#FF4B2C] hover:bg-[#FF4B2C]/90">
                Enviar a revisión
              </Button>
            </form>
          )}
          {creator.profileStatus === "PENDING_REVIEW" && (
            <p className="mt-5 text-sm text-muted-foreground">
              Tu perfil está en revisión por el equipo de CoMa.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Identidad */}
      <Card>
        <CardContent className="p-5">
          <h2 className="font-semibold mb-4">Identidad</h2>
          <form action={saveIdentity} className="space-y-3">
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Nombre artístico</Label>
                <Input name="artistName" defaultValue={creator.artistName ?? ""} placeholder="Cómo te llaman" />
              </div>
              <div>
                <Label className="text-xs">URL de foto de perfil</Label>
                <Input name="profileImageUrl" defaultValue={creator.profileImageUrl ?? ""} placeholder="https://…" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Headline (una línea)</Label>
              <Input
                name="headline"
                defaultValue={creator.headline ?? ""}
                placeholder="Creadora UGC de lifestyle en Cali"
              />
            </div>
            <div>
              <Label className="text-xs">Sobre mí (pitch de valor)</Label>
              <textarea
                name="valuePitch"
                defaultValue={creator.valuePitch ?? ""}
                rows={4}
                placeholder="Contá qué hacés, con quién trabajás y qué te diferencia."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <Button type="submit" size="sm">Guardar</Button>
          </form>
        </CardContent>
      </Card>

      {/* Ubicación */}
      <Card>
        <CardContent className="p-5">
          <h2 className="font-semibold mb-4">Ubicación</h2>
          <form action={saveLocation} className="grid md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Ciudad</Label>
              <Input name="city" defaultValue={creator.city ?? ""} placeholder="Cali" />
            </div>
            <div>
              <Label className="text-xs">País</Label>
              <Input name="country" defaultValue={creator.country ?? "Colombia"} />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" size="sm">Guardar</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Clasificación */}
      <Card>
        <CardContent className="p-5">
          <h2 className="font-semibold mb-4">Clasificación</h2>
          <form action={saveClassification} className="space-y-4">
            <div>
              <Label className="text-xs mb-2 block">Tipos de creador</Label>
              <div className="flex flex-wrap gap-2">
                {CREATOR_TYPES.map((t) => (
                  <label key={t.key} className="inline-flex items-center gap-1.5 text-sm border border-input rounded-md px-3 py-1.5 cursor-pointer hover:bg-muted">
                    <input
                      type="checkbox"
                      name="creatorTypes"
                      value={t.key}
                      defaultChecked={creator.creatorTypes.includes(t.key as never)}
                    />
                    {t.label}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs mb-2 block">Formatos que dominás</Label>
              <div className="flex flex-wrap gap-2">
                {CONTENT_FORMATS.map((f) => (
                  <label key={f.key} className="inline-flex items-center gap-1.5 text-sm border border-input rounded-md px-3 py-1.5 cursor-pointer hover:bg-muted">
                    <input
                      type="checkbox"
                      name="contentFormats"
                      value={f.key}
                      defaultChecked={creator.contentFormats.includes(f.key as never)}
                    />
                    {f.label}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs mb-2 block">Idiomas</Label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((l) => (
                  <label key={l.key} className="inline-flex items-center gap-1.5 text-sm border border-input rounded-md px-3 py-1.5 cursor-pointer hover:bg-muted">
                    <input
                      type="checkbox"
                      name="languages"
                      value={l.key}
                      defaultChecked={creator.languages.includes(l.key as never)}
                    />
                    {l.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Nichos (separados por coma)</Label>
                <Input
                  name="niches"
                  defaultValue={creator.niches.join(", ")}
                  placeholder="moda, lifestyle, fitness"
                />
              </div>
              <div>
                <Label className="text-xs">Años de experiencia</Label>
                <Input
                  name="yearsOfExperience"
                  type="number"
                  defaultValue={creator.yearsOfExperience ?? ""}
                  min={0}
                  max={50}
                />
              </div>
            </div>
            <Button type="submit" size="sm">Guardar</Button>
          </form>
        </CardContent>
      </Card>

      {/* Disponibilidad y tarifas */}
      <Card>
        <CardContent className="p-5">
          <h2 className="font-semibold mb-4">Disponibilidad y tarifas</h2>
          <form action={saveAvailability} className="space-y-3">
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Estado</Label>
                <select
                  name="availability"
                  defaultValue={creator.availability}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="AVAILABLE">Disponible</option>
                  <option value="LIMITED">Disponibilidad limitada</option>
                  <option value="BUSY">Ocupado</option>
                  <option value="CLOSED">Cerrado a proyectos</option>
                </select>
              </div>
              <div>
                <Label className="text-xs">Tarifa base (COP)</Label>
                <Input
                  name="baseRateCOP"
                  type="number"
                  defaultValue={creator.baseRateCOP ? Number(creator.baseRateCOP) : ""}
                  placeholder="500000"
                  min={0}
                />
              </div>
            </div>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="showPricing"
                defaultChecked={creator.showPricing}
              />
              Mostrar tarifas en el perfil público
            </label>
            <div>
              <Button type="submit" size="sm">Guardar</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Redes sociales */}
      <Card>
        <CardContent className="p-5">
          <h2 className="font-semibold mb-4">Redes sociales</h2>
          <div className="space-y-3">
            <form action={saveSocialProfile} className="flex items-end gap-2">
              <input type="hidden" name="platform" value="INSTAGRAM" />
              <div className="flex-1">
                <Label className="text-xs">Instagram @handle</Label>
                <Input name="handle" defaultValue={ig?.handle ?? ""} placeholder="tu_usuario" />
              </div>
              <Button type="submit" size="sm" variant="outline">Guardar IG</Button>
            </form>
            <form action={saveSocialProfile} className="flex items-end gap-2">
              <input type="hidden" name="platform" value="TIKTOK" />
              <div className="flex-1">
                <Label className="text-xs">TikTok @handle</Label>
                <Input name="handle" defaultValue={tk?.handle ?? ""} placeholder="tu_usuario" />
              </div>
              <Button type="submit" size="sm" variant="outline">Guardar TT</Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* Portafolio */}
      <Card>
        <CardContent className="p-5">
          <h2 className="font-semibold mb-4">
            Portafolio <span className="text-muted-foreground font-normal">({creator.portfolioItems.length})</span>
          </h2>
          {creator.portfolioItems.length > 0 && (
            <ul className="mb-4 space-y-2">
              {creator.portfolioItems.map((p) => (
                <li key={p.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">{p.title}</p>
                    {p.brandName && <p className="text-xs text-muted-foreground">{p.brandName}</p>}
                    {p.externalUrl && (
                      <a href={p.externalUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                        {p.externalUrl}
                      </a>
                    )}
                  </div>
                  <form action={removePortfolioItem}>
                    <input type="hidden" name="id" value={p.id} />
                    <Button type="submit" size="sm" variant="ghost" className="text-destructive">
                      Eliminar
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
          <form action={addPortfolioItem} className="space-y-3 rounded-lg border border-dashed border-border p-4">
            <p className="text-xs text-muted-foreground">Agregar trabajo al portafolio</p>
            <Input name="title" placeholder="Título del trabajo" required />
            <div className="grid md:grid-cols-2 gap-3">
              <Input name="brandName" placeholder="Marca o cliente (opcional)" />
              <Input name="externalUrl" placeholder="Link público (IG, YouTube, Vimeo)" />
            </div>
            <Input name="coverImageUrl" placeholder="URL de imagen de portada (opcional)" />
            <Button type="submit" size="sm">Agregar</Button>
          </form>
        </CardContent>
      </Card>

      {/* Casos CoMa — promover entregables reales */}
      {promotablePieces.length > 0 && (
        <Card className="border-[#FF4B2C]/30">
          <CardContent className="p-5">
            <h2 className="font-semibold mb-1">Casos CoMa verificados</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Estas son piezas reales que ya publicaste en campañas de CoMa. Agregalas al
              portafolio con un clic y aparecerán con badge <span className="font-semibold text-[#FF4B2C]">✓ CoMa</span>.
            </p>
            <ul className="space-y-2">
              {promotablePieces.map((p) => (
                <li key={p.id} className="flex items-center justify-between rounded-lg border border-border p-3 gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{p.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {p.campaignCreator.campaign.client.name} · {p.campaignCreator.campaign.name}
                      {p.metrics[0]?.views != null && ` · ${p.metrics[0].views.toLocaleString("es-CO")} views`}
                    </p>
                  </div>
                  <form action={promoteContentPieceToPortfolio}>
                    <input type="hidden" name="contentPieceId" value={p.id} />
                    <Button type="submit" size="sm" variant="outline">
                      Agregar al portafolio
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Servicios */}
      <Card>
        <CardContent className="p-5">
          <h2 className="font-semibold mb-4">
            Servicios <span className="text-muted-foreground font-normal">({creator.services.length})</span>
          </h2>
          {creator.services.length > 0 && (
            <ul className="mb-4 space-y-2">
              {creator.services.map((s) => (
                <li key={s.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">{s.title}</p>
                    {s.description && <p className="text-xs text-muted-foreground">{s.description}</p>}
                    <p className="text-xs text-muted-foreground">
                      {s.priceCOP && `$${Number(s.priceCOP).toLocaleString("es-CO")} COP`}
                      {s.deliveryDays && ` · ${s.deliveryDays} días`}
                    </p>
                  </div>
                  <form action={removeService}>
                    <input type="hidden" name="id" value={s.id} />
                    <Button type="submit" size="sm" variant="ghost" className="text-destructive">
                      Eliminar
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
          <form action={addService} className="space-y-3 rounded-lg border border-dashed border-border p-4">
            <p className="text-xs text-muted-foreground">Agregar servicio</p>
            <Input name="title" placeholder="Ej: Reel UGC 30s" required />
            <textarea
              name="description"
              rows={2}
              placeholder="Qué incluye (opcional)"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <div className="grid md:grid-cols-2 gap-3">
              <Input name="priceCOP" type="number" placeholder="Precio COP (opcional)" min={0} />
              <Input name="deliveryDays" type="number" placeholder="Días de entrega" min={1} />
            </div>
            <Button type="submit" size="sm">Agregar</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
