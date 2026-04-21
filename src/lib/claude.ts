import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

// IA-1: modelo centralizado. Sonnet para JSON/matching (rápido + barato),
// Opus para tareas creativas largas (mejor calidad).
export const CLAUDE_MODEL = process.env.CLAUDE_MODEL ?? "claude-sonnet-4-6";
export const CLAUDE_MODEL_HEAVY =
  process.env.CLAUDE_MODEL_HEAVY ?? "claude-opus-4-7";

let client: Anthropic | null | undefined;

export function getAnthropicClient(): Anthropic | null {
  if (client !== undefined) return client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn(
      "[claude] ANTHROPIC_API_KEY no configurada — las features IA caen en fallback.",
    );
    client = null;
    return null;
  }
  client = new Anthropic({ apiKey });
  return client;
}

// IA-4: retry con exponential backoff + jitter para 429 y 5xx.
interface RetryOpts {
  retries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

export async function callClaudeWithRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOpts = {},
): Promise<T> {
  const retries = opts.retries ?? 3;
  const baseDelay = opts.baseDelayMs ?? 1000;
  const maxDelay = opts.maxDelayMs ?? 15000;

  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const status =
        typeof err === "object" && err && "status" in err
          ? Number((err as { status: unknown }).status)
          : 0;
      const retryable = status === 429 || (status >= 500 && status < 600);
      if (!retryable || i === retries) throw err;

      const exp = Math.min(baseDelay * Math.pow(2, i), maxDelay);
      const jitter = Math.random() * 500;
      await new Promise((r) => setTimeout(r, exp + jitter));
      console.warn(
        `[claude] retry ${i + 1}/${retries} tras ${status || "error"} (espera ${Math.round(exp + jitter)}ms)`,
      );
    }
  }
  throw new Error("unreachable");
}

// IA-6: envolver inputs del usuario en XML para que el modelo NO los interprete
// como instrucciones. Protege contra prompt injection del tipo "ignora lo anterior".
export function wrapUserInputXml(tag: string, data: unknown): string {
  const serialized =
    typeof data === "string" ? data : JSON.stringify(data, null, 2);
  return `<${tag}>\n${serialized}\n</${tag}>`;
}

// IA-5: instrumentación de uso. Fire-and-forget — un error en el log nunca
// debe romper la feature que lo invoca.
export interface LogUsageInput {
  feature: string;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  stopReason?: string | null;
  durationMs: number;
  success: boolean;
  errorMessage?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  userId?: string | null;
}

export function logAiUsage(input: LogUsageInput): void {
  prisma.aiUsageLog
    .create({
      data: {
        feature: input.feature,
        model: input.model,
        inputTokens: input.inputTokens ?? 0,
        outputTokens: input.outputTokens ?? 0,
        stopReason: input.stopReason ?? null,
        durationMs: input.durationMs,
        success: input.success,
        errorMessage: input.errorMessage ?? null,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        userId: input.userId ?? null,
      },
    })
    .catch((err: unknown) =>
      console.error("[claude/logAiUsage] failed:", err),
    );
}
