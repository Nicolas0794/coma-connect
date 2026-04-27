import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { enrollInCourse } from "@/app/(app)/mi-espacio/academia/actions";

const levelLabels: Record<string, string> = {
  BEGINNER: "Principiante",
  INTERMEDIATE: "Intermedio",
  ADVANCED: "Avanzado",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = await prisma.course.findUnique({
    where: { slug },
    select: { title: true, summary: true, coverUrl: true, status: true },
  });
  if (!course || course.status !== "PUBLISHED") {
    return { title: "Curso no encontrado" };
  }
  return {
    title: `${course.title} — CoMa Academy`,
    description: course.summary ?? undefined,
    openGraph: course.coverUrl ? { images: [course.coverUrl] } : undefined,
  };
}

export default async function CoursePublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();

  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: { orderBy: { order: "asc" }, select: { id: true, title: true, durationMin: true } },
        },
      },
      skills: { include: { skill: true } },
      _count: { select: { enrollments: true } },
    },
  });
  if (!course || course.status !== "PUBLISHED") notFound();

  const existingEnrollment = session?.user?.id
    ? await prisma.courseEnrollment.findUnique({
        where: { userId_courseId: { userId: session.user.id, courseId: course.id } },
      })
    : null;

  const enroll = enrollInCourse.bind(null, course.id);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <Link
        href="/academy"
        className="text-xs text-muted-foreground hover:text-foreground inline-block mb-6"
      >
        ← Catálogo
      </Link>

      <div className="grid md:grid-cols-[1fr_300px] gap-8 mb-10">
        <div>
          <Badge variant="secondary" className="mb-3">
            {levelLabels[course.level]}
          </Badge>
          <h1 className="text-3xl font-bold text-foreground mb-3">{course.title}</h1>
          {course.summary && <p className="text-muted-foreground mb-4">{course.summary}</p>}
          {course.description && (
            <p className="text-sm text-foreground whitespace-pre-wrap">{course.description}</p>
          )}
        </div>

        <aside className="rounded-2xl border border-border bg-card p-5 h-fit">
          {course.coverUrl && (
            <div
              className="aspect-video bg-muted bg-cover bg-center rounded-lg mb-4"
              style={{ backgroundImage: `url(${course.coverUrl})` }}
            />
          )}
          <dl className="space-y-2 text-sm mb-5">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Duración</dt>
              <dd className="text-foreground">
                {course.durationMin ? `${course.durationMin} min` : "Flexible"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Módulos</dt>
              <dd className="text-foreground">{course.modules.length}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Inscritas</dt>
              <dd className="text-foreground">{course._count.enrollments}</dd>
            </div>
          </dl>

          {existingEnrollment ? (
            <Link href={`/mi-espacio/academia/${existingEnrollment.id}`}>
              <Button className="w-full">Continuar curso</Button>
            </Link>
          ) : session?.user ? (
            <form action={enroll}>
              <Button type="submit" className="w-full">
                Inscribirme
              </Button>
            </form>
          ) : (
            <Link href="/login">
              <Button className="w-full">Iniciá sesión para inscribirte</Button>
            </Link>
          )}
        </aside>
      </div>

      {course.skills.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-3">Skills que desbloquea</h2>
          <div className="flex flex-wrap gap-2">
            {course.skills.map((cs) => (
              <Badge key={cs.id} variant="outline">
                {cs.skill.name}
              </Badge>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">Contenido</h2>
        <div className="space-y-3">
          {course.modules.map((mod, i) => (
            <div key={mod.id} className="rounded-xl border border-border bg-card p-5">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">
                Módulo {i + 1}
              </p>
              <h3 className="font-medium text-foreground">{mod.title}</h3>
              {mod.summary && (
                <p className="text-sm text-muted-foreground mt-1">{mod.summary}</p>
              )}
              <ul className="mt-3 text-sm text-foreground space-y-1">
                {mod.lessons.map((lesson) => (
                  <li key={lesson.id} className="flex items-center justify-between py-1">
                    <span>· {lesson.title}</span>
                    {lesson.durationMin && (
                      <span className="text-xs text-muted-foreground">{lesson.durationMin} min</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
