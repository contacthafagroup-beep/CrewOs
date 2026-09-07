import type { AIProvider, GenerateOptions, GenerateResult, ModelTier } from "./types";
import { estimateTokens } from "./types";
import { mockProvider } from "./providers/mock";
import { openaiProvider } from "./providers/openai";
import { anthropicProvider } from "./providers/anthropic";
import { geminiProvider } from "./providers/gemini";
import { ollamaProvider } from "./providers/ollama";

export const PROVIDERS: Record<string, AIProvider> = {
  mock: mockProvider,
  openai: openaiProvider,
  anthropic: anthropicProvider,
  gemini: geminiProvider,
  ollama: ollamaProvider,
};

export function activeProviderId(): string {
  const explicit = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (explicit && PROVIDERS[explicit]) return explicit;
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.OLLAMA_BASE_URL) return "ollama";
  return "mock";
}

export function modelForTier(tier: ModelTier, providerId: string): string {
  const envKey = `CREWOS_MODEL_${tier.toUpperCase()}`;
  if (process.env[envKey]) return process.env[envKey] as string;
  switch (providerId) {
    case "openai":
      return tier === "premium" ? "gpt-4o" : "gpt-4o-mini";
    case "anthropic":
      return tier === "fast" ? "claude-3-5-haiku-latest" : "claude-3-5-sonnet-latest";
    case "gemini":
      return tier === "fast" ? "gemini-1.5-flash" : tier === "premium" ? "gemini-1.5-pro" : "gemini-1.5-flash";
    case "ollama":
      return tier === "premium" ? "llama3.1:70b" : "llama3.1:8b";
    default:
      return "crewos-mock-v1";
  }
}

/**
 * Routes a generation to the active provider. Throws on provider failure —
 * agent runs surface the error instead of silently degrading.
 */
export async function generate(opts: GenerateOptions & { tier?: ModelTier }): Promise<GenerateResult> {
  const providerId = activeProviderId();
  const provider = PROVIDERS[providerId] ?? mockProvider;
  const model = modelForTier(opts.tier ?? "balanced", providerId);
  const args = {
    model,
    system: opts.system,
    prompt: opts.prompt,
    json: opts.json,
    maxTokens: opts.maxTokens,
    temperature: opts.temperature,
  };
  const out = await provider.generate(args);
  return {
    text: out.text,
    tokensIn: out.tokensIn > 0 ? out.tokensIn : estimateTokens(opts.system + opts.prompt),
    tokensOut: out.tokensOut > 0 ? out.tokensOut : estimateTokens(out.text),
    model,
    provider: providerId,
  };
}
