export function fmtUsd(cents: number): string {
  const dollars = cents / 100;
  return dollars.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: dollars % 1 === 0 ? 0 : 2 });
}

export function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function fmtDateTime(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
