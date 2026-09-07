// Per-model price table (USD per 1M tokens) + cost estimation. Pure — unit tested.

export const PRICE_PER_MTOK: Record<string, { in: number; out: number }> = {
  "gpt-4o-mini": { in: 0.15, out: 0.6 },
  "gpt-4o": { in: 2.5, out: 10 },
  "claude-3-5-haiku-latest": { in: 0.8, out: 4 },
  "claude-3-5-sonnet-latest": { in: 3, out: 15 },
  "gemini-1.5-flash": { in: 0.075, out: 0.3 },
  "gemini-1.5-pro": { in: 1.25, out: 5 },
  "crewos-mock-v1": { in: 0, out: 0 },
};

export const DEFAULT_PRICE_PER_MTOK = { in: 0.5, out: 1.5 };

export function estCostCents(model: string, tokensIn: number, tokensOut: number): number {
  const p = PRICE_PER_MTOK[model] ?? DEFAULT_PRICE_PER_MTOK;
  const dollars = (tokensIn / 1_000_000) * p.in + (tokensOut / 1_000_000) * p.out;
  return Math.ceil(dollars * 100);
}
