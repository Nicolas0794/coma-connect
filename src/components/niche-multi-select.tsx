"use client";

import { useState } from "react";
import { NICHES } from "@/lib/niches";

interface Props {
  name: string;
  defaultValue?: string[];
}

export function NicheMultiSelect({ name, defaultValue = [] }: Props) {
  const [selected, setSelected] = useState<string[]>(defaultValue);

  const toggle = (niche: string) => {
    setSelected((prev) =>
      prev.includes(niche) ? prev.filter((n) => n !== niche) : [...prev, niche],
    );
  };

  return (
    <div>
      <input type="hidden" name={name} value={selected.join(",")} />
      <div className="flex flex-wrap gap-1.5">
        {NICHES.map((niche) => {
          const active = selected.includes(niche);
          return (
            <button
              key={niche}
              type="button"
              onClick={() => toggle(niche)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                active
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-secondary text-muted-foreground border-input/60 hover:border-input hover:text-foreground"
              }`}
            >
              {niche}
            </button>
          );
        })}
      </div>
      {selected.length === 0 && (
        <p className="text-[11px] text-muted-foreground mt-1.5">
          Seleccioná uno o varios nichos que encajen con tu campaña.
        </p>
      )}
    </div>
  );
}
