import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCourse } from "../actions";

export default async function NuevoCursoPage() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "TEAM")) {
    redirect("/");
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <Link href="/academia" className="text-xs text-muted-foreground hover:text-foreground">
          ← Academy
        </Link>
        <h1 className="text-2xl text-foreground mt-2">Nuevo curso</h1>
      </div>

      <form action={createCourse} className="space-y-4 rounded-xl border border-border bg-card p-6">
        <div className="space-y-2">
          <Label htmlFor="title">Título</Label>
          <Input id="title" name="title" required placeholder="Reels que convierten" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="summary">Resumen</Label>
          <Input
            id="summary"
            name="summary"
            placeholder="Aprende a crear reels de marca que generan resultados."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descripción larga</Label>
          <textarea
            id="description"
            name="description"
            rows={5}
            className="w-full rounded-md border border-border bg-background p-3 text-sm"
            placeholder="Detalle del curso, módulos, objetivos…"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="level">Nivel</Label>
            <select
              id="level"
              name="level"
              className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
              defaultValue="BEGINNER"
            >
              <option value="BEGINNER">Principiante</option>
              <option value="INTERMEDIATE">Intermedio</option>
              <option value="ADVANCED">Avanzado</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="durationMin">Duración (min)</Label>
            <Input id="durationMin" name="durationMin" type="number" min={0} placeholder="180" />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Link href="/academia">
            <Button type="button" variant="ghost">
              Cancelar
            </Button>
          </Link>
          <Button type="submit">Crear curso</Button>
        </div>
      </form>
    </div>
  );
}
