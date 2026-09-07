import type { ModelTier } from "../ai/types";

export type InputType = "text" | "textarea" | "number" | "select";

export interface AgentInputSpec {
  field: string;
  label: string;
  type: InputType;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  defaultValue?: string;
  help?: string;
}

export interface AgentStepSpec {
  id: string;
  label: string;
}

export type StepStatus = "pending" | "running" | "done";

export interface RunCtx {
  runId: string;
  wsId: string;
  userId?: string;
  brandName: string;
  step: (id: string, status: StepStatus) => Promise<void>;
  ai: (tier: ModelTier, opts: { system: string; prompt: string; json?: boolean; maxTokens?: number }) => Promise<{
    text: string;
    tokensIn: number;
    tokensOut: number;
    model: string;
  }>;
}

export interface AgentDefinition {
  id: string;
  name: string;
  icon: string;
  tagline: string;
  description: string;
  tier: ModelTier;
  inputs: AgentInputSpec[];
  steps: AgentStepSpec[];
  run: (ctx: RunCtx, input: Record<string, string>) => Promise<{ summary: string } & Record<string, unknown>>;
}

/** Serializable subset safe to pass from server pages to client components. */
export interface AgentSpec {
  id: string;
  name: string;
  icon: string;
  tagline: string;
  description: string;
  tier: ModelTier;
  inputs: AgentInputSpec[];
  steps: AgentStepSpec[];
}
