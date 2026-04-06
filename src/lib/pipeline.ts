/**
 * Research pipeline — 5 steps, optimised for speed and resilience.
 *
 * Execution plan:
 *   Step 0  — scrape URL                          (no AI, 30s timeout)
 *   Step 1  — Competitor Analysis                 (Opus + thinking, 120s timeout)
 *   Steps 2+3 — Blue Ocean + Risk                 (Haiku, PARALLEL, 90s timeout each)
 *              ↳ each emits step_complete as soon as it individually resolves
 *   Step 4  — Executive Summary                   (Sonnet, 90s timeout)
 *
 * Every AI step uses runStepWithFallback — it NEVER throws, so a hung or
 * failed step returns partial data and the pipeline continues unblocked.
 */

import { runStructuredStep, runStepWithFallback, MODEL_OPUS, MODEL_SONNET, MODEL_HAIKU } from "./anthropic";
import { scrapeUrl, scrapeSucceeded, formatScrapedContent } from "./scraper";
import {
  STEP1_SYSTEM, STEP2_SYSTEM, STEP3_SYSTEM, STEP4_SYSTEM,
  step1UserPrompt, step2UserPrompt, step3UserPrompt, step4UserPrompt,
} from "./prompts";
import type {
  ResearchReport,
  Step1CompetitorAnalysis, Step2BlueOcean, Step3RiskAnalysis, Step4ExecutiveSummary,
  SSEEvent, ResearchRequest,
} from "@/types/research";

// ─── Fallback data (used when a step times out or errors) ─────────────────────

const FALLBACK_STEP2: Step2BlueOcean = {
  analysis: {
    unmetNeeds: [],
    trendOpportunities: [],
    whitespaceInsights: "הניתוח לא הושלם. מומלץ לנסות שנית לקבלת תוצאות מלאות.",
    opportunityScore: 5,
  },
  topOpportunity: "הניתוח לא הושלם — נסה שנית.",
};

const FALLBACK_STEP3: Step3RiskAnalysis = {
  technologicalDisruptions: [],
  consumerAlternatives: [],
  marketStabilityRisks: [],
  overallRiskLevel: "medium",
  riskSummary: "הניתוח לא הושלם. מומלץ לנסות שנית לקבלת תוצאות מלאות.",
};

const FALLBACK_STEP4: Step4ExecutiveSummary = {
  audienceMap: [],
  competitorSquad: { titans: [], upAndComers: [] },
  blueOceanERRC: {
    eliminate: [], reduce: [], raise: [], create: [],
    blueOceanStatement: "הניתוח לא הושלם. מומלץ לנסות שנית.",
  },
  swotMatrix: {
    strengths: [], weaknesses: [], opportunities: [], threats: [],
    actNow: [], avoid: [],
  },
  executiveOneLiner: "הניתוח לא הושלם — נסה שנית לקבלת תוצאות מלאות.",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function encodeSSE(event: SSEEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

// ─── Pipeline ────────────────────────────────────────────────────────────────

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
      { id: 0, nameEn: "סריקת נכסים דיגיטליים",           nameHe: "סריקת נכסים דיגיטליים",           status: "pending" },
      { id: 1, nameEn: "ניתוח מתחרים מעמיק",               nameHe: "ניתוח מתחרים מעמיק",               status: "pending" },
      { id: 2, nameEn: "אוקיינוס כחול (הזדמנויות בשוק)",   nameHe: "אוקיינוס כחול (הזדמנויות בשוק)",   status: "pending" },
      { id: 3, nameEn: "ניתוח סיכונים ואיומים",             nameHe: "ניתוח סיכונים ואיומים",             status: "pending" },
      { id: 4, nameEn: "סיכום מנהלים ותובנות",              nameHe: "סיכום מנהלים ותובנות",              status: "pending" },
    ],
  };

  const { competitorUrl: url, additionalDetails: details } = request;

  try {
    // ── Step 0: Scrape ───────────────────────────────────────────────────────
    report.steps[0].status = "running";
    report.steps[0].startedAt = Date.now();
    send({ type: "step_start", stepId: 0 });

    console.log(`[pipeline] Step 0 — scraping ${url}`);
    const scraped = await scrapeUrl(url);
    const scrapeOk = scrapeSucceeded(scraped);

    report.steps[0].status = "completed";
    report.steps[0].completedAt = Date.now();
    send({ type: "step_complete", stepId: 0 });

    if (!scrapeOk) {
      console.log(`[pipeline] Step 0 — fallback (${scraped.error})`);
      send({ type: "scrape_warning", error: scraped.error ?? "לא הצלחנו לסרוק את האתר" });
    }
    const scrapedContent = formatScrapedContent(scraped);

    // ── Step 1: Competitor Analysis — Opus + thinking, 120s ─────────────────
    report.steps[1].status = "running";
    report.steps[1].startedAt = Date.now();
    send({ type: "step_start", stepId: 1 });

    console.log(`[pipeline] Step 1 — Opus competitor analysis`);
    const step1 = await runStructuredStep<Step1CompetitorAnalysis>(
      STEP1_SYSTEM,
      step1UserPrompt(url, scrapedContent, details, !scrapeOk),
      MODEL_OPUS,
      true,
    );
    report.step1 = step1;
    report.steps[1].status = "completed";
    report.steps[1].completedAt = Date.now();
    send({ type: "step_complete", stepId: 1, data: step1 });
    console.log(`[pipeline] Step 1 — done`);

    const step1Summary = JSON.stringify(step1, null, 2);

    // ── Steps 2 + 3: PARALLEL — Haiku, 90s each ─────────────────────────────
    // Critical: each step emits its own step_complete the moment it resolves,
    // even while the other is still running. The UI updates immediately.
    report.steps[2].status = "running";
    report.steps[2].startedAt = Date.now();
    report.steps[3].status = "running";
    report.steps[3].startedAt = Date.now();
    send({ type: "step_start", stepId: 2 });
    send({ type: "step_start", stepId: 3 });

    console.log(`[pipeline] Steps 2+3 — parallel Haiku`);

    // Wrap each step so it emits its own SSE event when done, independently
    const step2Promise = runStepWithFallback(
      () => runStructuredStep<Step2BlueOcean>(
        STEP2_SYSTEM, step2UserPrompt(url, step1Summary), MODEL_HAIKU, false,
      ),
      FALLBACK_STEP2,
      90_000,
      "Step 2 (Blue Ocean)",
    ).then(({ data, partial }) => {
      report.step2 = data;
      report.steps[2].status = "completed";
      report.steps[2].completedAt = Date.now();
      if (partial) report.steps[2].partial = true;
      send({ type: "step_complete", stepId: 2, data, partial });
      console.log(`[pipeline] Step 2 — done${partial ? " (partial)" : ""}`);
      return { data, partial };
    });

    const step3Promise = runStepWithFallback(
      () => runStructuredStep<Step3RiskAnalysis>(
        STEP3_SYSTEM, step3UserPrompt(url, step1Summary), MODEL_HAIKU, false,
      ),
      FALLBACK_STEP3,
      90_000,
      "Step 3 (Risk)",
    ).then(({ data, partial }) => {
      report.step3 = data;
      report.steps[3].status = "completed";
      report.steps[3].completedAt = Date.now();
      if (partial) report.steps[3].partial = true;
      send({ type: "step_complete", stepId: 3, data, partial });
      console.log(`[pipeline] Step 3 — done${partial ? " (partial)" : ""}`);
      return { data, partial };
    });

    // Wait for both — each has already resolved independently above
    const [step2Result, step3Result] = await Promise.all([step2Promise, step3Promise]);

    // ── Step 4: Executive Summary — Sonnet, 90s ──────────────────────────────
    report.steps[4].status = "running";
    report.steps[4].startedAt = Date.now();
    send({ type: "step_start", stepId: 4 });

    console.log(`[pipeline] Step 4 — Sonnet executive summary`);
    const step2Summary = JSON.stringify(step2Result.data, null, 2);
    const step3Summary = JSON.stringify(step3Result.data, null, 2);

    const { data: step4, partial: step4Partial } = await runStepWithFallback(
      () => runStructuredStep<Step4ExecutiveSummary>(
        STEP4_SYSTEM,
        step4UserPrompt(url, step1Summary, step2Summary, step3Summary),
        MODEL_SONNET,
        false,
      ),
      FALLBACK_STEP4,
      90_000,
      "Step 4 (Executive Summary)",
    );

    report.step4 = step4;
    report.steps[4].status = "completed";
    report.steps[4].completedAt = Date.now();
    if (step4Partial) report.steps[4].partial = true;
    send({ type: "step_complete", stepId: 4, data: step4, partial: step4Partial });
    console.log(`[pipeline] Step 4 — done${step4Partial ? " (partial)" : ""}`);

    console.log(`[pipeline] ✅ Complete for ${url}`);
    send({ type: "pipeline_complete", report });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`[pipeline] ❌ Unexpected error: ${message}`);
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
