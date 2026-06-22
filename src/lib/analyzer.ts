import { fetchRepoSnapshot, type RepoSnapshot } from "@/lib/github";
import { buildAnalysisPrompt, buildRepoContext, ANALYSIS_SYSTEM } from "@/lib/ai/prompts";
import { completeJSON } from "@/lib/ai/provider";
import { prisma } from "@/lib/prisma";
import type { AnalysisResult } from "@/types/analysis";

/**
 * Orchestrates a full analysis run for one Analysis row. This is the unit of
 * work that, in the production architecture, a BullMQ worker would execute.
 * Here it runs inline within the request that creates the analysis. It updates
 * the row's status as it progresses so the UI can poll.
 */
export async function runAnalysis(analysisId: string, owner: string, name: string): Promise<void> {
  try {
    await prisma.analysis.update({
      where: { id: analysisId },
      data: { status: "CLONING" },
    });

    const snapshot = await fetchRepoSnapshot(owner, name);

    await prisma.analysis.update({
      where: { id: analysisId },
      data: {
        status: "ANALYZING",
        description: snapshot.meta.description,
        stars: snapshot.meta.stars,
        forks: snapshot.meta.forks,
        primaryLang: snapshot.meta.primaryLanguage,
        fileCount: snapshot.tree.filter((t) => t.type === "file").length,
      },
    });

    const context = buildRepoContext(snapshot);
    const result = await completeJSON<AnalysisResult>(buildAnalysisPrompt(context), {
      system: ANALYSIS_SYSTEM,
      maxTokens: 8192,
    });

    const payload = {
      id: analysisId,
      meta: snapshot.meta,
      tree: snapshot.tree,
      result,
      // Persist the compact context so the chat assistant can reuse it without
      // re-hitting the GitHub API on every message.
      _context: context,
    };

    await prisma.analysis.update({
      where: { id: analysisId },
      data: { status: "COMPLETED", result: JSON.stringify(payload) },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown analysis error.";
    await prisma.analysis.update({
      where: { id: analysisId },
      data: { status: "FAILED", error: message },
    });
    throw err;
  }
}

export type { RepoSnapshot };
