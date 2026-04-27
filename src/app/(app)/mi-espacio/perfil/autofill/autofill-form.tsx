"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AutofillFormState } from "./actions";
import { runAutofill, applyAutofill } from "./actions";

interface Props {
  initialHandle: string | null;
}

export function AutofillForm({ initialHandle }: Props) {
  const [state, formAction, pending] = useActionState<
    AutofillFormState,
    FormData
  >(runAutofill, { result: null });

  if (state.result?.ok) {
    return <Preview suggestions={state.result.suggestions} />;
  }

  return (
    <div className="max-w-xl mx-auto">
      <form action={formAction} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="handle" className="text-sm font-medium">
            Tu handle de Instagram
          </Label>
          <Input
            id="handle"
            name="handle"
            placeholder="@mariacreadora"
            defaultValue={initialHandle ?? ""}
            required
            autoFocus
          />
          <p className="text-[11px] text-muted-foreground">
            Tiene que ser un perfil público para que podamos leerlo.
          </p>
        </div>

        {state.result && !state.result.ok && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
            {state.result.message}
          </div>
        )}

        <Button type="submit" disabled={pending} size="lg" className="w-full">
          {pending ? "Leyendo tu Instagram..." : "✨ Autocompletar con IA"}
        </Button>

        <p className="text-[11px] text-muted-foreground text-center">
          Usamos Claude para leer tu perfil público e inferir nichos, tipos de
          contenido, headline y tarifa estimada. Vos revisás antes de guardar.
        </p>
      </form>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────

function Preview({
  suggestions,
}: {
  suggestions: Extract<AutofillFormState["result"], { ok: true }>["suggestions"];
}) {
  // Estado local: cada campo es editable antes de aplicar.
  const [artistName, setArtistName] = useState(suggestions.artistName ?? "");
  const [headline, setHeadline] = useState(suggestions.headline ?? "");
  const [valuePitch, setValuePitch] = useState(suggestions.valuePitch ?? "");
  const [bio, setBio] = useState(suggestions.bio ?? "");
  const [city, setCity] = useState(suggestions.suggestedCity ?? "");
  const [country, setCountry] = useState(
    suggestions.suggestedCountry ?? "Colombia",
  );
  const [baseRate, setBaseRate] = useState(
    suggestions.suggestedBaseRateCOP?.toString() ?? "",
  );
  const [creatorTypes, setCreatorTypes] = useState(suggestions.creatorTypes);
  const [contentFormats, setContentFormats] = useState(
    suggestions.contentFormats,
  );
  const [languages, setLanguages] = useState(suggestions.languages);
  const [niches, setNiches] = useState(suggestions.niches);

  const toggle = <T,>(arr: T[], value: T): T[] =>
    arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];

  const removeNiche = (slug: string) =>
    setNiches((prev) => prev.filter((n) => n.slug !== slug));

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#D6E889]/60 bg-[#D6E889]/15 p-5">
        <p className="text-sm font-semibold mb-1">
          ✨ Completé esto leyendo tu Instagram{" "}
          <a
            href={suggestions.source.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#FF4B2C] hover:underline"
          >
            @{suggestions.source.handle} ↗
          </a>
        </p>
        <p className="text-xs text-muted-foreground">
          Revisá y ajustá lo que quieras antes de guardar. Todo es editable.
        </p>
      </div>

      <form action={applyAutofill} className="space-y-6">
        <input type="hidden" name="sourceUrl" value={suggestions.source.profileUrl} />

        <section className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="font-semibold">Identidad</h3>

          <div className="space-y-1.5">
            <Label className="text-xs">Nombre artístico</Label>
            <Input
              name="artistName"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              placeholder="Opcional"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Headline</Label>
            <Input
              name="headline"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="5-8 palabras"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Value pitch</Label>
            <textarea
              name="valuePitch"
              value={valuePitch}
              onChange={(e) => setValuePitch(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-input/60 bg-secondary px-3 py-2 text-sm resize-none focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Bio (de tu Instagram)</Label>
            <textarea
              name="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-input/60 bg-secondary px-3 py-2 text-sm resize-none outline-none"
            />
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="font-semibold">Ubicación</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Ciudad</Label>
              <Input
                name="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">País</Label>
              <Input
                name="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="font-semibold">Clasificación</h3>

          <div>
            <Label className="text-xs mb-2 block">Tipos de creador</Label>
            <input
              type="hidden"
              name="creatorTypes"
              value={creatorTypes.join(",")}
            />
            <Chips
              options={[
                "UGC",
                "INFLUENCER",
                "FILMMAKER",
                "PHOTOGRAPHER",
                "EDITOR",
                "STRATEGIST",
                "COPYWRITER",
                "DESIGNER",
                "MODEL",
              ]}
              selected={creatorTypes}
              onToggle={(v) => setCreatorTypes(toggle(creatorTypes, v))}
            />
          </div>

          <div>
            <Label className="text-xs mb-2 block">Formatos de contenido</Label>
            <input
              type="hidden"
              name="contentFormats"
              value={contentFormats.join(",")}
            />
            <Chips
              options={[
                "REEL",
                "TIKTOK_VIDEO",
                "PHOTO",
                "LONG_VIDEO",
                "CAROUSEL",
                "LIVE",
                "PODCAST",
                "BLOG",
              ]}
              selected={contentFormats}
              onToggle={(v) => setContentFormats(toggle(contentFormats, v))}
            />
          </div>

          <div>
            <Label className="text-xs mb-2 block">Idiomas</Label>
            <input type="hidden" name="languages" value={languages.join(",")} />
            <Chips
              options={["ES", "EN", "PT"]}
              selected={languages}
              onToggle={(v) => setLanguages(toggle(languages, v))}
            />
          </div>

          <div>
            <Label className="text-xs mb-2 block">Nichos</Label>
            <input
              type="hidden"
              name="niches"
              value={niches.map((n) => n.slug).join(",")}
            />
            <div className="flex flex-wrap gap-1.5">
              {niches.map((n) => (
                <button
                  key={n.slug}
                  type="button"
                  onClick={() => removeNiche(n.slug)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#FF4B2C]/15 text-[#FF4B2C] border border-[#FF4B2C]/30 hover:bg-[#FF4B2C]/25 transition"
                  title="Click para remover"
                >
                  {n.label} ×
                </button>
              ))}
              {niches.length === 0 && (
                <p className="text-[11px] text-muted-foreground">
                  No detectamos nichos claros. Agregalos después en tu perfil.
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h3 className="font-semibold">Tarifa base estimada</h3>
          <div className="space-y-1.5">
            <Label className="text-xs">Pesos colombianos (COP)</Label>
            <Input
              name="suggestedBaseRateCOP"
              type="number"
              value={baseRate}
              onChange={(e) => setBaseRate(e.target.value)}
              placeholder="Ej: 300000"
            />
            <p className="text-[11px] text-muted-foreground">
              Lo estimamos con tus followers y estilo. Ajustalo si querés —
              podés cambiarlo cuando quieras desde tu perfil.
            </p>
          </div>
        </section>

        <div className="flex gap-3 pt-2">
          <Link href="/mi-espacio/perfil" className="flex-1">
            <Button type="button" variant="ghost" className="w-full">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" size="lg" className="flex-1">
            Aplicar a mi perfil →
          </Button>
        </div>
      </form>
    </div>
  );
}

function Chips<T extends string>({
  options,
  selected,
  onToggle,
}: {
  options: T[];
  selected: T[];
  onToggle: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              active
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary text-muted-foreground border-input/60 hover:border-input"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
