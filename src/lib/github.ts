import type { FileNode, RepoMeta } from "@/types/analysis";

const API = "https://api.github.com";

function headers(): HeadersInit {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "RepoMind-AI",
  };
  if (process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return h;
}

export class GitHubError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "GitHubError";
  }
}

async function gh<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { headers: headers(), cache: "no-store" });
  if (!res.ok) {
    if (res.status === 404) {
      const hint = process.env.GITHUB_TOKEN
        ? " Check the owner/name, or confirm your GITHUB_TOKEN has access to this repo."
        : " If this is a private repo, add a GITHUB_TOKEN (with `repo` scope) to your .env.";
      throw new GitHubError(`Repository not found or is private.${hint}`, 404);
    }
    if (res.status === 403)
      throw new GitHubError(
        "GitHub rate limit hit. Add a GITHUB_TOKEN to your .env to raise the limit.",
        403,
      );
    throw new GitHubError(`GitHub API error (${res.status}).`, res.status);
  }
  return res.json() as Promise<T>;
}

/** Files we always try to read in full because they carry the most signal. */
const SIGNAL_FILES = [
  "package.json",
  "pom.xml",
  "build.gradle",
  "build.gradle.kts",
  "requirements.txt",
  "pyproject.toml",
  "Cargo.toml",
  "go.mod",
  "composer.json",
  "Gemfile",
  "Dockerfile",
  "docker-compose.yml",
  "tsconfig.json",
  "README.md",
  "readme.md",
  "README.rst",
];

export interface RepoSnapshot {
  meta: RepoMeta;
  tree: FileNode[];
  signalFiles: { path: string; content: string }[];
  readme: string | null;
}

export async function fetchRepoSnapshot(owner: string, name: string): Promise<RepoSnapshot> {
  const repo = await gh<any>(`/repos/${owner}/${name}`);

  // Run independent calls in parallel.
  const [languagesRaw, contributors, releases, treeResp] = await Promise.all([
    gh<Record<string, number>>(`/repos/${owner}/${name}/languages`).catch(() => ({})),
    gh<any[]>(`/repos/${owner}/${name}/contributors?per_page=100&anon=true`).catch(() => []),
    gh<any[]>(`/repos/${owner}/${name}/releases?per_page=1`).catch(() => []),
    gh<{ tree: any[]; truncated: boolean }>(
      `/repos/${owner}/${name}/git/trees/${repo.default_branch}?recursive=1`,
    ).catch(() => ({ tree: [], truncated: false })),
  ]);

  const totalBytes = Object.values(languagesRaw).reduce((a, b) => a + b, 0) || 1;
  const languages = Object.entries(languagesRaw)
    .map(([n, bytes]) => ({ name: n, bytes, percent: Math.round((bytes / totalBytes) * 1000) / 10 }))
    .sort((a, b) => b.bytes - a.bytes);

  const tree: FileNode[] = (treeResp.tree || [])
    .filter((n) => n.type === "blob" || n.type === "tree")
    .map((n) => ({
      path: n.path as string,
      type: n.type === "tree" ? "dir" : "file",
      size: n.size,
    }));

  const meta: RepoMeta = {
    owner,
    name,
    fullName: repo.full_name,
    url: repo.html_url,
    description: repo.description,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    watchers: repo.subscribers_count ?? repo.watchers_count,
    openIssues: repo.open_issues_count,
    primaryLanguage: repo.language,
    languages,
    license: repo.license?.spdx_id ?? null,
    createdAt: repo.created_at,
    updatedAt: repo.updated_at,
    pushedAt: repo.pushed_at,
    ageDays: Math.floor((Date.now() - new Date(repo.created_at).getTime()) / 86400000),
    defaultBranch: repo.default_branch,
    topics: repo.topics ?? [],
    contributorsCount: contributors.length,
    releasesCount: releases.length,
    latestRelease: releases[0]?.tag_name ?? null,
  };

  // Fetch the high-signal files (package manifests, README, Dockerfile…).
  const present = new Set(tree.filter((t) => t.type === "file").map((t) => t.path));
  const wanted = SIGNAL_FILES.filter(
    (f) => present.has(f) || present.has(f.toLowerCase()),
  ).slice(0, 12);

  const signalFiles = (
    await Promise.all(
      wanted.map(async (path) => {
        const real = present.has(path) ? path : path.toLowerCase();
        const content = await fetchFileContent(owner, name, real, repo.default_branch).catch(
          () => null,
        );
        return content ? { path: real, content: content.slice(0, 16_000) } : null;
      }),
    )
  ).filter(Boolean) as { path: string; content: string }[];

  const readme = signalFiles.find((f) => /readme/i.test(f.path))?.content ?? null;

  return { meta, tree, signalFiles, readme };
}

export async function fetchFileContent(
  owner: string,
  name: string,
  path: string,
  ref: string,
): Promise<string | null> {
  const data = await gh<any>(
    `/repos/${owner}/${name}/contents/${encodeURIComponent(path)}?ref=${ref}`,
  );
  if (Array.isArray(data) || !data.content) return null;
  return Buffer.from(data.content, "base64").toString("utf-8");
}
