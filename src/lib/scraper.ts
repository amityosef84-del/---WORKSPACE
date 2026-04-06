/**
 * Web scraper for Step 0 of the research pipeline.
 * Uses Firecrawl if FIRECRAWL_API_KEY is set, otherwise native fetch.
 *
 * IMPORTANT: scrapeUrl() NEVER throws. It always returns a ScrapedContent,
 * possibly with an `error` field set. The pipeline must continue regardless.
 */

import type { ScrapedContent } from "@/types/research";

// Hard wall: abort everything after 30 seconds no matter what
const SCRAPE_TIMEOUT_MS = 30_000;
const MAX_TEXT_LENGTH = 8_000;

// ─── Native Fetch Scraper ─────────────────────────────────────────────────────

function extractMeta(html: string, name: string): string | undefined {
  const re = new RegExp(
    `<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["']`,
    "i",
  );
  const altRe = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${name}["']`,
    "i",
  );
  return (html.match(re) ?? html.match(altRe))?.[1]?.trim();
}

function extractTitle(html: string): string | undefined {
  return html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim();
}

function extractHeadings(html: string): string[] {
  const matches = [...html.matchAll(/<h[1-3][^>]*>([^<]+)<\/h[1-3]>/gi)];
  return matches
    .map((m) => m[1].trim())
    .filter(Boolean)
    .slice(0, 20);
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, MAX_TEXT_LENGTH);
}

async function scrapeWithFetch(url: string): Promise<ScrapedContent> {
  const controller = new AbortController();

  // BUG FIX: timer must stay active through res.text(), not just fetch().
  // We abort the controller, which cancels both the connection AND body reading.
  const timer = setTimeout(() => {
    console.log(`[scraper] ⏰ Timeout (${SCRAPE_TIMEOUT_MS}ms) reached — aborting fetch for ${url}`);
    controller.abort(new Error(`Scrape timed out after ${SCRAPE_TIMEOUT_MS / 1000}s`));
  }, SCRAPE_TIMEOUT_MS);

  try {
    console.log(`[scraper] 🌐 Starting fetch: ${url}`);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "he,en-US;q=0.9,en;q=0.8",
        "Accept-Encoding": "gzip, deflate",
        "Cache-Control": "no-cache",
      },
    });

    console.log(`[scraper] 📥 Headers received — HTTP ${res.status} for ${url}`);

    if (!res.ok) {
      clearTimeout(timer);
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }

    // NOTE: timer is still active — AbortController cancels body stream if it hangs
    console.log(`[scraper] 📖 Reading response body...`);
    const html = await res.text();
    clearTimeout(timer); // success — cancel the timeout

    console.log(`[scraper] ✅ Body received: ${html.length} chars from ${url}`);

    return {
      url,
      title: extractTitle(html),
      description:
        extractMeta(html, "description") ?? extractMeta(html, "og:description"),
      keywords: extractMeta(html, "keywords"),
      mainText: stripHtml(html),
      headings: extractHeadings(html),
      scrapedAt: Date.now(),
      method: "fetch",
    };
  } catch (err) {
    clearTimeout(timer);
    const message = err instanceof Error ? err.message : String(err);
    console.log(`[scraper] ❌ Fetch failed for ${url}: ${message}`);
    return {
      url,
      mainText: "",
      headings: [],
      scrapedAt: Date.now(),
      method: "fetch",
      error: message,
    };
  }
}

// ─── Firecrawl Scraper ────────────────────────────────────────────────────────

async function scrapeWithFirecrawl(url: string): Promise<ScrapedContent> {
  const apiKey = process.env.FIRECRAWL_API_KEY!;

  try {
    console.log(`[scraper] 🔥 Starting Firecrawl scrape: ${url}`);
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
      }),
      signal: AbortSignal.timeout(SCRAPE_TIMEOUT_MS),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      throw new Error(`Firecrawl API error ${res.status}: ${text}`);
    }

    const json = (await res.json()) as {
      success: boolean;
      data?: {
        markdown?: string;
        metadata?: {
          title?: string;
          description?: string;
          keywords?: string;
        };
      };
    };

    if (!json.success || !json.data) {
      throw new Error("Firecrawl returned no data");
    }

    const { markdown = "", metadata = {} } = json.data;
    const headings = markdown
      .split("\n")
      .filter((l) => /^#{1,3}\s/.test(l))
      .map((l) => l.replace(/^#+\s+/, "").trim())
      .slice(0, 20);

    console.log(`[scraper] ✅ Firecrawl success: ${markdown.length} chars from ${url}`);

    return {
      url,
      title: metadata.title,
      description: metadata.description,
      keywords: metadata.keywords,
      mainText: markdown.slice(0, MAX_TEXT_LENGTH),
      headings,
      scrapedAt: Date.now(),
      method: "firecrawl",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`[scraper] ❌ Firecrawl failed for ${url}: ${message}`);
    return {
      url,
      mainText: "",
      headings: [],
      scrapedAt: Date.now(),
      method: "firecrawl",
      error: message,
    };
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Scrape a URL. NEVER throws — returns ScrapedContent with error field on failure.
 */
export async function scrapeUrl(url: string): Promise<ScrapedContent> {
  if (process.env.FIRECRAWL_API_KEY) {
    return scrapeWithFirecrawl(url);
  }
  return scrapeWithFetch(url);
}

/**
 * Returns true if the scrape produced usable content.
 */
export function scrapeSucceeded(scraped: ScrapedContent): boolean {
  return !scraped.error && scraped.mainText.length > 50;
}

/**
 * Formats scraped content into a concise text block for AI prompts.
 */
export function formatScrapedContent(scraped: ScrapedContent): string {
  if (!scrapeSucceeded(scraped)) {
    return [
      `כתובת האתר: ${scraped.url}`,
      `[הערה: סריקת האתר נכשלה (${scraped.error ?? "אין תוכן"}). השתמש בידע הפנימי שלך על החברה/המוצר כדי לבצע את הניתוח.]`,
    ].join("\n\n");
  }

  const parts: string[] = [`כתובת האתר: ${scraped.url}`];

  if (scraped.title) parts.push(`כותרת האתר: ${scraped.title}`);
  if (scraped.description) parts.push(`תיאור: ${scraped.description}`);
  if (scraped.keywords) parts.push(`מילות מפתח: ${scraped.keywords}`);

  if (scraped.headings.length > 0) {
    parts.push(`כותרות עמודים:\n${scraped.headings.map((h) => `  • ${h}`).join("\n")}`);
  }

  if (scraped.mainText) {
    parts.push(`תוכן האתר:\n${scraped.mainText}`);
  }

  return parts.join("\n\n");
}
