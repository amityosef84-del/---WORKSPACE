import Anthropic from "@anthropic-ai/sdk";

// Singleton client — reads ANTHROPIC_API_KEY from env
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/** Full reasoning model — best quality, used for Step 1 */
export const MODEL_OPUS = "claude-opus-4-6";

/** Fast, high-quality model — used for Step 4 synthesis */
export const MODEL_SONNET = "claude-sonnet-4-6";

/** Fastest model — used for parallel Steps 2 & 3 to minimise latency */
export const MODEL_HAIKU = "claude-haiku-4-5-20251001";

/**
 * Run a single LLM call and return parsed JSON.
 * Uses streaming to avoid HTTP timeouts on long outputs.
 */
export async function runStructuredStep<T>(
  systemPrompt: string,
  userPrompt: string,
  model: string = MODEL_OPUS,
  useThinking = true,
): Promise<T> {
  const stream = anthropic.messages.stream({
    model,
    max_tokens: 6000,
    ...(useThinking ? { thinking: { type: "adaptive" } } : {}),
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const message = await stream.finalMessage();

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text block found in LLM response");
  }

  const raw = textBlock.text.trim();
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

/**
 * Run an AI step with a hard timeout.
 * NEVER throws — resolves with either real data or the fallback value.
 * Returns { data, partial: true } when the fallback was used.
 */
export async function runStepWithFallback<T>(
  fn: () => Promise<T>,
  fallback: T,
  timeoutMs: number,
  stepName: string,
): Promise<{ data: T; partial: boolean }> {
  let settled = false;

  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        console.log(`[anthropic] ⏰ ${stepName} timed out after ${timeoutMs / 1000}s — using fallback`);
        resolve({ data: fallback, partial: true });
      }
    }, timeoutMs);

    fn()
      .then((data) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve({ data, partial: false });
        }
      })
      .catch((err: unknown) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          const msg = err instanceof Error ? err.message : String(err);
          console.log(`[anthropic] ❌ ${stepName} failed: ${msg} — using fallback`);
          resolve({ data: fallback, partial: true });
        }
      });
  });
}
