"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createInquiry } from "@/app/(public)/c/[slug]/actions";

interface Props {
  slug: string;
  creatorName: string;
  prefillName?: string;
  prefillEmail?: string;
}

export function ContactCreatorForm({ slug, creatorName, prefillName, prefillEmail }: Props) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button
        size="lg"
        className="w-full bg-[#FF4B2C] hover:bg-[#FF4B2C]/90"
        onClick={() => setOpen(true)}
      >
        Contactar
      </Button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-md rounded-xl bg-background p-6 shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5">
          <h2 className="text-lg font-semibold">Contactar a {creatorName}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Cuéntale sobre tu proyecto. Te responderá con una cotización.
          </p>
        </div>

        <form action={createInquiry} className="space-y-3">
          <input type="hidden" name="slug" value={slug} />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Tu nombre</Label>
              <Input name="contactName" defaultValue={prefillName ?? ""} required />
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <Input name="contactEmail" type="email" defaultValue={prefillEmail ?? ""} required />
            </div>
          </div>

          <div>
            <Label className="text-xs">Teléfono (opcional)</Label>
            <Input name="contactPhone" type="tel" placeholder="+57 300 123 4567" />
          </div>

          <div>
            <Label className="text-xs">¿De qué trata el proyecto?</Label>
            <textarea
              name="brief"
              rows={5}
              required
              minLength={20}
              placeholder="Marca, objetivo, formato, cantidad, fechas tentativas…"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <p className="text-[11px] text-muted-foreground mt-1">Mínimo 20 caracteres.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Presupuesto COP (opcional)</Label>
              <Input name="budgetCOP" type="number" min={0} placeholder="500000" />
            </div>
            <div>
              <Label className="text-xs">Deadline (opcional)</Label>
              <Input name="deadline" type="date" />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 bg-[#FF4B2C] hover:bg-[#FF4B2C]/90">
              Enviar solicitud
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
