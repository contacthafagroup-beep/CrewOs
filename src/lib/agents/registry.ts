import { outreachAgent } from "./outreach";
import { contentAgent } from "./content";
import { proposalAgent } from "./proposal";
import type { AgentDefinition, AgentSpec } from "./types";

export const AGENTS: AgentDefinition[] = [outreachAgent, contentAgent, proposalAgent];

export function agentById(id: string): AgentDefinition | null {
  return AGENTS.find((a) => a.id === id) ?? null;
}

export function agentSpec(def: AgentDefinition): AgentSpec {
  return {
    id: def.id,
    name: def.name,
    icon: def.icon,
    tagline: def.tagline,
    description: def.description,
    tier: def.tier,
    inputs: def.inputs,
    steps: def.steps,
  };
}

/** Serializable specs for client components (no DB/engine imports). */
export const AGENT_SPECS: AgentSpec[] = AGENTS.map(agentSpec);
