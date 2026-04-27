import { describe, expect, it } from "vitest";
import { slugifyNiche, titleCaseNiche } from "../niches";

describe("slugifyNiche", () => {
  it("lowercase + trim", () => {
    expect(slugifyNiche("  MODA  ")).toBe("moda");
  });

  it("quita tildes", () => {
    expect(slugifyNiche("Gastronomía")).toBe("gastronomia");
  });

  it("convierte espacios a guión simple", () => {
    expect(slugifyNiche("Diseño Gráfico")).toBe("diseno-grafico");
  });

  it("distintas capitalizaciones y acentos convergen al mismo slug", () => {
    expect(slugifyNiche("Gastronomía")).toBe(slugifyNiche("gastronomía"));
    expect(slugifyNiche("Gastronomia")).toBe(slugifyNiche("Gastronomía"));
  });

  it("ignora caracteres inválidos", () => {
    expect(slugifyNiche("Arte & Diseño!")).toBe("arte-diseno");
  });

  it("strings vacíos → string vacío", () => {
    expect(slugifyNiche("")).toBe("");
    expect(slugifyNiche("  ")).toBe("");
  });

  it("no deja guiones al inicio/final", () => {
    expect(slugifyNiche("-foo-")).toBe("foo");
  });
});

describe("titleCaseNiche", () => {
  it("capitaliza primera letra de cada palabra separada por guión", () => {
    expect(titleCaseNiche("diseno-grafico")).toBe("Diseno Grafico");
  });

  it("palabra simple", () => {
    expect(titleCaseNiche("moda")).toBe("Moda");
  });

  it("string vacío", () => {
    expect(titleCaseNiche("")).toBe("");
  });
});
