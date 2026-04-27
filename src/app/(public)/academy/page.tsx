import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { CrossNav } from "@/components/cross-nav";
import { CreativeBg } from "@/components/creative-bg";
import { FloatingAvatars } from "@/components/creator-avatars";

export const metadata: Metadata = {
  title: "CoMa Academy — cursos para creadoras",
  description:
    "Aprende UGC, estrategia, producción y edición con CoMa Academy. Cursos prácticos con certificación que suma en tu perfil profesional.",
};

const levelLabels: Record<string, string> = {
  BEGINNER: "Principiante",
  INTERMEDIATE: "Intermedio",
  ADVANCED: "Avanzado",
};

export default async function AcademyCatalogPage() {
  const courses = await prisma.course.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    include: {
      skills: { include: { skill: true } },
      _count: { select: { enrollments: true, modules: true } },
    },
  });

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-grain">
        <CreativeBg variant="lime" />
        <FloatingAvatars variant="duo" />
        <div className="mx-auto max-w-6xl px-6 py-16 relative">
          <p className="text-xs uppercase tracking-[0.2em] text-[#FF4B2C] font-semibold mb-3">
            CoMa Academy · Formación con resultados
          </p>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight max-w-4xl">
            Tu creatividad también se <span className="text-[#FF4B2C]">entrena</span>.
          </h1>
          <p className="mt-5 text-lg md:text-xl text-muted-foreground max-w-3xl leading-relaxed">
            Academy es el gimnasio de creadores del ecosistema CoMa. 6 cursos certificados con
            masters reales, talleres prácticos y una IA 24/7 entrenada con tu perfil que te
            acompaña por WhatsApp. Formación que se traduce en campañas.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <span className="rounded-full bg-background border border-border px-4 py-1.5">🎓 Certificación oficial Sec. Educación de Cali</span>
            <span className="rounded-full bg-background border border-border px-4 py-1.5">🤖 Tutor IA 24/7 por WhatsApp</span>
            <span className="rounded-full bg-background border border-border px-4 py-1.5">💰 Monetización desde el primer mes</span>
          </div>
        </div>
      </section>

      {/* Por qué importa — para cada rol */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-[0.2em] text-[#FF4B2C] font-semibold mb-2">Por qué importa</p>
            <h2 className="text-3xl md:text-4xl font-bold max-w-3xl mx-auto leading-tight">
              La creator economy la hacen los creadores. Pero nadie les enseñó a serlo.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="h-10 w-10 rounded-lg bg-[#F4D79D]/50 flex items-center justify-center text-lg mb-3">📚</div>
              <h3 className="font-bold mb-2">Para creadores</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Dejá de aprender a base de prueba y error. Aprende storytelling, IA, redes,
                marketing, edición y finanzas — todo pensado para quien ya crea.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="h-10 w-10 rounded-lg bg-[#B0E4EA]/50 flex items-center justify-center text-lg mb-3">💼</div>
              <h3 className="font-bold mb-2">Para marcas</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Las certificaciones Academy son filtro en Connect. Cuando contratás un creador
                certificado, sabés que entendió el brief, las métricas y el sistema.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="h-10 w-10 rounded-lg bg-[#D6E889]/50 flex items-center justify-center text-lg mb-3">🌎</div>
              <h3 className="font-bold mb-2">Para la industria</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Profesionalizamos la creator economy LATAM con formación seria, certificación
                oficial y un estándar común de calidad. Subimos el techo para todos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Los 6 cursos - mapa narrativo */}
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="mb-10">
            <p className="text-xs uppercase tracking-[0.2em] text-[#FF4B2C] font-semibold mb-2">El programa</p>
            <h2 className="text-3xl md:text-4xl font-bold max-w-3xl leading-tight mb-3">
              6 cursos, 6 meses, una certificación que pesa.
            </h2>
            <p className="text-muted-foreground max-w-2xl">
              Un camino diseñado con las creadoras que ya viven de esto. Cada curso es 1 mes · 20 cápsulas · 2 talleres creativos.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              { n: "01", t: "Storytelling, narrativa y responsabilidad social", c: "Brand Storyteller", m: "Isa Contreras" },
              { n: "02", t: "Gestión de redes sociales", c: "Gestión en redes sociales", m: "Eli Hernandez" },
              { n: "03", t: "Estrategia de marketing digital", c: "Estratega en marketing digital", m: "Manu Martinez" },
              { n: "04", t: "IA para creadores de contenido", c: "IA en creación de contenido", m: "Edward Smith" },
              { n: "05", t: "Edición, producción y postproducción", c: "Producción y Edición Audiovisual", m: "Invitado especial" },
              { n: "06", t: "Finanzas para creadores y gestión de marcas", c: "Finanzas en creación de contenido", m: "Team CoMa" },
            ].map((course) => (
              <div key={course.n} className="rounded-xl bg-background border border-border p-5 flex gap-4">
                <span className="text-2xl font-bold text-[#FF4B2C] tabular-nums shrink-0">{course.n}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground leading-tight">{course.t}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Certificación: <span className="font-medium text-foreground">{course.c}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">Master: {course.m}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-muted-foreground mt-8 italic">
            Al completar los 6 cursos, obtenés la <strong className="text-foreground not-italic">certificación oficial UGC</strong> con resolución de la Secretaría de Educación de Cali.
          </p>
        </div>
      </section>

      {/* Gamificación - CoMaCoins y niveles */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="grid md:grid-cols-[1fr_1fr] gap-10 items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#FF4B2C] font-semibold mb-3">Cómo recompensamos tu avance</p>
              <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
                Aprender, en CoMa, se paga.
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-5">
                Cada cápsula completada, cada taller asistido, cada microcertificación suma <strong className="text-foreground">XP</strong> y <strong className="text-[#FF4B2C]">CoMaCoins</strong>, la moneda interna del ecosistema. Con CoMaCoins desbloqueás premios, bonos, items visuales de tu avatar y beneficios reales con marcas aliadas.
              </p>
              <Link
                href="/metodo"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#FF4B2C] hover:underline"
              >
                Conocer el sistema completo de gamificación →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="text-3xl">🪙</p>
                <p className="font-bold mt-2">CoMaCoins</p>
                <p className="text-xs text-muted-foreground mt-1">Moneda interna. Se gana, se canjea.</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="text-3xl">⚡</p>
                <p className="font-bold mt-2">XP y niveles</p>
                <p className="text-xs text-muted-foreground mt-1">Rookie → Legend. Tu carrera, visible.</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="text-3xl">🎖️</p>
                <p className="font-bold mt-2">Microcertificados</p>
                <p className="text-xs text-muted-foreground mt-1">Cada curso, un badge en tu perfil Connect.</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="text-3xl">🎁</p>
                <p className="font-bold mt-2">Recompensas reales</p>
                <p className="text-xs text-muted-foreground mt-1">Premios, bonos y acceso VIP a eventos Nation.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Inspiración / referencias */}
      <section className="border-b border-border bg-gradient-to-b from-muted/20 to-background">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <p className="text-xs uppercase tracking-[0.2em] text-[#FF4B2C] font-semibold mb-2 text-center">Lo que crean los que salen</p>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 max-w-3xl mx-auto leading-tight">
            Estructura sin matar la creatividad.
          </h2>
          <div className="grid md:grid-cols-3 gap-5">
            <blockquote className="rounded-2xl border border-border bg-card p-6">
              <p className="text-sm leading-relaxed text-foreground italic">
                "No necesito más likes. Necesito estructura. Academy me dio un sistema para pensar cada pieza antes de grabarla."
              </p>
              <p className="text-xs text-muted-foreground mt-3">— Egresada del programa</p>
            </blockquote>
            <blockquote className="rounded-2xl border border-border bg-card p-6">
              <p className="text-sm leading-relaxed text-foreground italic">
                "El tutor IA por WhatsApp me saca dudas a las 11 de la noche cuando estoy editando. Es como tener un coach siempre disponible."
              </p>
              <p className="text-xs text-muted-foreground mt-3">— Estudiante activa</p>
            </blockquote>
            <blockquote className="rounded-2xl border border-border bg-card p-6">
              <p className="text-sm leading-relaxed text-foreground italic">
                "Cuando pusieron mi microcertificado en mi perfil de Connect, empezaron a llegarme campañas que antes ni veía."
              </p>
              <p className="text-xs text-muted-foreground mt-3">— Creadora certificada</p>
            </blockquote>
          </div>
          <p className="text-[11px] text-muted-foreground text-center mt-6 italic">
            * Testimoniales representativos basados en el programa actual. Pendiente recolección y autorización de testimonios reales.
          </p>
        </div>
      </section>

      {/* Catálogo - listing existente */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-2">Catálogo abierto</p>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight">Empezá cuando quieras.</h2>
            <p className="text-muted-foreground mt-2">
              Si sos afiliado Comfandi A/B/C seleccionado: 100% subsidiado. Si no: accedé con precios de lanzamiento.
            </p>
          </div>

      {courses.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          Pronto vamos a abrir el catálogo. ¡Quedate atenta!
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/academy/${course.slug}`}
              className="group rounded-2xl border border-border bg-card overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              {course.coverUrl ? (
                <div
                  className="aspect-video bg-muted bg-cover bg-center"
                  style={{ backgroundImage: `url(${course.coverUrl})` }}
                />
              ) : (
                <div className="aspect-video bg-gradient-to-br from-primary/20 via-[#F4D79D]/30 to-[#B0E4EA]/30 flex items-center justify-center">
                  <span className="text-4xl">🎓</span>
                </div>
              )}

              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-[10px]">
                    {levelLabels[course.level]}
                  </Badge>
                  {course.durationMin && (
                    <span className="text-[11px] text-muted-foreground">
                      {course.durationMin} min
                    </span>
                  )}
                </div>

                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
                  {course.title}
                </h3>

                {course.summary && (
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                    {course.summary}
                  </p>
                )}

                {course.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {course.skills.slice(0, 3).map((cs) => (
                      <Badge key={cs.id} variant="outline" className="text-[10px]">
                        {cs.skill.name}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="text-xs text-muted-foreground pt-3 border-t border-border">
                  {course._count.modules} módulos · {course._count.enrollments} inscritas
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
        </div>
      </section>
      <CrossNav current="academy" />
    </div>
  );
}
