// Nichos semilla — se usan para inicializar la tabla Niche (MEJORA-10)
// y como fallback del NicheMultiSelect si no se le pasan nichos desde DB.
export const NICHES = [
  "Gastronomía",
  "Moda",
  "Fitness",
  "Lifestyle",
  "Viajes",
  "Belleza",
  "Tecnología",
  "Familia",
  "Deportes",
  "Entretenimiento",
  "Educación",
  "Música",
  "Arte",
  "Negocios",
  "Salud",
] as const;

export type NicheLabel = (typeof NICHES)[number];

/**
 * Convierte un label libre ("Gastronomía", "gastronomía", "Gastronomia")
 * a un slug canónico ("gastronomia"). Determinístico: mismo label → mismo slug.
 */
export function slugifyNiche(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Título esperado para cada slug canónico. Si un slug viene de data legacy
 * sin label explícito, usá esto para mostrarlo bien en UI.
 */
export function titleCaseNiche(input: string): string {
  return input
    .split(/[-\s]+/)
    .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}
