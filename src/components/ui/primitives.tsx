import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface/70 backdrop-blur-sm",
        className,
      )}
      {...props}
    />
  );
}

export function Badge({
  className,
  tone = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "default" | "accent" | "low" | "medium" | "high" | "info";
}) {
  const tones: Record<string, string> = {
    default: "bg-surface-2 text-fg/80 border-border",
    accent: "bg-accent/15 text-accent border-accent/30",
    low: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    medium: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    high: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    info: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

export function ScoreBar({
  label,
  value,
  invert = false,
}: {
  label: string;
  value: number;
  /** when true, lower is better (e.g. tech debt) — flips the color scale */
  invert?: boolean;
}) {
  const good = invert ? value <= 40 : value >= 70;
  const mid = invert ? value <= 70 : value >= 40;
  const color = good ? "bg-emerald-500" : mid ? "bg-amber-500" : "bg-rose-500";
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="text-fg/80">{label}</span>
        <span className="font-mono text-fg">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-2">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-surface-2/60 px-4 py-3">
      <div className="font-mono text-lg font-semibold text-fg">{value}</div>
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
    </div>
  );
}

export function SectionTitle({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      {icon && <div className="mt-0.5 text-accent">{icon}</div>}
      <div>
        <h2 className="text-xl font-semibold text-fg">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
    </div>
  );
}
