import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";
const btnVariants = {
  primary: "bg-emerald-500 text-emerald-950 hover:bg-emerald-400",
  secondary:
    "border border-zinc-200 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800",
  ghost: "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800",
  danger: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof btnVariants }) {
  return <button className={`${btnBase} ${btnVariants[variant]} px-4 py-2 ${className}`} {...props} />;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 ${className}`}
    >
      {children}
    </div>
  );
}

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
      {children}
    </label>
  );
}

const fieldCls =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder-zinc-600";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${fieldCls} ${className}`} {...props} />;
}

export function Textarea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${fieldCls} min-h-24 ${className}`} {...props} />;
}

export function Select({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${fieldCls} ${className}`} {...props} />;
}

const badgeTones = {
  green: "bg-emerald-500/10 text-emerald-500",
  yellow: "bg-amber-500/10 text-amber-500",
  red: "bg-red-500/10 text-red-500",
  blue: "bg-sky-500/10 text-sky-500",
  zinc: "bg-zinc-500/10 text-zinc-500 dark:text-zinc-400",
};

export function Badge({ tone = "zinc", children }: { tone?: keyof typeof badgeTones; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeTones[tone]}`}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, keyof typeof badgeTones> = {
    COMPLETED: "green",
    RUNNING: "blue",
    QUEUED: "zinc",
    FAILED: "red",
    ACTIVE: "green",
    TRIALING: "blue",
    PAST_DUE: "yellow",
    CANCELED: "red",
    INCOMPLETE: "red",
  };
  return <Badge tone={map[status] ?? "zinc"}>{status}</Badge>;
}

export function ProgressBar({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
      <div
        className={`h-full rounded-full transition-all ${clamped >= 90 ? "bg-red-500" : clamped >= 70 ? "bg-amber-500" : "bg-emerald-500"}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export function EmptyState({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 py-12 text-center dark:border-zinc-800">
      <div className="mb-3 text-3xl">{icon}</div>
      <div className="font-semibold">{title}</div>
      <p className="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">{body}</p>
    </div>
  );
}
