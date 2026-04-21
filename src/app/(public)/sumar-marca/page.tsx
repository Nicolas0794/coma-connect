import { redirect } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { brandLeadSchema, formToObject } from "@/lib/validators";
import { brandLeadLimiter, checkLimit, ipKey } from "@/lib/ratelimit";

async function submitBrandLead(formData: FormData) {
  "use server";

  const { allowed } = await checkLimit(brandLeadLimiter(), await ipKey());
  if (!allowed) redirect("/sumar-marca?error=ratelimit");

  const parsed = brandLeadSchema.safeParse(formToObject(formData));
  if (!parsed.success) redirect("/sumar-marca?error=validation");

  const data = parsed.data;

  // Anti-dup: si ya hay un lead pendiente con ese email, no creamos otro.
  const existing = await prisma.brandLead.findFirst({
    where: { contactEmail: data.contactEmail, status: "PENDING" },
    select: { id: true },
  });
  if (existing) redirect("/sumar-marca?sent=1");

  const h = await headers();
  const source = h.get("referer") ?? null;

  await prisma.brandLead.create({
    data: {
      brandName: data.brandName,
      contactName: data.contactName,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone ?? null,
      website: data.website ?? null,
      industry: data.industry ?? null,
      message: data.message ?? null,
      source,
    },
  });

  redirect("/sumar-marca?sent=1");
}

const errorMessages: Record<string, string> = {
  validation: "Revisá los datos. El email tiene que ser válido y el sitio web debe empezar con https://",
  ratelimit: "Recibimos muchas solicitudes desde tu red. Esperá una hora y probá de nuevo.",
};

export default async function SumarMarcaPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const params = await searchParams;
  const sent = params.sent === "1";
  const err = params.error && errorMessages[params.error];

  if (sent) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20">
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <div className="size-14 rounded-full bg-[#D6E889]/30 mx-auto flex items-center justify-center text-2xl mb-4">
            🧡
          </div>
          <h1 className="text-2xl font-semibold tracking-tight mb-2">
            ¡Recibimos tu solicitud!
          </h1>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Alguien del equipo de CoMa va a revisar los datos de tu marca y te
            va a escribir en menos de 48 horas para coordinar el siguiente paso.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/">
              <Button variant="ghost">Volver al inicio</Button>
            </Link>
            <Link href="/talento">
              <Button>Explorar talento →</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-14">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.18em] text-[#FF4B2C] font-semibold mb-2">
          Para marcas
        </p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3">
          Sumá tu marca a CoMa Connect
        </h1>
        <p className="text-muted-foreground leading-relaxed max-w-xl">
          Contanos quién sos y qué te gustaría hacer. Revisamos cada solicitud
          a mano y te escribimos en menos de 48 horas para conversar.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <form action={submitBrandLead} className="space-y-5">
          {err && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
              {err}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="brandName" className="text-xs text-muted-foreground">
                Nombre de la marca *
              </Label>
              <Input
                id="brandName"
                name="brandName"
                placeholder="Ej: Ay Que Churros"
                required
                minLength={2}
                maxLength={200}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="industry" className="text-xs text-muted-foreground">
                Industria
              </Label>
              <Input
                id="industry"
                name="industry"
                placeholder="Ej: Gastronomía, Moda, Tech…"
                maxLength={200}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="website" className="text-xs text-muted-foreground">
              Sitio web o Instagram
            </Label>
            <Input
              id="website"
              name="website"
              type="url"
              placeholder="https://tumarca.com o https://instagram.com/tumarca"
            />
          </div>

          <hr className="border-border" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="contactName" className="text-xs text-muted-foreground">
                Tu nombre *
              </Label>
              <Input
                id="contactName"
                name="contactName"
                placeholder="Nombre y apellido"
                required
                minLength={2}
                maxLength={200}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contactEmail" className="text-xs text-muted-foreground">
                Email corporativo *
              </Label>
              <Input
                id="contactEmail"
                name="contactEmail"
                type="email"
                placeholder="tu@marca.com"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contactPhone" className="text-xs text-muted-foreground">
              WhatsApp / teléfono
            </Label>
            <Input
              id="contactPhone"
              name="contactPhone"
              type="tel"
              placeholder="+57 300 123 4567"
              maxLength={30}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="message" className="text-xs text-muted-foreground">
              ¿Qué te gustaría hacer con CoMa? (opcional)
            </Label>
            <textarea
              id="message"
              name="message"
              rows={4}
              maxLength={5000}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#FF4B2C]/30"
              placeholder="Contanos qué campaña estás pensando, con qué tipo de creadoras, presupuesto aproximado…"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-[11px] text-muted-foreground">
              * Campos obligatorios
            </p>
            <Button type="submit" size="lg">
              Enviar solicitud →
            </Button>
          </div>
        </form>
      </div>

      <p className="text-center text-xs text-muted-foreground mt-6">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="text-[#FF4B2C] hover:underline">
          Iniciá sesión
        </Link>
      </p>
    </div>
  );
}
