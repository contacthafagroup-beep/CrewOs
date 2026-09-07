// Robust JSON extraction from LLM output. Pure — unit tested.

export function extractJson<T>(text: string): T | null {
  if (!text) return null;
  let s = text.trim();
  // Strip markdown fences
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  // Direct parse
  try {
    return JSON.parse(s) as T;
  } catch {
    /* fall through */
  }
  // Find outermost object/array in a noisy string
  const starts = [s.indexOf("{"), s.indexOf("[")].filter((i) => i >= 0);
  if (starts.length === 0) return null;
  const start = Math.min(...starts);
  const openChar = s[start];
  const closeChar = openChar === "{" ? "}" : "]";
  const end = s.lastIndexOf(closeChar);
  if (end <= start) return null;
  const candidate = s.slice(start, end + 1);
  try {
    return JSON.parse(candidate) as T;
  } catch {
    return null;
  }
}
