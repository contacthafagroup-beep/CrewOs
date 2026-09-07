export type ModelTier = "fast" | "balanced" | "premium";

export interface GenerateOptions {
  system: string;
  prompt: string;
  json?: boolean;
  maxTokens?: number;
  temperature?: number;
}

export interface GenerateResult {
  text: string;
  tokensIn: number;
  tokensOut: number;
  model: string;
  provider: string;
}

export interface ProviderGenerateArgs extends GenerateOptions {
  model: string;
}

export interface AIProvider {
  id: string;
  generate(args: ProviderGenerateArgs): Promise<{ text: string; tokensIn: number; tokensOut: number }>;
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
