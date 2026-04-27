"use client";

import { useState } from "react";
import { NICHES, slugifyNiche } from "@/lib/niches";

interface NicheOption {
  slug: string;
  label: string;
}

interface Props {
  name: string;
  defaultValue?: string[]; // puede venir como slugs o labels — normalizamos
  /** Lista dinámica desde DB. Si no se pasa, usa NICHES hardcoded. */
  options?: NicheOption[];
}

function defaultOptions(): NicheOption[] {
  return NICHES.map((label) => ({ slug: slugifyNiche(label), label }));
}

export function NicheMultiSelect({
  name,
  defaultValue = [],
  options,
}: Props) {
  const opts = options && options.length > 0 ? options : defaultOptions();
  const slugSet = new Set(opts.map((o) => o.slug));

  // Normalizar defaultValue: puede venir como slugs o labels. Convertir todo a slug
  // y quedarse solo con los que matcheen alguna option.
  const initial = Array.from(
    new Set(
      defaultValue
        .map((v) => slugifyNiche(v))
        .filter((s) => slugSet.has(s)),
    ),
  );

  const [selected, setSelected] = useState<string[]>(initial);

  const toggle = (slug: string) => {
    setSelected((prev) =>
      prev.includes(slug) ? prev.filter((n) => n !== slug) : [...prev, slug],
    );
  };

  return (
    <div>
      <input type="hidden" name={name} value={selected.join(",")} />
      <div className="flex flex-wrap gap-1.5">
        {opts.map((opt) => {
          const active = selected.includes(opt.slug);
          return (
            <button
              key={opt.slug}
              type="button"
              onClick={() => toggle(opt.slug)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                active
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-secondary text-muted-foreground border-input/60 hover:border-input hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {selected.length === 0 && (
        <p className="text-[11px] text-muted-foreground mt-1.5">
          Seleccioná uno o varios nichos.
        </p>
      )}
    </div>
  );
}
