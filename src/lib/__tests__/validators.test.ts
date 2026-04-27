import { describe, expect, it } from "vitest";
import {
  brandLeadSchema,
  createInquirySchema,
  formToObject,
  httpsUrl,
  saveIdentitySchema,
  saveSocialProfileSchema,
} from "../validators";

describe("httpsUrl", () => {
  it("rechaza URLs con esquema javascript:", () => {
    expect(httpsUrl.safeParse("javascript:alert(1)").success).toBe(false);
  });

  it("rechaza URLs con esquema data:", () => {
    expect(httpsUrl.safeParse("data:text/html,<script>").success).toBe(false);
  });

  it("acepta https://", () => {
    expect(httpsUrl.safeParse("https://foo.com/img.jpg").success).toBe(true);
  });

  it("rechaza strings >500 chars", () => {
    expect(httpsUrl.safeParse("https://" + "x".repeat(510)).success).toBe(false);
  });
});

describe("saveIdentitySchema", () => {
  it("rechaza profileImageUrl malicioso", () => {
    const res = saveIdentitySchema.safeParse({
      profileImageUrl: "javascript:alert(document.cookie)",
    });
    expect(res.success).toBe(false);
  });

  it("acepta campos vacíos (opcionales)", () => {
    const res = saveIdentitySchema.safeParse({});
    expect(res.success).toBe(true);
  });

  it("respeta maxLength en valuePitch", () => {
    const huge = "x".repeat(6000);
    const res = saveIdentitySchema.safeParse({ valuePitch: huge });
    expect(res.success).toBe(false);
  });
});

describe("saveSocialProfileSchema", () => {
  it("rechaza handle con HTML", () => {
    const res = saveSocialProfileSchema.safeParse({
      platform: "INSTAGRAM",
      handle: "<script>alert(1)</script>",
    });
    expect(res.success).toBe(false);
  });

  it("rechaza platform fuera del enum", () => {
    const res = saveSocialProfileSchema.safeParse({
      platform: "FACEBOOK",
      handle: "maria",
    });
    expect(res.success).toBe(false);
  });

  it("quita el @ del handle", () => {
    const res = saveSocialProfileSchema.safeParse({
      platform: "TIKTOK",
      handle: "@maria",
    });
    expect(res.success).toBe(true);
    if (res.success) expect(res.data.handle).toBe("maria");
  });
});

describe("createInquirySchema", () => {
  const base = {
    slug: "maria",
    brief: "Necesitamos un UGC de 30 segundos sobre el producto.",
    contactName: "Nico García",
    contactEmail: "nico@coma.co",
  };

  it("acepta payload mínimo válido", () => {
    expect(createInquirySchema.safeParse(base).success).toBe(true);
  });

  it("rechaza email inválido", () => {
    expect(
      createInquirySchema.safeParse({ ...base, contactEmail: "nope" }).success,
    ).toBe(false);
  });

  it("rechaza brief de menos de 20 caracteres", () => {
    expect(
      createInquirySchema.safeParse({ ...base, brief: "corto" }).success,
    ).toBe(false);
  });

  it("rechaza slug con caracteres peligrosos", () => {
    expect(
      createInquirySchema.safeParse({ ...base, slug: "hack/../admin" }).success,
    ).toBe(false);
  });
});

describe("brandLeadSchema", () => {
  const base = {
    brandName: "Comfandi",
    contactName: "Maria Lopez",
    contactEmail: "maria@comfandi.co",
  };

  it("acepta payload mínimo", () => {
    expect(brandLeadSchema.safeParse(base).success).toBe(true);
  });

  it("rechaza website con esquema inválido", () => {
    expect(
      brandLeadSchema.safeParse({ ...base, website: "javascript:alert(1)" })
        .success,
    ).toBe(false);
  });

  it("rechaza brandName demasiado corto", () => {
    expect(brandLeadSchema.safeParse({ ...base, brandName: "a" }).success).toBe(
      false,
    );
  });
});

describe("formToObject", () => {
  it("convierte FormData básico a objeto plano", () => {
    const fd = new FormData();
    fd.set("a", "1");
    fd.set("b", "texto");
    fd.set("empty", "");
    const obj = formToObject(fd);
    expect(obj.a).toBe("1");
    expect(obj.b).toBe("texto");
    expect(obj.empty).toBeUndefined();
  });

  it("junta valores múltiples cuando la key está en multiKeys", () => {
    const fd = new FormData();
    fd.append("langs", "ES");
    fd.append("langs", "EN");
    const obj = formToObject(fd, ["langs"]);
    expect(obj.langs).toEqual(["ES", "EN"]);
  });
});
