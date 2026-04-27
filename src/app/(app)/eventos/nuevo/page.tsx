import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createEvent } from "../actions";

export default async function NuevoEventoPage() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "TEAM")) {
    redirect("/");
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <Link href="/eventos" className="text-xs text-muted-foreground hover:text-foreground">
          ← Nation · Eventos
        </Link>
        <h1 className="text-2xl text-foreground mt-2">Nuevo evento</h1>
      </div>

      <form action={createEvent} className="space-y-4 rounded-xl border border-border bg-card p-6">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre</Label>
          <Input id="name" name="name" required placeholder="CoMa Meetup Cali — Mayo" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descripción</Label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className="w-full rounded-md border border-border bg-background p-3 text-sm"
            placeholder="Qué va a pasar, a quién está dirigido…"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <select
              id="type"
              name="type"
              defaultValue="MEETUP"
              className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
            >
              <option value="MEETUP">Meetup</option>
              <option value="WORKSHOP">Workshop</option>
              <option value="PANEL">Panel</option>
              <option value="PARTY">Fiesta</option>
              <option value="CONFERENCE">Conferencia</option>
              <option value="WEBINAR">Webinar</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="capacity">Capacidad</Label>
            <Input id="capacity" name="capacity" type="number" min={0} placeholder="50" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">Ciudad</Label>
            <Input id="city" name="city" placeholder="Cali" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="venue">Lugar</Label>
            <Input id="venue" name="venue" placeholder="Usaquén Coworking" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startAt">Inicio</Label>
            <Input id="startAt" name="startAt" type="datetime-local" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endAt">Fin (opcional)</Label>
            <Input id="endAt" name="endAt" type="datetime-local" />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Link href="/eventos">
            <Button type="button" variant="ghost">
              Cancelar
            </Button>
          </Link>
          <Button type="submit">Crear evento</Button>
        </div>
      </form>
    </div>
  );
}
