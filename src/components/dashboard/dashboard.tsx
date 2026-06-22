"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Boxes,
  Network,
  FolderTree as FolderTreeIcon,
  Layers,
  Package,
  GaugeCircle,
  Puzzle,
  Map as MapIcon,
  Lightbulb,
  BookOpen,
  MessageSquareCode,
  Star,
  GitFork,
  Eye,
  CircleDot,
  ExternalLink,
  Download,
  Calendar,
  Scale,
  Sparkles,
} from "lucide-react";
import type { FullAnalysis } from "@/types/analysis";
import { Badge, Card, ScoreBar, Stat, SectionTitle } from "@/components/ui/primitives";
import { Markdown } from "@/components/ui/markdown";
import { Mermaid } from "./mermaid";
import { FolderTree } from "./folder-tree";
import { Chat } from "./chat";
import { formatNumber, timeAgo } from "@/lib/utils";

const TABS = [
  { id: "overview", label: "Overview", icon: Boxes },
  { id: "architecture", label: "Architecture", icon: Network },
  { id: "folders", label: "Folders", icon: FolderTreeIcon },
  { id: "stack", label: "Tech Stack", icon: Layers },
  { id: "deps", label: "Dependencies", icon: Package },
  { id: "quality", label: "Quality", icon: GaugeCircle },
  { id: "patterns", label: "Patterns", icon: Puzzle },
  { id: "roadmap", label: "Roadmap", icon: MapIcon },
  { id: "insights", label: "Insights", icon: Lightbulb },
  { id: "onboarding", label: "Onboarding", icon: BookOpen },
  { id: "chat", label: "Chat", icon: MessageSquareCode },
] as const;

const SEVERITY_TONE: Record<string, "info" | "low" | "medium" | "high"> = {
  info: "info",
  low: "low",
  medium: "medium",
  high: "high",
};

export function Dashboard({ data }: { data: FullAnalysis }) {
  const [tab, setTab] = useState<string>("overview");
  const { meta, tree, result } = data;
  const repo = `${meta.owner}/${meta.name}`;

  function downloadOnboarding() {
    const blob = new Blob([result.onboarding], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${meta.owner}-${meta.name}-onboarding.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-border/60 bg-bg/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-accent" />
            RepoMind<span className="text-accent">AI</span>
          </Link>
          <a
            href={meta.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-fg"
          >
            View on GitHub <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8">
        {/* Repo header */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-2xl font-semibold text-fg">{repo}</h1>
            {meta.primaryLanguage && <Badge tone="accent">{meta.primaryLanguage}</Badge>}
            <Badge tone="accent">{result.architectureStyle}</Badge>
          </div>
          {meta.description && <p className="mt-2 max-w-3xl text-muted">{meta.description}</p>}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Stars" value={<span className="flex items-center gap-1"><Star className="h-4 w-4 text-amber-400" />{formatNumber(meta.stars)}</span>} />
            <Stat label="Forks" value={<span className="flex items-center gap-1"><GitFork className="h-4 w-4" />{formatNumber(meta.forks)}</span>} />
            <Stat label="Watchers" value={<span className="flex items-center gap-1"><Eye className="h-4 w-4" />{formatNumber(meta.watchers)}</span>} />
            <Stat label="Open Issues" value={<span className="flex items-center gap-1"><CircleDot className="h-4 w-4" />{formatNumber(meta.openIssues)}</span>} />
            <Stat label="Files" value={tree.filter((t) => t.type === "file").length} />
            <Stat label="Age" value={`${Math.floor(meta.ageDays / 365)}y ${Math.floor((meta.ageDays % 365) / 30)}m`} />
          </div>
        </div>

        {/* Tabs */}
        <div className="sticky top-[53px] z-10 -mx-5 mb-6 overflow-x-auto border-b border-border bg-bg/80 px-5 backdrop-blur">
          <nav className="flex gap-1">
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-3 text-sm transition ${
                    active
                      ? "border-accent text-fg"
                      : "border-transparent text-muted hover:text-fg"
                  }`}
                >
                  <t.icon className="h-4 w-4" />
                  {t.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="animate-fade-up">
          {tab === "overview" && (
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="p-6 lg:col-span-2">
                <SectionTitle title="Repository Overview" icon={<Boxes className="h-5 w-5" />} />
                <Markdown>{result.overview}</Markdown>
              </Card>
              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="mb-4 font-semibold">Languages</h3>
                  <div className="space-y-3">
                    {meta.languages.slice(0, 6).map((l) => (
                      <div key={l.name}>
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="text-fg/80">{l.name}</span>
                          <span className="font-mono text-muted">{l.percent}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                          <div className="h-full rounded-full bg-accent" style={{ width: `${l.percent}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
                <Card className="p-6">
                  <h3 className="mb-3 font-semibold">Repository facts</h3>
                  <ul className="space-y-2.5 text-sm">
                    <li className="flex items-center gap-2 text-muted"><Calendar className="h-4 w-4" /> Created {timeAgo(meta.createdAt)}</li>
                    <li className="flex items-center gap-2 text-muted"><Calendar className="h-4 w-4" /> Last push {timeAgo(meta.pushedAt)}</li>
                    <li className="flex items-center gap-2 text-muted"><Scale className="h-4 w-4" /> {meta.license || "No license"}</li>
                    <li className="flex items-center gap-2 text-muted"><Package className="h-4 w-4" /> {meta.releasesCount} releases{meta.latestRelease ? ` · latest ${meta.latestRelease}` : ""}</li>
                  </ul>
                  {meta.topics.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {meta.topics.slice(0, 8).map((t) => (
                        <Badge key={t}>{t}</Badge>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          )}

          {tab === "architecture" && (
            <Card className="p-6">
              <SectionTitle
                title="Architecture"
                subtitle={result.architectureStyle}
                icon={<Network className="h-5 w-5" />}
              />
              <p className="mb-6 text-muted">{result.architectureSummary}</p>
              <div className="rounded-xl border border-border bg-surface-2/40 p-6">
                <Mermaid chart={result.mermaidDiagram} />
              </div>
            </Card>
          )}

          {tab === "folders" && (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="p-6">
                <SectionTitle title="Folder Structure" icon={<FolderTreeIcon className="h-5 w-5" />} />
                <FolderTree files={tree} />
              </Card>
              <div className="space-y-4">
                {result.folderInsights.map((f) => (
                  <Card key={f.path} className="p-5">
                    <div className="mb-2 font-mono text-sm text-accent">{f.path}</div>
                    <p className="text-sm text-fg/90">{f.purpose}</p>
                    <p className="mt-2 text-sm text-muted">{f.businessLogic}</p>
                    {f.keyFiles?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {f.keyFiles.map((k) => (
                          <span key={k} className="rounded bg-surface-2 px-2 py-0.5 font-mono text-xs text-muted">
                            {k}
                          </span>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {tab === "stack" && (
            <Card className="p-6">
              <SectionTitle title="Tech Stack" icon={<Layers className="h-5 w-5" />} />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {result.techStack.map((s, i) => (
                  <div key={i} className="rounded-lg border border-border bg-surface-2/40 p-4">
                    <Badge tone="accent" className="mb-2">{s.category}</Badge>
                    <div className="font-semibold text-fg">{s.name}</div>
                    <p className="mt-1 text-sm text-muted">{s.detail}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {tab === "deps" && (
            <Card className="overflow-hidden p-6">
              <SectionTitle title="Dependency Intelligence" icon={<Package className="h-5 w-5" />} />
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase text-muted">
                    <tr className="border-b border-border">
                      <th className="py-2 pr-4">Dependency</th>
                      <th className="py-2 pr-4">Manager</th>
                      <th className="py-2 pr-4">Purpose</th>
                      <th className="py-2 pr-4">Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.dependencies.map((d, i) => (
                      <tr key={i} className="border-b border-border/50 align-top">
                        <td className="py-3 pr-4 font-mono text-fg">{d.name}</td>
                        <td className="py-3 pr-4 text-muted">{d.manager}</td>
                        <td className="py-3 pr-4 text-muted">
                          {d.purpose}
                          {d.note && <span className="block text-xs text-muted/70">{d.note}</span>}
                        </td>
                        <td className="py-3 pr-4">
                          <Badge tone={d.risk === "unknown" ? "default" : (d.risk as "low" | "medium" | "high")}>
                            {d.risk}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {tab === "quality" && (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="p-6">
                <SectionTitle title="Quality Scores" subtitle="Heuristic estimates" icon={<GaugeCircle className="h-5 w-5" />} />
                <div className="space-y-5">
                  <ScoreBar label="Maintainability" value={result.quality.maintainabilityScore} />
                  <ScoreBar label="Test Coverage (est.)" value={result.quality.testCoverageEstimate} />
                  <ScoreBar label="Complexity" value={result.quality.complexityScore} invert />
                  <ScoreBar label="Technical Debt" value={result.quality.technicalDebtScore} invert />
                </div>
                <p className="mt-5 text-sm text-muted">{result.quality.summary}</p>
              </Card>
              <Card className="p-6">
                <h3 className="mb-4 font-semibold">Hotspots</h3>
                <div className="space-y-3">
                  {result.quality.hotspots.map((h, i) => (
                    <div key={i} className="rounded-lg border border-border bg-surface-2/40 p-4">
                      <div className="font-medium text-fg">{h.title}</div>
                      <p className="mt-1 text-sm text-muted">{h.detail}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {tab === "patterns" && (
            <div className="grid gap-4 sm:grid-cols-2">
              {result.designPatterns.map((p, i) => (
                <Card key={i} className="p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-fg">{p.pattern}</h3>
                    <Badge tone={p.confidence === "high" ? "low" : p.confidence === "medium" ? "medium" : "default"}>
                      {p.confidence} confidence
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted">{p.evidence}</p>
                  <div className="mt-2 font-mono text-xs text-accent">{p.location}</div>
                </Card>
              ))}
            </div>
          )}

          {tab === "roadmap" && (
            <div className="grid gap-6 lg:grid-cols-3">
              {([
                ["Beginner", result.roadmap.beginner, "low"],
                ["Intermediate", result.roadmap.intermediate, "medium"],
                ["Advanced", result.roadmap.advanced, "high"],
              ] as const).map(([title, steps, tone]) => (
                <Card key={title} className="p-6">
                  <Badge tone={tone}>{title}</Badge>
                  <ol className="mt-4 space-y-4">
                    {steps.map((s, i) => (
                      <li key={i} className="relative pl-6">
                        <span className="absolute left-0 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent/20 font-mono text-[10px] text-accent">
                          {i + 1}
                        </span>
                        <div className="font-medium text-fg">{s.title}</div>
                        <p className="mt-0.5 text-sm text-muted">{s.detail}</p>
                      </li>
                    ))}
                  </ol>
                </Card>
              ))}
            </div>
          )}

          {tab === "insights" && (
            <div className="space-y-3">
              {result.engineeringInsights.map((ins, i) => (
                <Card key={i} className="flex items-start gap-4 p-5">
                  <Badge tone={SEVERITY_TONE[ins.severity] ?? "info"} className="mt-0.5 shrink-0">
                    {ins.severity}
                  </Badge>
                  <div>
                    <div className="font-medium text-fg">{ins.title}</div>
                    <p className="mt-1 text-sm text-muted">{ins.detail}</p>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {tab === "onboarding" && (
            <Card className="p-6">
              <div className="mb-5 flex items-center justify-between">
                <SectionTitle title="Onboarding Guide" icon={<BookOpen className="h-5 w-5" />} />
                <button
                  onClick={downloadOnboarding}
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm transition hover:border-accent/40 hover:text-accent"
                >
                  <Download className="h-4 w-4" /> Export .md
                </button>
              </div>
              <Markdown>{result.onboarding}</Markdown>
            </Card>
          )}

          {tab === "chat" && <Chat analysisId={data.id} repo={repo} />}
        </div>
      </div>
    </main>
  );
}
