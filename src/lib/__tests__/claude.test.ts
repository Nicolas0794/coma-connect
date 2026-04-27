import { describe, expect, it, vi } from "vitest";
import { callClaudeWithRetry, wrapUserInputXml } from "../claude";

describe("wrapUserInputXml", () => {
  it("envuelve strings en el tag dado", () => {
    const out = wrapUserInputXml("foo", "hola");
    expect(out).toBe("<foo>\nhola\n</foo>");
  });

  it("serializa objetos a JSON", () => {
    const out = wrapUserInputXml("payload", { a: 1, b: "x" });
    expect(out).toContain("<payload>");
    expect(out).toContain('"a": 1');
    expect(out).toContain('"b": "x"');
    expect(out).toContain("</payload>");
  });
});

describe("callClaudeWithRetry", () => {
  it("retorna inmediatamente si la primera llamada funciona", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    const out = await callClaudeWithRetry(fn, { retries: 3, baseDelayMs: 1 });
    expect(out).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("reintenta en 429 y eventualmente resuelve", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce({ status: 429 })
      .mockRejectedValueOnce({ status: 429 })
      .mockResolvedValue("ok");
    const out = await callClaudeWithRetry(fn, { retries: 3, baseDelayMs: 1 });
    expect(out).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("reintenta en 503 (5xx)", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce({ status: 503 })
      .mockResolvedValue("ok");
    const out = await callClaudeWithRetry(fn, { retries: 2, baseDelayMs: 1 });
    expect(out).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("NO reintenta en 400 (error del cliente)", async () => {
    const err = { status: 400, message: "bad request" };
    const fn = vi.fn().mockRejectedValue(err);
    await expect(
      callClaudeWithRetry(fn, { retries: 3, baseDelayMs: 1 }),
    ).rejects.toEqual(err);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("tira el último error si se agotan los retries", async () => {
    const err = { status: 500 };
    const fn = vi.fn().mockRejectedValue(err);
    await expect(
      callClaudeWithRetry(fn, { retries: 2, baseDelayMs: 1 }),
    ).rejects.toEqual(err);
    // 1 llamada inicial + 2 retries = 3
    expect(fn).toHaveBeenCalledTimes(3);
  });
});
