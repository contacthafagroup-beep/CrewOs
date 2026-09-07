// Lead score normalization. Pure — unit tested.

export function clampScore(value: unknown, fallback = 50): number {
  let n: number;
  if (typeof value === "number") n = value;
  else if (typeof value === "string" && value.trim() !== "") n = Number(value);
  else return fallback;
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function scoreBand(score: number): "hot" | "warm" | "cool" {
  if (score >= 80) return "hot";
  if (score >= 60) return "warm";
  return "cool";
}
