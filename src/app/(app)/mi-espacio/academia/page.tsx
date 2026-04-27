import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { updateCreatorSkill, removeCreatorSkill } from "./actions";

export default async function MiAcademiaPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const enrollments = await prisma.courseEnrollment.findMany({
    where: { userId: session.user.id! },
    orderBy: { startedAt: "desc" },
    include: {
      course: {
        select: { id: true, slug: true, title: true, coverUrl: true, durationMin: true },
      },
      certificate: { select: { id: true, issuedAt: true, skillsEarned: true } },
    },
  });

  const mySkills = await prisma.creatorSkill.findMany({
    where: { userId: session.user.id! },
    include: { skill: true },
    orderBy: { createdAt: "desc" },
  });
  const mySkillIds = new Set(mySkills.map((s) => s.skillId));

  const allSkills = await prisma.skill.findMany({ orderBy: { name: "asc" } });

  const certificates = enrollments.filter((e) => e.certificate).map((e) => e.certificate!);

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-8">
      <div>
        <h1 className="text-2xl text-foreground">Mi academia</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tus cursos, habilidades y certificados de CoMa Academy.
        </p>
      </div>

      {/* Certificados */}
      {certificates.length > 0 && (
        <section>
          <h2 className="font-medium text-foreground mb-3">🏅 Certificados</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {enrollments
              .filter((e) => e.certificate)
              .map((e) => (
                <div
                  key={e.certificate!.id}
                  className="rounded-xl border border-border bg-gradient-to-br from-[#FF4B2C]/5 to-background p-4"
                >
                  <p className="text-xs text-primary font-medium mb-1">Certificado</p>
                  <h3 className="text-sm font-medium text-foreground line-clamp-2">
                    {e.course.title}
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Emitido {e.certificate!.issuedAt.toLocaleDateString("es-CO")}
                  </p>
                  {e.certificate!.skillsEarned.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {e.certificate!.skillsEarned.map((s) => (
                        <Badge key={s} variant="secondary" className="text-[10px]">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Cursos */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium text-foreground">🎓 Mis cursos</h2>
          <Link href="/academy" className="text-xs text-primary hover:underline">
            Explorar catálogo →
          </Link>
        </div>

        {enrollments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
            <p className="text-muted-foreground text-sm mb-4">
              Todavía no estás inscrita en ningún curso.
            </p>
            <Link href="/academy">
              <Button>Ver catálogo</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {enrollments.map((e) => (
              <Link
                key={e.id}
                href={`/mi-espacio/academia/${e.id}`}
                className="group rounded-xl border border-border bg-card p-4 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="font-medium text-foreground line-clamp-1 group-hover:text-primary">
                    {e.course.title}
                  </h3>
                  <Badge className="text-[10px]">
                    {e.status === "COMPLETED"
                      ? "Completado"
                      : e.status === "IN_PROGRESS"
                      ? "En curso"
                      : e.status === "ENROLLED"
                      ? "Inscrita"
                      : "Abandonado"}
                  </Badge>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden mb-2">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${e.progressPct}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{e.progressPct}% completado</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Skills */}
      <section>
        <h2 className="font-medium text-foreground mb-3">⚡ Mis habilidades</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Las que marques acá aparecen en tu perfil público y en filtros de discovery. Se auto-agregan
          al completar cursos.
        </p>

        {mySkills.length > 0 && (
          <div className="space-y-2 mb-4">
            {mySkills.map((cs) => {
              const remove = removeCreatorSkill.bind(null, cs.skillId);
              return (
                <div
                  key={cs.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-foreground">{cs.skill.name}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      Nivel {cs.level}/5
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((lvl) => {
                      const set = updateCreatorSkill.bind(null, cs.skillId, lvl);
                      return (
                        <form key={lvl} action={set}>
                          <button
                            type="submit"
                            className={`size-6 rounded-full text-[10px] ${
                              cs.level >= lvl
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                          >
                            {lvl}
                          </button>
                        </form>
                      );
                    })}
                    <form action={remove}>
                      <Button type="submit" size="xs" variant="ghost">
                        ×
                      </Button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div>
          <p className="text-xs text-muted-foreground mb-2">Agregar habilidad:</p>
          <div className="flex flex-wrap gap-2">
            {allSkills
              .filter((s) => !mySkillIds.has(s.id))
              .map((skill) => {
                const add = updateCreatorSkill.bind(null, skill.id, 1);
                return (
                  <form key={skill.id} action={add}>
                    <button
                      type="submit"
                      className="text-xs px-3 py-1.5 rounded-full border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-solid"
                    >
                      + {skill.name}
                    </button>
                  </form>
                );
              })}
          </div>
        </div>
      </section>
    </div>
  );
}
