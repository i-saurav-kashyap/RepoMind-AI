import { NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { runAnalysis } from "@/lib/analyzer";
import { parseRepoUrl } from "@/lib/utils";

export const runtime = "nodejs";
// Vercel Hobby caps function duration at 60s. `after()` keeps the analysis
// running after the response is sent, within this window. Raise on Pro.
export const maxDuration = 60;

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

  // Kick the analysis off as a background task (mirrors a BullMQ job). `after()`
  // runs it once the response is sent AND keeps the serverless function alive
  // until it resolves — so the client gets the id immediately and polls for
  // progress, while the work actually completes on Vercel.
  after(async () => {
    try {
      await runAnalysis(analysis.id, owner, name);
    } catch (err) {
      console.error(`[analyze] ${owner}/${name} failed:`, (err as Error)?.message ?? err);
    }
  });

  return NextResponse.json({ id: analysis.id });
}
