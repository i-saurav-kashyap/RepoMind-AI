import { prisma } from "@/lib/prisma";
import { streamChat } from "@/lib/ai/provider";
import { buildChatSystem } from "@/lib/ai/prompts";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const { analysisId, message } = (await req.json()) as {
    analysisId?: string;
    message?: string;
  };

  if (!analysisId || !message?.trim()) {
    return new Response("Missing analysisId or message.", { status: 400 });
  }

  const analysis = await prisma.analysis.findUnique({ where: { id: analysisId } });
  if (!analysis || analysis.status !== "COMPLETED" || !analysis.result) {
    return new Response("Analysis not ready.", { status: 409 });
  }

  const payload = JSON.parse(analysis.result);
  const context: string = payload._context ?? "";

  // Load prior turns for continuity.
  const history = await prisma.chatMessage.findMany({
    where: { analysisId },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  const messages = [
    ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user" as const, content: message },
  ];

  // Persist the user's message immediately.
  await prisma.chatMessage.create({
    data: { analysisId, role: "user", content: message },
  });

  const encoder = new TextEncoder();
  let assistantText = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const delta of streamChat(messages, buildChatSystem(context))) {
          assistantText += delta;
          controller.enqueue(encoder.encode(delta));
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Chat failed.";
        controller.enqueue(encoder.encode(`\n\n_⚠️ ${msg}_`));
      } finally {
        if (assistantText) {
          await prisma.chatMessage.create({
            data: { analysisId, role: "assistant", content: assistantText },
          });
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
  });
}
