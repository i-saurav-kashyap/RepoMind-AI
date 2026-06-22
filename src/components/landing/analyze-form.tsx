"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Github, Loader2 } from "lucide-react";

const EXAMPLES = [
  "facebook/react",
  "vercel/next.js",
  "tiangolo/fastapi",
  "pallets/flask",
];

export function AnalyzeForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(value: string) {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      router.push(`/r/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start analysis.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-2xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (url.trim() && !loading) submit(url);
        }}
        className="group relative flex items-center gap-2 rounded-2xl border border-border bg-surface/80 p-2 shadow-2xl backdrop-blur transition focus-within:border-accent/60 focus-within:ring-2 focus-within:ring-accent/30"
      >
        <Github className="ml-3 h-5 w-5 shrink-0 text-muted" />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={loading}
          placeholder="https://github.com/owner/repository"
          className="min-w-0 flex-1 bg-transparent py-2.5 text-base text-fg placeholder:text-muted/70 focus:outline-none"
          autoFocus
        />
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 font-medium text-accent-fg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Analyzing
            </>
          ) : (
            <>
              Analyze <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted">Try:</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            disabled={loading}
            onClick={() => {
              setUrl(`https://github.com/${ex}`);
              submit(`https://github.com/${ex}`);
            }}
            className="rounded-full border border-border bg-surface-2/60 px-3 py-1 font-mono text-xs text-fg/80 transition hover:border-accent/40 hover:text-accent disabled:opacity-50"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}
