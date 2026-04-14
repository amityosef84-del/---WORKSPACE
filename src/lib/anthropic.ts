import Anthropic from "@anthropic-ai/sdk";

// Singleton client — reads ANTHROPIC_API_KEY from env
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/** Full reasoning model — best quality, used for Step 1 */
export const MODEL_OPUS = "claude-opus-4-6";

/** Fast, high-quality model — used for Steps 4 & 7 synthesis */
export const MODEL_SONNET = "claude-sonnet-4-6";

/** Fastest model — used for parallel Steps 2, 3, 5, 6 */
export const MODEL_HAIKU = "claude-haiku-4-5-20251001";

// ─── Robust JSON extraction ───────────────────────────────────────────────────

/**
 * Locate the outermost JSON object `{...}` or array `[...]` inside `src`
 * using bracket-depth tracking (respects strings and escape sequences).
 *
 * Returns the extracted slice if a complete match is found, or everything
 * from the opening bracket to the end of the string when the JSON was
 * truncated (so the repair step can close it).
 */
function findOutermostJson(src: string): string | null {
  const brace   = src.indexOf("{");
  const bracket = src.indexOf("[");

  // choose whichever structural start appears first
  let open: string, close: string, start: number;
  if (brace === -1 && bracket === -1) return null;
  if (brace   === -1) { open = "["; close = "]"; start = bracket; }
  else if (bracket === -1 || brace <= bracket) { open = "{"; close = "}"; start = brace; }
  else                { open = "["; close = "]"; start = bracket; }

  let depth = 0, inString = false, escaped = false, end = -1;
  for (let i = start; i < src.length; i++) {
    const ch = src[i];
    if (escaped)                   { escaped = false; continue; }
    if (ch === "\\" && inString)   { escaped = true;  continue; }
    if (ch === '"')                { inString = !inString; continue; }
    if (inString)                  continue;
    if (ch === open)               depth++;
    if (ch === close) { if (--depth === 0) { end = i; break; } }
  }

  return end > -1 ? src.slice(start, end + 1) : src.slice(start); // complete or truncated
}

/**
 * Close unclosed brackets / strings left by a truncated LLM response.
 *
 * Algorithm:
 *  1. Walk the string tracking open { [ and open strings.
 *  2. After the walk, if a string was open, close it.
 *  3. Strip the last trailing comma (common before a closing bracket).
 *  4. Close brackets in LIFO order.
 */
function repairTruncated(json: string): string {
  const stack: string[] = [];
  let inStr = false, esc = false;

  for (const ch of json) {
    if (esc)                  { esc = false;  continue; }
    if (ch === "\\" && inStr) { esc = true;   continue; }
    if (ch === '"')           { inStr = !inStr; continue; }
    if (inStr)                continue;
    if (ch === "{")           stack.push("}");
    if (ch === "[")           stack.push("]");
    if (ch === "}" || ch === "]") stack.pop();
  }

  if (inStr) json += '"';                     // close unterminated string
  json = json.replace(/,\s*$/, "");           // strip trailing comma
  while (stack.length) json += stack.pop()!;  // close brackets LIFO
  return json;
}

/**
 * Extract and, if necessary, repair JSON from a raw LLM text output.
 *
 * Handles:
 *   - Markdown code fences (```json / ```JSON / ``` variants)
 *   - Prose before or after the JSON object
 *   - Trailing commas  →  `{ "a": 1, }`
 *   - Unquoted keys    →  `{ foo: "bar" }`
 *   - Truncated JSON   →  response cut off by max_tokens
 */
function extractAndRepairJson(raw: string): string {
  // ── 1. Strip markdown code fences ──────────────────────────────────────────
  let text = raw
    .replace(/^```(?:json|JSON)?\s*\n?/m, "")
    .replace(/\n?```\s*$/m, "")
    .trim();

  // ── 2. Locate the outermost JSON structure ──────────────────────────────────
  const candidate = findOutermostJson(text) ?? text;

  // ── 3. Try as-is ───────────────────────────────────────────────────────────
  try { JSON.parse(candidate); return candidate; } catch { /* fall through */ }

  // ── 4. Fix common surface-level issues ─────────────────────────────────────
  const patched = candidate
    .replace(/,(\s*[}\]])/g, "$1")            // trailing commas
    .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3'); // unquoted keys

  try { JSON.parse(patched); return patched; } catch { /* fall through */ }

  // ── 5. Repair truncated JSON (the most common production failure) ──────────
  const repaired = repairTruncated(patched);

  // Return whatever we have — caller will re-throw with a clean message if
  // even the repaired version can't parse.
  return repaired;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Run a single LLM call and return parsed JSON.
 *
 * Uses streaming internally so the HTTP connection never times out while the
 * model is generating. Waits for the full message before parsing.
 *
 * JSON extraction is fully robust: strips markdown fences, locates the
 * outermost object/array, fixes trailing commas, and auto-closes truncated
 * responses so a partial output never causes a hard crash.
 */
export async function runStructuredStep<T>(
  systemPrompt: string,
  userPrompt: string,
  model: string = MODEL_OPUS,
  useThinking = true,
  maxTokens = 8000,
): Promise<T> {
  const stream = anthropic.messages.stream({
    model,
    // Default 8 000 output tokens; creative steps (Step 7) can request more.
    max_tokens: maxTokens,
    ...(useThinking ? { thinking: { type: "adaptive" } } : {}),
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const message = await stream.finalMessage();

  // The SDK may return thinking + text blocks; we want the text block.
  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text block in LLM response");
  }

  const jsonText = extractAndRepairJson(textBlock.text.trim());

  try {
    return JSON.parse(jsonText) as T;
  } catch {
    // Include a short prefix of the raw output to help with debugging.
    const preview = textBlock.text.trim().slice(0, 400);
    throw new Error(`Failed to parse JSON from LLM response: ${preview}`);
  }
}

/**
 * Run an AI step with a hard timeout.
 *
 * NEVER throws — resolves with either real data or the provided fallback.
 * Returns `{ data, partial: true }` when the fallback was used.
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
