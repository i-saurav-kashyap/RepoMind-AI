"use client";

import { useEffect, useRef, useState } from "react";

let idCounter = 0;

export function Mermaid({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          securityLevel: "strict",
          themeVariables: {
            background: "transparent",
            primaryColor: "#1c1b29",
            primaryBorderColor: "#7c5cff",
            primaryTextColor: "#eef0fb",
            lineColor: "#5b5b78",
            fontFamily: "var(--font-sans)",
          },
        });
        const id = `mmd-${++idCounter}`;
        const { svg } = await mermaid.render(id, chart.trim());
        if (!cancelled && ref.current) ref.current.innerHTML = svg;
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Diagram failed to render.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chart]);

  if (error) {
    return (
      <div className="rounded-lg border border-border bg-surface-2 p-4">
        <p className="mb-2 text-sm text-rose-400">Could not render diagram.</p>
        <pre className="overflow-x-auto text-xs text-muted">{chart}</pre>
      </div>
    );
  }

  return <div ref={ref} className="flex justify-center overflow-x-auto [&_svg]:max-w-full" />;
}
