/**
 * The core 5-step research pipeline orchestrator.
 * Step 0 scrapes the competitor URL, then Steps 1-4 build progressively
 * richer context. Results are streamed via SSE as each step completes.
 *
 * Step 0 NEVER blocks the pipeline — if scraping fails the pipeline continues
 * with an AI-knowledge fallback and emits a scrape_warning event.
 */

import { runStructuredStep } from "./anthropic";
import { scrapeUrl, scrapeSucceeded, formatScrapedContent } from "./scraper";
import {
  STEP1_SYSTEM,
  STEP2_SYSTEM,
  STEP3_SYSTEM,
  STEP4_SYSTEM,
  step1UserPrompt,
  step2UserPrompt,
  step3UserPrompt,
  step4UserPrompt,
} from "./prompts";
import type {
  ResearchReport,
  Step1CompetitorAnalysis,
  Step2BlueOcean,
  Step3RiskAnalysis,
  Step4ExecutiveSummary,
  SSEEvent,
  ResearchRequest,
} from "@/types/research";

/** Emit a well-formed SSE data frame */
function encodeSSE(event: SSEEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

/**
 * Run the full 5-step pipeline and stream SSE events to the provided
 * ReadableStream controller. Resolves when the pipeline is complete.
 */
export async function runResearchPipeline(
  request: ResearchRequest,
  controller: ReadableStreamDefaultController<Uint8Array>,
): Promise<void> {
  const encoder = new TextEncoder();
  const send = (event: SSEEvent) =>
    controller.enqueue(encoder.encode(encodeSSE(event)));

  const reportId = crypto.randomUUID();
  const report: ResearchReport = {
    id: reportId,
    query: request,
    createdAt: Date.now(),
    steps: [
      { id: 0, nameEn: "סריקת אתר המתחרה",             nameHe: "סריקת אתר המתחרה",             status: "pending" },
      { id: 1, nameEn: "ניתוח מתחרים מעמיק",            nameHe: "ניתוח מתחרים מעמיק",            status: "pending" },
      { id: 2, nameEn: "אוקיינוס כחול (הזדמנויות בשוק)", nameHe: "אוקיינוס כחול (הזדמנויות בשוק)", status: "pending" },
      { id: 3, nameEn: "ניתוח סיכונים ואיומים",          nameHe: "ניתוח סיכונים ואיומים",          status: "pending" },
      { id: 4, nameEn: "סיכום מנהלים ותובנות",           nameHe: "סיכום מנהלים ותובנות",           status: "pending" },
    ],
  };

  const { competitorUrl: url, additionalDetails: details } = request;

  try {
    // ── Step 0: Scrape competitor URL (never blocks pipeline) ────────────────
    report.steps[0].status = "running";
    report.steps[0].startedAt = Date.now();
    send({ type: "step_start", stepId: 0 });

    console.log(`[pipeline] Step 0 — scraping ${url}`);
    const scraped = await scrapeUrl(url);
    const scrapeOk = scrapeSucceeded(scraped);

    report.steps[0].status = scrapeOk ? "completed" : "completed"; // always complete, never error
    report.steps[0].completedAt = Date.now();
    send({ type: "step_complete", stepId: 0 });

    if (!scrapeOk) {
      console.log(`[pipeline] Step 0 — scrape failed (${scraped.error}), continuing with AI-knowledge fallback`);
      send({
        type: "scrape_warning",
        error: scraped.error ?? "לא הצלחנו לסרוק את האתר",
      });
    } else {
      console.log(`[pipeline] Step 0 — scrape succeeded (${scraped.mainText.length} chars)`);
    }

    const scrapedContent = formatScrapedContent(scraped);

    // ── Step 1: Competitor Analysis (informed by scraped data or fallback) ───
    report.steps[1].status = "running";
    report.steps[1].startedAt = Date.now();
    send({ type: "step_start", stepId: 1 });

    console.log(`[pipeline] Step 1 — running competitor analysis`);
    const step1 = await runStructuredStep<Step1CompetitorAnalysis>(
      STEP1_SYSTEM,
      step1UserPrompt(url, scrapedContent, details, !scrapeOk),
    );

    report.step1 = step1;
    report.steps[1].status = "completed";
    report.steps[1].completedAt = Date.now();
    send({ type: "step_complete", stepId: 1, data: step1 });
    console.log(`[pipeline] Step 1 — complete`);

    // ── Step 2: Blue Ocean (informed by Step 1) ──────────────────────────────
    report.steps[2].status = "running";
    report.steps[2].startedAt = Date.now();
    send({ type: "step_start", stepId: 2 });

    console.log(`[pipeline] Step 2 — running blue ocean analysis`);
    const step1Summary = JSON.stringify(step1, null, 2);
    const step2 = await runStructuredStep<Step2BlueOcean>(
      STEP2_SYSTEM,
      step2UserPrompt(url, step1Summary),
    );

    report.step2 = step2;
    report.steps[2].status = "completed";
    report.steps[2].completedAt = Date.now();
    send({ type: "step_complete", stepId: 2, data: step2 });
    console.log(`[pipeline] Step 2 — complete`);

    // ── Step 3: Risk Analysis (informed by Steps 1 + 2) ──────────────────────
    report.steps[3].status = "running";
    report.steps[3].startedAt = Date.now();
    send({ type: "step_start", stepId: 3 });

    console.log(`[pipeline] Step 3 — running risk analysis`);
    const step2Summary = JSON.stringify(step2, null, 2);
    const step3 = await runStructuredStep<Step3RiskAnalysis>(
      STEP3_SYSTEM,
      step3UserPrompt(url, step1Summary, step2Summary),
    );

    report.step3 = step3;
    report.steps[3].status = "completed";
    report.steps[3].completedAt = Date.now();
    send({ type: "step_complete", stepId: 3, data: step3 });
    console.log(`[pipeline] Step 3 — complete`);

    // ── Step 4: Executive Summary (informed by Steps 1 + 2 + 3) ─────────────
    report.steps[4].status = "running";
    report.steps[4].startedAt = Date.now();
    send({ type: "step_start", stepId: 4 });

    console.log(`[pipeline] Step 4 — running executive summary`);
    const step3Summary = JSON.stringify(step3, null, 2);
    const step4 = await runStructuredStep<Step4ExecutiveSummary>(
      STEP4_SYSTEM,
      step4UserPrompt(url, step1Summary, step2Summary, step3Summary),
    );

    report.step4 = step4;
    report.steps[4].status = "completed";
    report.steps[4].completedAt = Date.now();
    send({ type: "step_complete", stepId: 4, data: step4 });
    console.log(`[pipeline] Step 4 — complete`);

    // ── Pipeline Complete ────────────────────────────────────────────────────
    console.log(`[pipeline] ✅ Pipeline complete for ${url}`);
    send({ type: "pipeline_complete", report });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`[pipeline] ❌ Pipeline error: ${message}`);
    const runningStep = report.steps.find((s) => s.status === "running");
    if (runningStep) {
      runningStep.status = "error";
      runningStep.error = message;
      send({ type: "step_error", stepId: runningStep.id, error: message });
    }
    send({ type: "pipeline_error", error: message });
  } finally {
    controller.close();
  }
}
