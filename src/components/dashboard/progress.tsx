"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, CircleAlert, Github, ScanSearch, BrainCircuit, Sparkles } from "lucide-react";

const STEPS = [
  { key: "PENDING", label: "Queued", icon: Sparkles },
  { key: "CLONING", label: "Fetching repository from GitHub", icon: Github },
  { key: "ANALYZING", label: "AI reading the codebase", icon: BrainCircuit },
  { key: "COMPLETED", label: "Report ready", icon: ScanSearch },
];

const ORDER = ["PENDING", "CLONING", "ANALYZING", "COMPLETED"];

export function AnalysisProgress({
  id,
  initialStatus,
  repo,
}: {
  id: string;
  initialStatus: string;
  repo: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "COMPLETED" || status === "FAILED") return;
    const t = setInterval(async () => {
      try {
        const res = await fetch(`/api/analysis/${id}`);
        const data = await res.json();
        if (data.status === "FAILED") {
          setError(data.error || "Analysis failed.");
          setStatus("FAILED");
          clearInterval(t);
        } else if (data.status === "COMPLETED") {
          setStatus("COMPLETED");
          clearInterval(t);
          router.refresh();
        } else {
          setStatus(data.status);
        }
      } catch {
        /* keep polling */
      }
    }, 2000);
    return () => clearInterval(t);
  }, [id, status, router]);

  const currentIndex = ORDER.indexOf(status);

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-5">
      <div className="w-full rounded-2xl border border-border bg-surface/70 p-8 backdrop-blur">
        <div className="mb-1 text-sm text-muted">Analyzing</div>
        <div className="mb-6 font-mono text-lg text-fg">{repo}</div>

        {status === "FAILED" ? (
          <div className="flex items-start gap-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-4">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
            <div>
              <p className="font-medium text-rose-300">Analysis failed</p>
              <p className="mt-1 text-sm text-muted">{error}</p>
            </div>
          </div>
        ) : (
          <ul className="space-y-4">
            {STEPS.map((step, i) => {
              const done = i < currentIndex;
              const active = i === currentIndex;
              const Icon = step.icon;
              return (
                <li key={step.key} className="flex items-center gap-3">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                      done
                        ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                        : active
                          ? "border-accent/50 bg-accent/15 text-accent"
                          : "border-border bg-surface-2 text-muted"
                    }`}
                  >
                    {done ? (
                      <Check className="h-4 w-4" />
                    ) : active ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </span>
                  <span className={active ? "text-fg" : done ? "text-fg/70" : "text-muted"}>
                    {step.label}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        <p className="mt-6 text-xs text-muted">
          Larger repositories take longer — typically 20–90 seconds.
        </p>
      </div>
    </div>
  );
}
