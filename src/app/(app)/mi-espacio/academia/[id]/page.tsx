import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { markLessonDone } from "../actions";

export default async function EnrollmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const enrollment = await prisma.courseEnrollment.findUnique({
    where: { id },
    include: {
      course: {
        include: {
          modules: {
            orderBy: { order: "asc" },
            include: { lessons: { orderBy: { order: "asc" } } },
          },
        },
      },
      lessonProgress: { select: { lessonId: true } },
      certificate: true,
    },
  });
  if (!enrollment || enrollment.userId !== session.user.id) notFound();

  const completedLessonIds = new Set(enrollment.lessonProgress.map((p) => p.lessonId));

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <div>
        <Link
          href="/mi-espacio/academia"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ← Mi academia
        </Link>
        <h1 className="text-2xl text-foreground mt-2">{enrollment.course.title}</h1>
        {enrollment.course.summary && (
          <p className="text-sm text-muted-foreground mt-1">{enrollment.course.summary}</p>
        )}

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>
              {enrollment.progressPct}% completado · {enrollment.status === "COMPLETED" ? "🎉 curso completo" : "continúa"}
            </span>
            {enrollment.certificate && (
              <Badge variant="secondary" className="text-[10px]">
                🏅 Certificado emitido
              </Badge>
            )}
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${enrollment.progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {enrollment.course.modules.map((mod) => (
        <div key={mod.id} className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-medium text-foreground">{mod.title}</h2>
          {mod.summary && <p className="text-xs text-muted-foreground mt-0.5">{mod.summary}</p>}

          <ul className="mt-3 space-y-2">
            {mod.lessons.map((lesson) => {
              const done = completedLessonIds.has(lesson.id);
              const mark = markLessonDone.bind(null, enrollment.id, lesson.id);
              return (
                <li
                  key={lesson.id}
                  className={`rounded-lg border border-border p-3 ${
                    done ? "bg-primary/5 border-primary/20" : "bg-background"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {done && <span className="text-primary">✓</span>}
                        <h3 className="text-sm font-medium text-foreground truncate">
                          {lesson.title}
                        </h3>
                      </div>
                      {lesson.durationMin && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {lesson.durationMin} min
                        </p>
                      )}
                    </div>
                    {!done && (
                      <form action={mark}>
                        <Button type="submit" size="xs" variant="secondary">
                          Marcar completada
                        </Button>
                      </form>
                    )}
                  </div>

                  {lesson.videoUrl && (
                    <a
                      href={lesson.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block text-xs text-primary hover:underline mt-2"
                    >
                      ▶ Ver video
                    </a>
                  )}
                  {lesson.bodyMd && (
                    <p className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap">
                      {lesson.bodyMd}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
