import { describe, expect, it } from "vitest";
import { calculateCompleteness, slugify } from "../creator-profile";
import type {
  ContentFormat,
  CreatorType,
  Language,
} from "@/generated/prisma/enums";

describe("slugify", () => {
  it("convierte espacios a guiones y lowercase", () => {
    expect(slugify("Valentina Arce")).toBe("valentina-arce");
  });

  it("quita tildes", () => {
    expect(slugify("Andrés Ñañez")).toBe("andres-nanez");
  });

  it("quita caracteres no válidos", () => {
    expect(slugify("María & José!")).toBe("maria-jose");
  });

  it("colapsa guiones múltiples", () => {
    expect(slugify("a  -  b")).toBe("a-b");
  });
});

describe("calculateCompleteness", () => {
  const emptyCreator = {
    fullName: "Valentina",
    artistName: null,
    headline: null,
    valuePitch: null,
    bio: null,
    profileImageUrl: null,
    city: null,
    country: null,
    niches: [],
    creatorTypes: [],
    contentFormats: [],
    languages: [],
    socialProfilesCount: 0,
    portfolioItemsCount: 0,
    servicesCount: 0,
  };

  it("perfil vacío = 0", () => {
    expect(calculateCompleteness(emptyCreator)).toBe(0);
  });

  it("perfil completo = 100 (clampeado)", () => {
    const full = {
      fullName: "Valentina",
      artistName: "Vale",
      headline: "UGC para marcas de lifestyle",
      valuePitch: "Creo contenido auténtico que convierte",
      bio: "Bio corta",
      profileImageUrl: "https://img.co/foto.jpg",
      city: "Cali",
      country: "Colombia",
      niches: ["lifestyle", "moda"],
      creatorTypes: ["UGC"] as CreatorType[],
      contentFormats: ["REEL"] as ContentFormat[],
      languages: ["ES"] as Language[],
      socialProfilesCount: 2,
      portfolioItemsCount: 5,
      servicesCount: 1,
    };
    expect(calculateCompleteness(full)).toBe(100);
  });

  it("suma solo los weights de los campos presentes", () => {
    const partial = {
      ...emptyCreator,
      profileImageUrl: "https://x.co/a.jpg", // +10
      headline: "Lifestyle creator", // +10
      niches: ["lifestyle"], // +10
    };
    expect(calculateCompleteness(partial)).toBe(30);
  });

  it("city + country deben estar juntos para contar", () => {
    const cityOnly = { ...emptyCreator, city: "Cali" };
    const both = { ...emptyCreator, city: "Cali", country: "Colombia" };
    expect(calculateCompleteness(cityOnly)).toBe(0);
    expect(calculateCompleteness(both)).toBe(5);
  });

  it("requiere 3+ portfolio items para sumar los 10 puntos", () => {
    const few = { ...emptyCreator, portfolioItemsCount: 2 };
    const enough = { ...emptyCreator, portfolioItemsCount: 3 };
    expect(calculateCompleteness(few)).toBe(0);
    expect(calculateCompleteness(enough)).toBe(10);
  });
});
