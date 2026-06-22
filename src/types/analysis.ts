// Shared shapes for a repository analysis. The `AnalysisResult` is what the AI
// layer produces and what the dashboard renders. Kept in one place so the
// backend, the prompt schema, and the UI never drift.

export interface RepoMeta {
  owner: string;
  name: string;
  fullName: string;
  url: string;
  description: string | null;
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  primaryLanguage: string | null;
  languages: { name: string; bytes: number; percent: number }[];
  license: string | null;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  ageDays: number;
  defaultBranch: string;
  topics: string[];
  contributorsCount: number;
  releasesCount: number;
  latestRelease: string | null;
}

export interface FileNode {
  path: string;
  type: "file" | "dir";
  size?: number;
}

export interface FolderInsight {
  path: string;
  purpose: string;
  responsibility: string;
  keyFiles: string[];
  businessLogic: string;
}

export interface TechStackItem {
  category: string; // e.g. "Language", "Framework", "Database", "Build"
  name: string;
  detail: string;
}

export interface DependencyInsight {
  name: string;
  manager: string; // npm | maven | pip | cargo ...
  purpose: string;
  risk: "low" | "medium" | "high" | "unknown";
  note: string;
}

export interface DesignPattern {
  pattern: string;
  confidence: "low" | "medium" | "high";
  evidence: string; // where/why it was detected
  location: string; // file or folder hint
}

export interface QualityReport {
  complexityScore: number; // 0-100 (lower is simpler)
  maintainabilityScore: number; // 0-100 (higher is better)
  technicalDebtScore: number; // 0-100 (lower is better)
  testCoverageEstimate: number; // 0-100
  summary: string;
  hotspots: { title: string; detail: string }[];
}

export interface RoadmapStep {
  title: string;
  detail: string;
}

export interface LearningRoadmap {
  beginner: RoadmapStep[];
  intermediate: RoadmapStep[];
  advanced: RoadmapStep[];
}

export interface EngineeringInsight {
  title: string;
  detail: string;
  severity: "info" | "low" | "medium" | "high";
}

export interface AnalysisResult {
  overview: string;
  architectureStyle: string;
  architectureSummary: string;
  mermaidDiagram: string; // mermaid source for the architecture diagram
  techStack: TechStackItem[];
  folderInsights: FolderInsight[];
  dependencies: DependencyInsight[];
  designPatterns: DesignPattern[];
  quality: QualityReport;
  roadmap: LearningRoadmap;
  engineeringInsights: EngineeringInsight[];
  onboarding: string; // markdown
}

export interface FullAnalysis {
  id: string;
  meta: RepoMeta;
  tree: FileNode[];
  result: AnalysisResult;
}
