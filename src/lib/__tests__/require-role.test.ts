import { describe, expect, it } from "vitest";
import { homeForRole } from "../role-routes";

describe("homeForRole", () => {
  it("CREATOR → /mi-espacio", () => {
    expect(homeForRole("CREATOR")).toBe("/mi-espacio");
  });

  it("CLIENT → /portal", () => {
    expect(homeForRole("CLIENT")).toBe("/portal");
  });

  it("ADMIN → /dashboard", () => {
    expect(homeForRole("ADMIN")).toBe("/dashboard");
  });

  it("TEAM → /dashboard", () => {
    expect(homeForRole("TEAM")).toBe("/dashboard");
  });

  it("role desconocido → /login (defensivo)", () => {
    expect(homeForRole("HACKER")).toBe("/login");
    expect(homeForRole("")).toBe("/login");
  });
});
