import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { findPublicCreatorBySlug, averageRating, getDerivedBadges } from "@/lib/public-creator";
import { ContactCreatorForm } from "@/components/contact-creator-form";
import { CreatorVerifiedMetrics } from "@/components/creator-verified-metrics";

type Params = Promise<{ slug: string }>;
type SP = Promise<{ inquiry?: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const creator = await prisma.creator.findUnique({
    where: { slug },
    select: {
      fullName: true,
      artistName: true,
      headline: true,
      valuePitch: true,
      metaTitle: true,
      metaDescription: true,
      profileImageUrl: true,
      ogImageUrl: true,
      city: true,
      profileStatus: true,
    },
  });

  if (!creator || creator.profileStatus !== "PUBLISHED") {
    return { title: "Perfil no encontrado — CoMa Connect" };
  }

  const name = creator.artistName || creator.fullName;
  const title = creator.metaTitle || `${name} — CoMa Connect`;
  const description =
    creator.metaDescription ||
    creator.headline ||
    creator.valuePitch ||
    `Conoce el perfil profesional de ${name}${creator.city ? ` en ${creator.city}` : ""} en CoMa Connect.`;
  const customOg = creator.ogImageUrl || creator.profileImageUrl;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      ...(customOg ? { images: [{ url: customOg }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(customOg ? { images: [customOg] } : {}),
    },
  };
}

export default async function PublicCreatorPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SP;
}) {
  const { slug } = await params;
  const { inquiry } = await searchParams;
  const creator = await findPublicCreatorBySlug(slug);
  if (!creator) notFound();

  const session = await auth();

  // Registro de vista asíncrono — no bloquea el render
  prisma.profileView
    .create({
      data: {
        creatorId: creator.id,
        viewerId: session?.user?.id,
        source: "direct",
      },
    })
    .catch(() => {});

  const displayName = creator.artistName || creator.fullName;
  const avg = averageRating(creator.reviews);
  const isVerified = Boolean(creator.comaVerifiedAt);
  const badges = getDerivedBadges({
    avgRating: creator.avgRating,
    reviewsCount: creator.reviewsCount,
    campaignsCount: creator._count.campaignCreators,
    comaVerifiedAt: creator.comaVerifiedAt,
    publishedAt: creator.publishedAt,
  });

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Link
        href="/talento"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        ← Volver a Talento
      </Link>
      {/* Header del perfil */}
      <div className="flex flex-col md:flex-row items-start gap-6 pb-8 border-b border-border">
        <div className="shrink-0">
          {creator.profileImageUrl ? (
            <img
              src={creator.profileImageUrl}
              alt={displayName}
              className="h-32 w-32 rounded-full object-cover border border-border"
            />
          ) : (
            <div className="h-32 w-32 rounded-full bg-muted flex items-center justify-center text-3xl font-semibold text-muted-foreground">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-semibold tracking-tight">{displayName}</h1>
            {isVerified && (
              <Badge className="bg-[#FF4B2C]/10 text-[#FF4B2C] border-[#FF4B2C]/20">
                ✓ Verificado CoMa
              </Badge>
            )}
            {creator.availability === "AVAILABLE" && (
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                Disponible
              </Badge>
            )}
            {creator.availability === "BUSY" && (
              <Badge className="bg-amber-50 text-amber-700 border-amber-200">
                Ocupado
              </Badge>
            )}
          </div>
          {creator.headline && (
            <p className="mt-2 text-lg text-muted-foreground">{creator.headline}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
            {creator.city && (
              <span>📍 {creator.city}{creator.country ? `, ${creator.country}` : ""}</span>
            )}
            {creator._count.campaignCreators > 0 && (
              <span>✓ {creator._count.campaignCreators} campañas</span>
            )}
            {avg !== null && (
              <span>★ {avg.toFixed(1)} ({creator._count.reviews} reseñas)</span>
            )}
          </div>
          {creator.creatorTypes.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {creator.creatorTypes.map((t) => (
                <Badge key={t} variant="outline" className="font-normal">
                  {t.toLowerCase()}
                </Badge>
              ))}
            </div>
          )}
          {badges.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {badges.map((b) => (
                <span
                  key={b.key}
                  title={b.description}
                  className="inline-flex items-center gap-1.5 rounded-full bg-card border border-border px-3 py-1 text-xs font-medium"
                >
                  <span aria-hidden>{b.emoji}</span>
                  {b.label}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2 md:w-48">
          <ContactCreatorForm
            slug={slug}
            creatorName={displayName}
            prefillName={session?.user?.name ?? undefined}
            prefillEmail={session?.user?.email ?? undefined}
          />
          <Button variant="outline" size="lg" className="w-full">
            Guardar
          </Button>
        </div>
      </div>

      {inquiry === "sent" && (
        <div className="mt-4 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
          ✓ Tu solicitud fue enviada. {displayName} te responderá pronto por email.
        </div>
      )}
      {inquiry === "validation" && (
        <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          Completá nombre, email y un brief de al menos 20 caracteres.
        </div>
      )}

      {/* Pitch */}
      {(creator.valuePitch || creator.bio) && (
        <section className="py-8 border-b border-border">
          <h2 className="text-xl font-semibold mb-3">Sobre mí</h2>
          <p className="text-foreground/80 whitespace-pre-line leading-relaxed">
            {creator.valuePitch || creator.bio}
          </p>
        </section>
      )}

      {/* Servicios */}
      {creator.services.length > 0 && (
        <section className="py-8 border-b border-border">
          <h2 className="text-xl font-semibold mb-4">Servicios</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {creator.services.map((s) => (
              <Card key={s.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-medium">{s.title}</h3>
                      {s.description && (
                        <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
                      )}
                      {s.deliveryDays && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Entrega en {s.deliveryDays} días
                        </p>
                      )}
                    </div>
                    {creator.showPricing && s.priceCOP && (
                      <div className="text-right shrink-0">
                        <div className="text-sm text-muted-foreground">desde</div>
                        <div className="font-semibold">
                          ${Number(s.priceCOP).toLocaleString("es-CO")}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Portafolio */}
      {creator.portfolioItems.length > 0 && (
        <section className="py-8 border-b border-border">
          <h2 className="text-xl font-semibold mb-4">Portafolio</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {creator.portfolioItems.map((item) => (
              <a
                key={item.id}
                href={item.externalUrl ?? "#"}
                target={item.externalUrl ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="group block rounded-lg overflow-hidden border border-border hover:border-foreground/20 transition"
              >
                <div className="aspect-video bg-muted relative">
                  {item.coverImageUrl ? (
                    <img
                      src={item.coverImageUrl}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm">
                      Sin preview
                    </div>
                  )}
                  {item.isVerifiedByComa && (
                    <span className="absolute top-2 right-2 text-[10px] font-semibold bg-[#FF4B2C] text-white px-1.5 py-0.5 rounded">
                      CoMa
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <p className="font-medium text-sm truncate">{item.title}</p>
                  {item.brandName && (
                    <p className="text-xs text-muted-foreground truncate">{item.brandName}</p>
                  )}
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Reseñas */}
      {creator.reviews.length > 0 && (
        <section className="py-8 border-b border-border">
          <div className="flex items-baseline gap-3 mb-4">
            <h2 className="text-xl font-semibold">Reseñas de marcas</h2>
            {creator.avgRating != null && (
              <span className="text-sm text-muted-foreground">
                ★ {creator.avgRating.toFixed(1)} ({creator._count.reviews} reseñas)
              </span>
            )}
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {creator.reviews.map((r) => (
              <Card key={r.id}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-amber-500 text-sm">{"★".repeat(r.rating)}</div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString("es-CO", {
                        year: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                  {r.feedback && <p className="text-sm text-foreground/80">{r.feedback}</p>}
                  <p className="mt-3 text-xs font-medium">{r.client.name}</p>
                  {r.creatorResponse && (
                    <div className="mt-3 rounded-lg bg-muted p-3 border-l-2 border-[#FF4B2C]">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                        Respuesta de {displayName}
                      </p>
                      <p className="text-xs whitespace-pre-line">{r.creatorResponse}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {creator.user && creator.user.creatorSkills.length > 0 && (
        <section className="py-8 border-b border-border">
          <h2 className="text-xl font-semibold mb-3">Habilidades</h2>
          <div className="flex flex-wrap gap-2">
            {creator.user.creatorSkills.map((cs) => (
              <span
                key={cs.id}
                className="inline-flex items-center gap-2 rounded-full bg-card border border-border px-3 py-1.5 text-sm"
              >
                {cs.skill.name}
                <span className="text-xs text-muted-foreground">{cs.level}/5</span>
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Certificados Academy */}
      {creator.user && creator.user.certificates.length > 0 && (
        <section className="py-8 border-b border-border">
          <h2 className="text-xl font-semibold mb-4">🏅 Certificaciones CoMa Academy</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {creator.user.certificates.map((cert) => (
              <Link
                key={cert.id}
                href={`/academy/${cert.enrollment.course.slug}`}
                className="rounded-xl border border-border bg-gradient-to-br from-[#FF4B2C]/5 to-background p-4 hover:shadow-md transition-all"
              >
                <p className="text-[10px] text-primary font-semibold uppercase mb-1">
                  Certificación
                </p>
                <h3 className="font-medium text-foreground">
                  {cert.enrollment.course.title}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {new Date(cert.issuedAt).toLocaleDateString("es-CO")}
                </p>
                {cert.skillsEarned.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {cert.skillsEarned.map((s) => (
                      <Badge key={s} variant="secondary" className="text-[10px]">
                        {s}
                      </Badge>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Eventos Nation como speaker */}
      {creator.user && creator.user.eventSpeakerships.length > 0 && (
        <section className="py-8 border-b border-border">
          <h2 className="text-xl font-semibold mb-4">⭐ CoMa Nation</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {creator.user.eventSpeakerships.map((sp) => (
              <Link
                key={sp.id}
                href={`/nation/${sp.event.slug}`}
                className="rounded-xl border border-border bg-card p-4 hover:shadow-md transition-all"
              >
                <p className="text-[10px] text-primary font-semibold uppercase mb-1">
                  {sp.role === "HOST"
                    ? "Host"
                    : sp.role === "PANELIST"
                    ? "Panelista"
                    : sp.role === "SPECIAL_GUEST"
                    ? "Invitado especial"
                    : "Speaker"}
                </p>
                <h3 className="font-medium text-foreground">{sp.event.name}</h3>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {new Date(sp.event.startAt).toLocaleDateString("es-CO")}
                  {sp.event.city ? ` · ${sp.event.city}` : ""}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Timeline de logros */}
      {creator.user && creator.user.achievements.length > 0 && (
        <section className="py-8 border-b border-border">
          <h2 className="text-xl font-semibold mb-4">Trayectoria</h2>
          <ol className="relative border-l border-border ml-4 space-y-4">
            {creator.user.achievements.map((a) => (
              <li key={a.id} className="ml-4">
                <div className="absolute -left-[9px] flex size-4 items-center justify-center rounded-full bg-card border border-border text-xs">
                  {a.emoji ?? "•"}
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{a.title}</p>
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(a.issuedAt).toLocaleDateString("es-CO", {
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                {a.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Métricas verificadas (OAuth Graph API) */}
      <CreatorVerifiedMetrics profiles={creator.socialProfiles} />

      {/* Redes */}
      {creator.socialProfiles.length > 0 && (
        <section className="py-8">
          <h2 className="text-xl font-semibold mb-3">Redes</h2>
          <div className="flex flex-wrap gap-3">
            {creator.socialProfiles.map((sp) => (
              <Link
                key={sp.id}
                href={sp.url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted"
              >
                <span className="font-medium">{sp.platform}</span>
                <span className="text-muted-foreground">@{sp.handle}</span>
                {sp.verifiedFollowers && (
                  <span className="text-xs text-muted-foreground">
                    · {sp.verifiedFollowers.toLocaleString("es-CO")} seguidores
                  </span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
