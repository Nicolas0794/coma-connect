import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { updateCourse, addModule, addLesson, toggleCourseSkill } from "../actions";

export default async function CursoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "TEAM")) {
    redirect("/");
  }

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: { lessons: { orderBy: { order: "asc" } } },
      },
      skills: { include: { skill: true } },
      _count: { select: { enrollments: true } },
    },
  });
  if (!course) notFound();

  const allSkills = await prisma.skill.findMany({ orderBy: { name: "asc" } });
  const courseSkillIds = new Set(course.skills.map((cs) => cs.skillId));

  const updateAction = updateCourse.bind(null, course.id);
  const addModuleAction = addModule.bind(null, course.id);

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-6">
      <div>
        <Link href="/academia" className="text-xs text-muted-foreground hover:text-foreground">
          ← Academy
        </Link>
        <div className="flex items-center gap-3 mt-2">
          <h1 className="text-2xl text-foreground">{course.title}</h1>
          <Badge className="text-[10px]">
            {course.status === "DRAFT"
              ? "Borrador"
              : course.status === "PUBLISHED"
              ? "Publicado"
              : "Archivado"}
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
          <span>/{course.slug}</span>
          <span>·</span>
          <span>{course._count.enrollments} inscritos</span>
          <span>·</span>
          <Link
            href={`/academy/${course.slug}`}
            target="_blank"
            className="text-primary hover:underline"
          >
            Ver página pública
          </Link>
        </div>
      </div>

      {/* Datos del curso */}
      <form action={updateAction} className="space-y-4 rounded-xl border border-border bg-card p-6">
        <h2 className="font-medium text-foreground">Datos generales</h2>

        <div className="space-y-2">
          <Label htmlFor="title">Título</Label>
          <Input id="title" name="title" defaultValue={course.title} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="summary">Resumen</Label>
          <Input id="summary" name="summary" defaultValue={course.summary ?? ""} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descripción</Label>
          <textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={course.description ?? ""}
            className="w-full rounded-md border border-border bg-background p-3 text-sm"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="level">Nivel</Label>
            <select
              id="level"
              name="level"
              defaultValue={course.level}
              className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
            >
              <option value="BEGINNER">Principiante</option>
              <option value="INTERMEDIATE">Intermedio</option>
              <option value="ADVANCED">Avanzado</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Estado</Label>
            <select
              id="status"
              name="status"
              defaultValue={course.status}
              className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
            >
              <option value="DRAFT">Borrador</option>
              <option value="PUBLISHED">Publicado</option>
              <option value="ARCHIVED">Archivado</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="durationMin">Duración (min)</Label>
            <Input
              id="durationMin"
              name="durationMin"
              type="number"
              defaultValue={course.durationMin ?? ""}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit">Guardar</Button>
        </div>
      </form>

      {/* Skills */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-medium text-foreground mb-3">Skills que otorga este curso</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Al completar el curso, las creadoras ganan estas skills automáticamente.
        </p>
        <div className="flex flex-wrap gap-2">
          {allSkills.map((skill) => {
            const active = courseSkillIds.has(skill.id);
            const toggle = toggleCourseSkill.bind(null, course.id, skill.id);
            return (
              <form key={skill.id} action={toggle}>
                <button
                  type="submit"
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:text-foreground"
                  }`}
                >
                  {skill.name}
                </button>
              </form>
            );
          })}
        </div>
      </div>

      {/* Módulos y lecciones */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-medium text-foreground mb-4">Contenido del curso</h2>

        {course.modules.length > 0 && (
          <div className="space-y-4 mb-6">
            {course.modules.map((mod) => (
              <ModuleBlock
                key={mod.id}
                modId={mod.id}
                title={mod.title}
                summary={mod.summary}
                lessons={mod.lessons}
              />
            ))}
          </div>
        )}

        <form action={addModuleAction} className="space-y-3 rounded-lg border border-dashed border-border p-4">
          <h3 className="text-sm font-medium">Agregar módulo</h3>
          <Input name="title" placeholder="Título del módulo" required />
          <Input name="summary" placeholder="Descripción (opcional)" />
          <Button type="submit" size="sm">
            Agregar módulo
          </Button>
        </form>
      </div>
    </div>
  );
}

function ModuleBlock({
  modId,
  title,
  summary,
  lessons,
}: {
  modId: string;
  title: string;
  summary: string | null;
  lessons: Array<{ id: string; title: string; durationMin: number | null; videoUrl: string | null }>;
}) {
  const addLessonAction = addLesson.bind(null, modId);

  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <h3 className="font-medium text-foreground">{title}</h3>
      {summary && <p className="text-xs text-muted-foreground mt-0.5">{summary}</p>}

      {lessons.length > 0 && (
        <ul className="mt-3 space-y-1">
          {lessons.map((lesson) => (
            <li
              key={lesson.id}
              className="flex items-center justify-between text-sm text-foreground py-1.5 px-3 rounded-md bg-card"
            >
              <span className="truncate">{lesson.title}</span>
              <span className="text-xs text-muted-foreground shrink-0 ml-3">
                {lesson.videoUrl ? "▶ video" : "—"}
                {lesson.durationMin ? ` · ${lesson.durationMin} min` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}

      <form action={addLessonAction} className="mt-3 space-y-2">
        <Input name="title" placeholder="Título de la lección" required className="text-sm" />
        <div className="grid grid-cols-2 gap-2">
          <Input name="videoUrl" placeholder="URL de video (Drive)" className="text-sm" />
          <Input name="durationMin" type="number" placeholder="min" className="text-sm" />
        </div>
        <textarea
          name="bodyMd"
          placeholder="Contenido (opcional, markdown)"
          rows={2}
          className="w-full rounded-md border border-border bg-background p-2 text-sm"
        />
        <Button type="submit" size="sm" variant="secondary">
          Agregar lección
        </Button>
      </form>
    </div>
  );
}
