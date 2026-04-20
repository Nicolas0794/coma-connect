import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { CrossNav } from "@/components/cross-nav";
import { CreativeBg } from "@/components/creative-bg";

export const metadata: Metadata = {
  title: "CoMa Nation — eventos, meetups y workshops para creadoras",
  description:
    "Conectá con otras creadoras en meetups, workshops y paneles organizados por CoMa en distintas ciudades de LATAM.",
};

const typeLabels: Record<string, string> = {
  MEETUP: "Meetup",
  WORKSHOP: "Workshop",
  PANEL: "Panel",
  PARTY: "Fiesta",
  CONFERENCE: "Conferencia",
  WEBINAR: "Webinar",
};

export default async function NationCalendarPage() {
  const now = new Date();
  const events = await prisma.event.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { startAt: "asc" },
    include: {
      _count: { select: { registrations: true, speakers: true } },
      tags: true,
    },
  });

  const upcoming = events.filter((e) => e.startAt >= now);
  const past = events.filter((e) => e.startAt < now);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-grain">
        <CreativeBg variant="cool" />
        <div className="mx-auto max-w-6xl px-6 py-16 relative">
          <p className="text-xs uppercase tracking-[0.2em] text-[#FF4B2C] font-semibold mb-3">
            CoMa Nation · Comunidad en movimiento
          </p>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight max-w-4xl">
            La <span className="text-[#FF4B2C]">comunidad</span> se encuentra. Y se ve.
          </h1>
          <p className="mt-5 text-lg md:text-xl text-muted-foreground max-w-3xl leading-relaxed">
            Nation es el latido del ecosistema: meetups, workshops, paneles con marcas y un gran
            evento anual exclusivo. Donde los creadores se conocen, se miden con otros, y
            convierten seguidores en comunidad real.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <span className="rounded-full bg-background border border-border px-4 py-1.5">🎤 Speakers + creadores + marcas</span>
            <span className="rounded-full bg-background border border-border px-4 py-1.5">📍 Ciudades LATAM</span>
            <span className="rounded-full bg-background border border-border px-4 py-1.5">🏆 Badges de asistencia y participación</span>
          </div>
        </div>
      </section>

      {/* Por qué importa */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-[0.2em] text-[#FF4B2C] font-semibold mb-2">Por qué importa</p>
            <h2 className="text-3xl md:text-4xl font-bold max-w-3xl mx-auto leading-tight">
              Los algoritmos conectan cuentas. La comunidad conecta personas.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="h-10 w-10 rounded-lg bg-[#B0E4EA]/50 flex items-center justify-center text-lg mb-3">🎨</div>
              <h3 className="font-bold mb-2">Para creadores</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Salís de la pantalla. Aprendés de otros, cocreás, ensayás tus ideas frente a
                público real. Tu red deja de ser gente que te ve y se vuelve gente que te hace crecer.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="h-10 w-10 rounded-lg bg-[#FF4B2C]/10 flex items-center justify-center text-lg mb-3">💼</div>
              <h3 className="font-bold mb-2">Para marcas</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Presencia real en el lugar donde la audiencia decide a quién seguir. Activaciones,
                paneles y patrocinios con creadores que ya son parte del ecosistema CoMa.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="h-10 w-10 rounded-lg bg-[#D6E889]/50 flex items-center justify-center text-lg mb-3">🌱</div>
              <h3 className="font-bold mb-2">Para la escena</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Profesionalizamos la creator economy LATAM construyendo lugares físicos donde
                ocurra. La comunidad no se decreta — se organiza.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tipos de eventos */}
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="mb-10">
            <p className="text-xs uppercase tracking-[0.2em] text-[#FF4B2C] font-semibold mb-2">Qué hacemos</p>
            <h2 className="text-3xl md:text-4xl font-bold max-w-3xl leading-tight">
              Distintos formatos. Una sola comunidad.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { emoji: "☕", title: "Meetups", desc: "Encuentros informales mensuales por ciudad. Café, networking real, cocreaciones." },
              { emoji: "🛠️", title: "Workshops", desc: "Talleres prácticos con especialistas y masters Academy. Te vas con algo hecho." },
              { emoji: "🎙️", title: "Paneles", desc: "Conversatorios con marcas y creadoras reconocidas sobre lo que está pasando hoy." },
              { emoji: "🚀", title: "Activaciones", desc: "Marcas patrocinan experiencias donde el contenido se genera en vivo." },
              { emoji: "🎉", title: "Fiestas", desc: "Porque la comunidad también se celebra. Lanzamientos, aniversarios, premios." },
              { emoji: "🏆", title: "Evento anual", desc: "El gran encuentro CoMa: awards, conferencias, creator showcase. Invitación exclusiva." },
            ].map((ev) => (
              <div key={ev.title} className="rounded-2xl bg-background border border-border p-5">
                <p className="text-2xl mb-2">{ev.emoji}</p>
                <p className="font-bold mb-1">{ev.title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{ev.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gamificación Nation — embajadores + badges */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="grid md:grid-cols-[1fr_1fr] gap-10 items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#FF4B2C] font-semibold mb-3">Comunidad con sistema</p>
              <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
                Asistir no es lo mismo que pertenecer.
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-5">
                Cada evento Nation suma huella en tu perfil. Asistencia, participación, speakership
                y cocreaciones construyen tu camino de <strong className="text-foreground">embajador CoMa</strong>:
                nuevo → frecuente → top performer → embajador.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-5">
                Los embajadores acceden a beneficios exclusivos: invitaciones VIP, speakership
                pagado, colaboraciones con marcas premium y visibilidad destacada en Connect.
              </p>
              <Link
                href="/metodo"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#FF4B2C] hover:underline"
              >
                Ver el camino completo de embajador →
              </Link>
            </div>
            <div className="space-y-3">
              {[
                { lvl: "Nuevo", desc: "Asististe a tu primer evento. Bienvenida a Nation.", color: "bg-[#F4D79D]/50" },
                { lvl: "Frecuente", desc: "3+ eventos en 6 meses. La comunidad te reconoce.", color: "bg-[#B0E4EA]/60" },
                { lvl: "Top performer", desc: "Participación activa: cocreaciones, paneles, mentorías.", color: "bg-[#D6E889]/60" },
                { lvl: "Embajador", desc: "Representás CoMa. Acceso VIP, campañas premium, speakership pagado.", color: "bg-[#FF4B2C] text-background" },
              ].map((t) => (
                <div key={t.lvl} className={`rounded-xl p-5 ${t.color}`}>
                  <p className="font-bold">{t.lvl}</p>
                  <p className="text-sm mt-1 opacity-90">{t.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Listing header */}
      <section>
        <div className="mx-auto max-w-6xl px-6 pt-14">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-2">Agenda</p>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight">Nos vemos en el próximo encuentro.</h2>
            <p className="text-muted-foreground mt-2">Meetups, workshops, paneles y el evento anual. Todos los encuentros Nation.</p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 pb-14">

      <section className="mb-12">
        <h2 className="text-lg font-semibold text-foreground mb-4">Próximos eventos</h2>
        {upcoming.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
            No hay eventos próximos publicados. Pronto habrá más.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((event) => (
              <Link
                key={event.id}
                href={`/nation/${event.slug}`}
                className="group rounded-2xl border border-border bg-card overflow-hidden hover:shadow-xl transition-all"
              >
                {event.coverUrl ? (
                  <div
                    className="aspect-video bg-cover bg-center"
                    style={{ backgroundImage: `url(${event.coverUrl})` }}
                  />
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-primary/20 via-[#F4D79D]/30 to-[#B0E4EA]/30 flex items-center justify-center">
                    <span className="text-4xl">🎤</span>
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {typeLabels[event.type]}
                    </Badge>
                    {event.city && (
                      <span className="text-[11px] text-muted-foreground">📍 {event.city}</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
                    {event.name}
                  </h3>
                  <p className="text-sm text-foreground mb-2">
                    {event.startAt.toLocaleDateString("es-CO", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <div className="text-xs text-muted-foreground pt-3 border-t border-border">
                    {event._count.registrations} registradas
                    {event.capacity ? ` · ${event.capacity} plazas` : ""}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">Ediciones anteriores</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {past.map((event) => (
              <Link
                key={event.id}
                href={`/nation/${event.slug}`}
                className="rounded-xl border border-border bg-card p-4 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-[10px]">
                    {typeLabels[event.type]}
                  </Badge>
                </div>
                <h3 className="font-medium text-foreground line-clamp-1">{event.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {event.startAt.toLocaleDateString("es-CO")}
                  {event.city ? ` · ${event.city}` : ""}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
      </div>
      <CrossNav current="nation" />
    </div>
  );
}
