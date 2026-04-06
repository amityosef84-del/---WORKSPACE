import Anthropic from "@anthropic-ai/sdk";

// Singleton client — reads ANTHROPIC_API_KEY from env
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/** Full reasoning model — best quality, used for Steps 1 & 4 */
export const MODEL_OPUS = "claude-opus-4-6";

/** Fast, high-quality model — used for parallel intermediate Steps 2 & 3 */
export const MODEL_SONNET = "claude-sonnet-4-6";

/**
 * Run a single LLM call and return parsed JSON.
 * Uses streaming to avoid HTTP timeouts on long outputs.
 *
 * @param model  Which model to use. Defaults to Opus (slower, deeper reasoning).
 *               Pass MODEL_SONNET for intermediate steps that run in parallel.
 * @param useThinking  Enable adaptive thinking. Only use with Opus/Sonnet 4+.
 *                     Disable for faster intermediate steps.
 */
export async function runStructuredStep<T>(
  systemPrompt: string,
  userPrompt: string,
  model: string = MODEL_OPUS,
  useThinking = true,
): Promise<T> {
  const stream = anthropic.messages.stream({
    model,
    max_tokens: 8000,
    ...(useThinking ? { thinking: { type: "adaptive" } } : {}),
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
