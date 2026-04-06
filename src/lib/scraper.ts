/**
 * Web scraper for Step 0 of the research pipeline.
 * Uses Firecrawl if FIRECRAWL_API_KEY is set, otherwise native fetch.
 */

import type { ScrapedContent } from "@/types/research";

const FETCH_TIMEOUT_MS = 15_000;
const MAX_TEXT_LENGTH = 8_000;

// ─── Native Fetch Scraper ─────────────────────────────────────────────────────

function extractMeta(html: string, name: string): string | undefined {
  // Matches <meta name="..." content="..."> and <meta property="..." content="...">
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
  // Remove scripts, styles, and tags; collapse whitespace
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
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; MarketLensBot/1.0; +https://marketlens.ai/bot)",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "he,en;q=0.9",
      },
    });

    clearTimeout(timer);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }

    const html = await res.text();

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
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
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
    // Extract headings from markdown (## Heading lines)
    const headings = markdown
      .split("\n")
      .filter((l) => /^#{1,3}\s/.test(l))
      .map((l) => l.replace(/^#+\s+/, "").trim())
      .slice(0, 20);

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

export async function scrapeUrl(url: string): Promise<ScrapedContent> {
  if (process.env.FIRECRAWL_API_KEY) {
    return scrapeWithFirecrawl(url);
  }
  return scrapeWithFetch(url);
}

/**
 * Formats scraped content into a concise text block for AI prompts.
 */
export function formatScrapedContent(scraped: ScrapedContent): string {
  if (scraped.error && !scraped.mainText) {
    return `[שגיאה בסריקת האתר: ${scraped.error}. נא לנתח על סמך כתובת ה-URL בלבד: ${scraped.url}]`;
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
