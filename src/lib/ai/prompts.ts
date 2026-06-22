import type { RepoSnapshot } from "@/lib/github";
import type { FileNode } from "@/types/analysis";

/** Compress a recursive file tree into a token-efficient summary: per-directory
 *  file counts plus a representative sample of paths. Keeps the model grounded
 *  without blowing the context window on huge repos. */
export function summarizeTree(tree: FileNode[], maxPaths = 220): string {
  const files = tree.filter((t) => t.type === "file");
  const dirs = new Map<string, number>();
  for (const f of files) {
    const dir = f.path.includes("/") ? f.path.slice(0, f.path.lastIndexOf("/")) : "(root)";
    dirs.set(dir, (dirs.get(dir) ?? 0) + 1);
  }
  const dirLines = [...dirs.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 60)
    .map(([d, c]) => `  ${d}/  (${c} files)`)
    .join("\n");

  // Prioritize shallow, source-looking files for the sample.
  const sample = files
    .map((f) => f.path)
    .sort((a, b) => a.split("/").length - b.split("/").length || a.localeCompare(b))
    .slice(0, maxPaths)
    .join("\n");

  return `DIRECTORY OVERVIEW (top folders by file count):\n${dirLines}\n\nFILE SAMPLE (${Math.min(
    files.length,
    maxPaths,
  )} of ${files.length} files):\n${sample}`;
}

/** Build the compact, reusable context block describing the repository. Used
 *  both for the one-shot analysis and as RAG context for the chat assistant. */
export function buildRepoContext(snap: RepoSnapshot): string {
  const { meta } = snap;
  const langs = meta.languages
    .slice(0, 8)
    .map((l) => `${l.name} ${l.percent}%`)
    .join(", ");

  const signal = snap.signalFiles
    .map((f) => `\n----- FILE: ${f.path} -----\n${f.content}`)
    .join("\n");

  return `REPOSITORY: ${meta.fullName}
URL: ${meta.url}
DESCRIPTION: ${meta.description ?? "(none)"}
PRIMARY LANGUAGE: ${meta.primaryLanguage ?? "unknown"}
LANGUAGES: ${langs || "unknown"}
STARS: ${meta.stars} | FORKS: ${meta.forks} | TOPICS: ${meta.topics.join(", ") || "none"}
LICENSE: ${meta.license ?? "none"}

${summarizeTree(snap.tree)}

KEY FILES (manifests, configs, README):${signal || "\n(none found)"}`;
}

export const ANALYSIS_SYSTEM = `You are RepoMind, a principal software architect who reverse-engineers codebases for engineers who have never seen them. You are precise, evidence-based, and never invent files or dependencies that are not present in the provided context. When unsure, you say so rather than fabricate. You write for a developer audience: concrete, technical, free of marketing fluff.`;

const ANALYSIS_SCHEMA = `{
  "overview": "2-3 paragraph plain-English explanation of what this project is, who it's for, and how it's structured.",
  "architectureStyle": "one of: Layered | MVC | Microservices | Event-Driven | Hexagonal | Clean Architecture | Modular Monolith | Library/SDK | CLI Tool | Other",
  "architectureSummary": "1 paragraph justifying the architectureStyle from concrete evidence in the tree/files.",
  "mermaidDiagram": "valid Mermaid 'graph TD' source showing the main components and data flow. Use short node ids and quoted labels. 6-12 nodes. MUST be syntactically valid Mermaid.",
  "techStack": [{ "category": "Language|Framework|Database|Build|Testing|Infra|Other", "name": "string", "detail": "what it's used for here" }],
  "folderInsights": [{ "path": "src/api", "purpose": "string", "responsibility": "string", "keyFiles": ["..."], "businessLogic": "string" }],
  "dependencies": [{ "name": "string", "manager": "npm|maven|gradle|pip|poetry|cargo|go|composer|other", "purpose": "string", "risk": "low|medium|high|unknown", "note": "string" }],
  "designPatterns": [{ "pattern": "string", "confidence": "low|medium|high", "evidence": "string", "location": "string" }],
  "quality": { "complexityScore": 0, "maintainabilityScore": 0, "technicalDebtScore": 0, "testCoverageEstimate": 0, "summary": "string", "hotspots": [{ "title": "string", "detail": "string" }] },
  "roadmap": { "beginner": [{ "title": "string", "detail": "string" }], "intermediate": [...], "advanced": [...] },
  "engineeringInsights": [{ "title": "string", "detail": "string", "severity": "info|low|medium|high" }],
  "onboarding": "a complete onboarding guide in GitHub-flavored Markdown: project overview, prerequisites, setup steps, key modules, dev workflow, build & deploy, and how to contribute."
}`;

export function buildAnalysisPrompt(context: string): string {
  return `Analyze the repository below and produce a structured intelligence report.

${context}

INSTRUCTIONS:
- Base every claim on the evidence above. Do not invent files, dependencies, or frameworks.
- For scores, estimate honestly from what's visible (size, structure, presence of tests/CI). Note in the summary that scores are heuristic estimates.
- Provide 4-8 folderInsights for the most important directories, 5-12 dependencies, 3-8 designPatterns, and 3-5 steps in each roadmap tier.
- The mermaidDiagram MUST be valid Mermaid syntax (start with "graph TD").

Respond with ONLY a single JSON object matching EXACTLY this schema (no prose, no markdown fences):
${ANALYSIS_SCHEMA}`;
}

export function buildChatSystem(context: string): string {
  return `You are RepoMind's repository assistant. You answer developer questions about ONE specific repository using the context provided below. Ground every answer in this context. If the answer isn't determinable from the context, say what you can infer and what you'd need to read to be certain — never fabricate file paths or APIs. Be concise and use code-style formatting for file paths, commands, and identifiers.

=== REPOSITORY CONTEXT ===
${context}
=== END CONTEXT ===`;
}
