import Link from "next/link";
import {
  Boxes,
  GitBranch,
  Network,
  ShieldCheck,
  Workflow,
  MessageSquareCode,
  GaugeCircle,
  Map,
  FolderTree,
  Puzzle,
  Sparkles,
  Star,
  GitFork,
} from "lucide-react";
import { AnalyzeForm } from "@/components/landing/analyze-form";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/primitives";
import { formatNumber, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

const FEATURES = [
  { icon: Boxes, title: "Repository Overview", desc: "Stars, forks, languages, commit cadence, releases — the whole picture at a glance." },
  { icon: FolderTree, title: "Folder Explorer", desc: "Every directory explained: purpose, responsibility, key files, and business logic." },
  { icon: Network, title: "Architecture Analyzer", desc: "Detects the architectural style and renders a live Mermaid component diagram." },
  { icon: GitBranch, title: "Dependency Intelligence", desc: "What each dependency does, why it's here, and where the risk hides." },
  { icon: GaugeCircle, title: "Code Quality Engine", desc: "Heuristic complexity, maintainability, tech-debt, and coverage scoring." },
  { icon: Puzzle, title: "Design Pattern Detection", desc: "Singleton, Factory, Observer, Repository, DI — spotted with evidence." },
  { icon: Map, title: "Learning Roadmap", desc: "Beginner → Intermediate → Advanced paths tailored to the codebase." },
  { icon: Workflow, title: "Onboarding Generator", desc: "A complete, exportable onboarding guide in Markdown." },
  { icon: MessageSquareCode, title: "AI Chat Assistant", desc: "Ask how auth works, where caching lives, how data flows — grounded in the repo." },
];

export default async function Home() {
  const recent = await prisma.analysis
    .findMany({
      where: { status: "COMPLETED" },
      orderBy: { createdAt: "desc" },
      take: 6,
    })
    .catch(() => []);

  return (
    <main className="min-h-screen">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-border/60 bg-bg/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Sparkles className="h-5 w-5 text-accent" />
            RepoMind<span className="text-accent">AI</span>
          </Link>
          <a
            href="#features"
            className="text-sm text-muted transition hover:text-fg"
          >
            Features
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-grid">
        <div className="mx-auto flex max-w-6xl flex-col items-center px-5 py-24 text-center md:py-32">
          <Badge tone="accent" className="mb-6 animate-fade-up">
            <Sparkles className="h-3 w-3" /> AI Repository Intelligence
          </Badge>
          <h1 className="max-w-4xl animate-fade-up text-4xl font-bold leading-tight tracking-tight md:text-6xl">
            Understand <span className="text-gradient">any codebase</span>
            <br /> in minutes, not weeks
          </h1>
          <p className="mt-5 max-w-2xl animate-fade-up text-lg text-muted">
            Paste a public GitHub repository. RepoMind clones it, reads it, and returns a full
            architectural breakdown, dependency analysis, onboarding guide, learning roadmap, and a
            repo-aware chat assistant.
          </p>
          <div className="mt-10 flex w-full animate-fade-up justify-center">
            <AnalyzeForm />
          </div>
        </div>
      </section>

      {/* Recent analyses */}
      {recent.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 pb-8">
          <h3 className="mb-4 text-sm font-medium uppercase tracking-wide text-muted">
            Recently analyzed
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((r) => (
              <Link
                key={r.id}
                href={`/r/${r.id}`}
                className="group rounded-xl border border-border bg-surface/60 p-4 transition hover:border-accent/40 hover:bg-surface"
              >
                <div className="flex items-center justify-between">
                  <span className="truncate font-mono text-sm text-fg">
                    {r.owner}/{r.name}
                  </span>
                  {r.primaryLang && <Badge>{r.primaryLang}</Badge>}
                </div>
                {r.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-muted">{r.description}</p>
                )}
                <div className="mt-3 flex items-center gap-4 text-xs text-muted">
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5" /> {formatNumber(r.stars)}
                  </span>
                  <span className="flex items-center gap-1">
                    <GitFork className="h-3.5 w-3.5" /> {formatNumber(r.forks)}
                  </span>
                  <span className="ml-auto">{timeAgo(r.createdAt.toISOString())}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-5 py-20">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Everything you need to ramp up fast</h2>
          <p className="mt-3 text-muted">
            Twelve intelligence modules, one repository URL.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-border bg-surface/50 p-6 transition hover:border-accent/30 hover:bg-surface"
            >
              <div className="mb-4 inline-flex rounded-lg bg-accent/10 p-2.5 text-accent">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-sm text-muted sm:flex-row">
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" /> RepoMind AI — portfolio demo
          </span>
          <span>Built with Next.js · Prisma · Claude</span>
        </div>
      </footer>
    </main>
  );
}
