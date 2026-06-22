import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Dashboard } from "@/components/dashboard/dashboard";
import { AnalysisProgress } from "@/components/dashboard/progress";
import type { FullAnalysis } from "@/types/analysis";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await prisma.analysis.findUnique({ where: { id } }).catch(() => null);
  if (!a) return { title: "Analysis" };
  return {
    title: `${a.owner}/${a.name}`,
    description: a.description ?? `AI repository analysis of ${a.owner}/${a.name}.`,
  };
}

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const analysis = await prisma.analysis.findUnique({ where: { id } });
  if (!analysis) notFound();

  if (analysis.status !== "COMPLETED" || !analysis.result) {
    return (
      <AnalysisProgress
        id={analysis.id}
        initialStatus={analysis.status}
        repo={`${analysis.owner}/${analysis.name}`}
      />
    );
  }

  const payload = JSON.parse(analysis.result) as FullAnalysis & { _context?: string };
  delete payload._context;

  return <Dashboard data={payload} />;
}
