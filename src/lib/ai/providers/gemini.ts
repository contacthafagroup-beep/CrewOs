import type { AIProvider } from "../types";

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

export const geminiProvider: AIProvider = {
  id: "gemini",
  async generate({ model, system, prompt, json, maxTokens, temperature }) {
    const key = process.env.GEMINI_API_KEY ?? "";
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: temperature ?? 0.7,
            maxOutputTokens: maxTokens ?? 2000,
            ...(json ? { responseMimeType: "application/json" } : {}),
          },
        }),
      },
    );
    if (!res.ok) throw new Error(`Gemini ${res.status}: ${truncate(await res.text(), 300)}`);
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
      usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
    };
    const text = (data.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
    return {
      text,
      tokensIn: data.usageMetadata?.promptTokenCount ?? 0,
      tokensOut: data.usageMetadata?.candidatesTokenCount ?? 0,
      model,
    };
  },
};
