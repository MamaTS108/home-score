import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

/** Lazily-created singleton so importing this module never requires the key at build time. */
export function getAnthropicClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new AiConfigError(
        "ANTHROPIC_API_KEY is not set. Add it to your .env.local to enable room analysis, " +
          "renovation planning and the AI assistant. See .env.example."
      );
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

export const AI_TEXT_MODEL = "claude-sonnet-4-6";

export class AiConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiConfigError";
  }
}

/**
 * Sends a single-turn prompt expecting a strict JSON response, and parses it.
 * Strips markdown code fences defensively in case the model adds them.
 */
export async function callClaudeForJson<T>(params: {
  system: string;
  content: Anthropic.MessageParam["content"];
  maxTokens?: number;
}): Promise<T> {
  const anthropic = getAnthropicClient();

  const response = await anthropic.messages.create({
    model: AI_TEXT_MODEL,
    max_tokens: params.maxTokens ?? 2000,
    system: params.system,
    messages: [{ role: "user", content: params.content }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("AI response contained no text content.");
  }

  const cleaned = textBlock.text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "");

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error(`Failed to parse AI JSON response: ${cleaned.slice(0, 300)}`);
  }
}

/** Sends a single-turn prompt and returns plain text (used for the conversational assistant). */
export async function callClaudeForText(params: {
  system: string;
  messages: Anthropic.MessageParam[];
  maxTokens?: number;
}): Promise<string> {
  const anthropic = getAnthropicClient();

  const response = await anthropic.messages.create({
    model: AI_TEXT_MODEL,
    max_tokens: params.maxTokens ?? 800,
    system: params.system,
    messages: params.messages,
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("AI response contained no text content.");
  }
  return textBlock.text.trim();
}
