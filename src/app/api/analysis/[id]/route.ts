import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const analysis = await prisma.analysis.findUnique({ where: { id } });
  if (!analysis) return NextResponse.json({ error: "Not found." }, { status: 404 });

  // While running, return just the lightweight status for polling.
  if (analysis.status !== "COMPLETED") {
    return NextResponse.json({
      id: analysis.id,
      status: analysis.status,
      error: analysis.error,
      owner: analysis.owner,
      name: analysis.name,
    });
  }

  // The stored payload includes a private _context used only by the chat
  // assistant — strip it before sending to the client.
  const payload = analysis.result ? JSON.parse(analysis.result) : null;
  if (payload) delete payload._context;

  return NextResponse.json({ id: analysis.id, status: analysis.status, payload });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.analysis.delete({ where: { id } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
