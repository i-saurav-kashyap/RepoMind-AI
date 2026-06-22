import Anthropic from "@anthropic-ai/sdk";

// Thin provider abstraction. Today this wraps Anthropic Claude; the surface
// (complete / completeJSON / stream) is intentionally generic so an OpenAI or
// local-model backend can be dropped in without touching callers.

let _client: Anthropic | null = null;

function client(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Copy .env.example to .env and add your key.",
    );
  }
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

export const ANALYSIS_MODEL = process.env.ANALYSIS_MODEL || "claude-sonnet-4-6";
export const CHAT_MODEL = process.env.CHAT_MODEL || "claude-sonnet-4-6";

export interface CompleteOpts {
  system?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

/** Single-shot completion returning plain text. */
export async function complete(prompt: string, opts: CompleteOpts = {}): Promise<string> {
  const res = await client().messages.create({
    model: opts.model || ANALYSIS_MODEL,
    max_tokens: opts.maxTokens ?? 4096,
    temperature: opts.temperature ?? 0.3,
    system: opts.system,
    messages: [{ role: "user", content: prompt }],
  });
  return res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

/** Completion that must return a single JSON object. Strips markdown fences
 *  and throws a descriptive error if the model returns non-JSON. */
export async function completeJSON<T>(prompt: string, opts: CompleteOpts = {}): Promise<T> {
  const raw = await complete(prompt, { ...opts, maxTokens: opts.maxTokens ?? 8192 });
  return parseJSON<T>(raw);
}

export function parseJSON<T>(raw: string): T {
  let text = raw.trim();
  // Remove ```json ... ``` fences if present.
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) text = fence[1].trim();
  // Grab the outermost JSON object if there is surrounding prose.
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first !== -1 && last !== -1) text = text.slice(first, last + 1);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("AI returned malformed JSON. Try re-running the analysis.");
  }
}

/** Streaming chat used by the RAG assistant. Yields text deltas. */
export async function* streamChat(
  messages: { role: "user" | "assistant"; content: string }[],
  system: string,
  model = CHAT_MODEL,
): AsyncGenerator<string> {
  const stream = client().messages.stream({
    model,
    max_tokens: 2048,
    temperature: 0.4,
    system,
    messages,
  });
  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      yield event.delta.text;
    }
  }
}
