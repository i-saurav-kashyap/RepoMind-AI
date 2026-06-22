import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runAnalysis } from "@/lib/analyzer";
import { parseRepoUrl } from "@/lib/utils";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = body.url ? parseRepoUrl(body.url) : null;
  if (!parsed) {
    return NextResponse.json(
      { error: "Enter a valid GitHub URL, e.g. https://github.com/owner/repo" },
      { status: 400 },
    );
  }

  const { owner, name } = parsed;

  const analysis = await prisma.analysis.create({
    data: { repoUrl: `https://github.com/${owner}/${name}`, owner, name, status: "PENDING" },
  });

  // Kick the analysis off in the background (mirrors a BullMQ job). We do NOT
  // await it: the client receives the id immediately and polls for progress.
  runAnalysis(analysis.id, owner, name).catch((err) => {
    console.error(`[analyze] ${owner}/${name} failed:`, err?.message ?? err);
  });

  return NextResponse.json({ id: analysis.id });
}
