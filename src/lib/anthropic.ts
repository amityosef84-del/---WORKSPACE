import Anthropic from "@anthropic-ai/sdk";

// Singleton client — reads ANTHROPIC_API_KEY from env
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const MODEL = "claude-opus-4-6";

/**
 * Run a single LLM call and return parsed JSON.
 * Uses streaming to avoid HTTP timeouts on long outputs.
 * Adaptive thinking is enabled so the model reasons deeply before answering.
 */
export async function runStructuredStep<T>(
  systemPrompt: string,
  userPrompt: string,
): Promise<T> {
  const stream = anthropic.messages.stream({
    model: MODEL,
    max_tokens: 8000,
    thinking: { type: "adaptive" },
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const message = await stream.finalMessage();

  // Extract the text block from the response (thinking blocks come first)
  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text block found in LLM response");
  }

  const raw = textBlock.text.trim();

  // Strip markdown code fences if the model wrapped the JSON
  const jsonText = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(jsonText) as T;
  } catch {
    throw new Error(`Failed to parse JSON from LLM response: ${jsonText.slice(0, 300)}`);
  }
}
