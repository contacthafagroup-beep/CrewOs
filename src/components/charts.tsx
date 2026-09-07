// Lightweight server-renderable charts (no chart library).

export function BarChart({
  data,
  unit = "",
  height = 120,
}: {
  data: { label: string; value: number }[];
  unit?: string;
  height?: number;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((d) => (
        <div key={d.label} className="group relative flex h-full flex-1 flex-col justify-end" title={`${d.label}: ${d.value}${unit}`}>
          <div
            className="w-full rounded-t bg-emerald-500/70 transition group-hover:bg-emerald-400"
            style={{ height: `${Math.max(2, (d.value / max) * 100)}%` }}
          />
        </div>
      ))}
    </div>
  );
}
