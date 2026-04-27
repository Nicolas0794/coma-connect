import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function AcademiaAdminPage() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "TEAM")) {
    redirect("/");
  }

  const courses = await prisma.course.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { enrollments: true, modules: true } },
      skills: { include: { skill: true } },
    },
  });

  const statusStyles: Record<string, string> = {
    DRAFT: "bg-secondary text-muted-foreground",
    PUBLISHED: "bg-primary/10 text-primary",
    ARCHIVED: "bg-muted text-muted-foreground",
  };
  const statusLabels: Record<string, string> = {
    DRAFT: "Borrador",
    PUBLISHED: "Publicado",
    ARCHIVED: "Archivado",
  };

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl text-foreground">Academy</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {courses.length === 0
              ? "Todavía no hay cursos cargados."
              : `${courses.length} curso${courses.length > 1 ? "s" : ""}`}
          </p>
        </div>
        <Link href="/academia/nuevo">
          <Button>Nuevo curso</Button>
        </Link>
      </div>

      {courses.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/academia/${course.id}`}
              className="group rounded-xl border border-border bg-card p-5 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                  {course.title}
                </h3>
                <Badge className={`text-[10px] ${statusStyles[course.status]}`}>
                  {statusLabels[course.status]}
                </Badge>
              </div>

              {course.summary && (
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{course.summary}</p>
              )}

              <div className="flex flex-wrap gap-1 mb-3">
                {course.skills.slice(0, 3).map((cs) => (
                  <Badge key={cs.id} variant="secondary" className="text-[10px]">
                    {cs.skill.name}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground border-t border-border pt-3">
                <span>{course._count.modules} módulos</span>
                <span>·</span>
                <span>{course._count.enrollments} inscritos</span>
                {course.durationMin && (
                  <>
                    <span>·</span>
                    <span>{course.durationMin} min</span>
                  </>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-muted-foreground mb-4">
            Creá el primer curso para armar tu Academy.
          </p>
          <Link href="/academia/nuevo">
            <Button>Crear primer curso</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
