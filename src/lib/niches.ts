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

export type Niche = (typeof NICHES)[number];
