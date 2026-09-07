import type { AIProvider } from "../types";

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

export const ollamaProvider: AIProvider = {
  id: "ollama",
  async generate({ model, system, prompt, json, temperature }) {
    const base = (process.env.OLLAMA_BASE_URL || "http://localhost:11434").replace(/\/$/, "");
    const res = await fetch(`${base}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model,
        stream: false,
        format: json ? "json" : undefined,
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
        options: { temperature: temperature ?? 0.7 },
      }),
    });
    if (!res.ok) throw new Error(`Ollama ${res.status}: ${truncate(await res.text(), 300)}`);
    const data = (await res.json()) as {
      message?: { content?: string };
      prompt_eval_count?: number;
      eval_count?: number;
    };
    return {
      text: data.message?.content ?? "",
      tokensIn: data.prompt_eval_count ?? 0,
      tokensOut: data.eval_count ?? 0,
      model,
    };
  },
};
