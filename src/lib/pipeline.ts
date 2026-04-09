/**
 * Research pipeline — 6 steps, optimised for speed and resilience.
 *
 * Full mode execution plan:
 *   Step 0  — scrape URL                          (no AI, 30s timeout)
 *   Step 1  — Competitor Analysis                 (Opus + thinking, 120s timeout)
 *   Steps 2+3 — Blue Ocean + Risk                 (Haiku, PARALLEL, 90s timeout each)
 *              ↳ each emits step_complete as soon as it individually resolves
 *   Step 4  — Executive Summary                   (Sonnet, 90s timeout)
 *   Step 5  — Porter's Five Forces                (Haiku, 90s timeout)
 *
 * Focused mode: only the selected category's steps run; others are instantly
 * marked skipped and emitted as step_complete with skipped:true.
 *
 * Every AI step uses runStepWithFallback — it NEVER throws, so a hung or
 * failed step returns partial data and the pipeline continues unblocked.
 */

import { runStructuredStep, runStepWithFallback, MODEL_OPUS, MODEL_SONNET, MODEL_HAIKU } from "./anthropic";
import { scrapeUrl, scrapeSucceeded, formatScrapedContent } from "./scraper";
import {
  STEP1_SYSTEM, STEP2_SYSTEM, STEP3_SYSTEM, STEP4_SYSTEM, STEP5_SYSTEM, STEP6_SYSTEM, STEP7_SYSTEM,
  step1UserPrompt, step2UserPrompt, step3UserPrompt, step4UserPrompt, step5UserPrompt, step6UserPrompt, step7UserPrompt,
} from "./prompts";
import type {
  ResearchReport,
  Step1CompetitorAnalysis, Step2BlueOcean, Step3RiskAnalysis,
  Step4ExecutiveSummary, Step5PorterAnalysis, Step6MarketingGapAnalysis, Step7ContentAssets,
  SSEEvent, ResearchRequest, FocusedCategory,
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

const FALLBACK_STEP5: Step5PorterAnalysis = {
  rivalry:      { name: "תחרות בין מתחרים קיימים", analysis: "הניתוח לא הושלם.", score: 5, keyFactors: [] },
  newEntrants:  { name: "איום של נכנסים חדשים",    analysis: "הניתוח לא הושלם.", score: 5, keyFactors: [] },
  supplierPower:{ name: "כוח המיקוח של ספקים",     analysis: "הניתוח לא הושלם.", score: 5, keyFactors: [] },
  buyerPower:   { name: "כוח המיקוח של קונים",     analysis: "הניתוח לא הושלם.", score: 5, keyFactors: [] },
  substitutes:  { name: "איום של תחליפים",          analysis: "הניתוח לא הושלם.", score: 5, keyFactors: [] },
  overallAttractivenessScore: 5,
  strategicImplication: "הניתוח לא הושלם — נסה שנית לקבלת תוצאות מלאות.",
};

const FALLBACK_STEP6: Step6MarketingGapAnalysis = {
  channelGaps: [],
  lowHangingFruits: [],
  biggestGap: "הניתוח לא הושלם. מומלץ לנסות שנית לקבלת תוצאות מלאות.",
  biggestOpportunity: "הניתוח לא הושלם — נסה שנית לקבלת תוצאות מלאות.",
  overallGapScore: 5,
};

const FALLBACK_STEP7: Step7ContentAssets = {
  adCopy: {
    headline: "הניתוח לא הושלם",
    subheadline: "נסה שנית לקבלת תוצאות מלאות",
    bodyText: "הניתוח לא הושלם. מומלץ לנסות שנית.",
    callToAction: "נסה שנית",
    platform: "both",
  },
  socialPosts: [],
  landingPageHeadline: {
    main: "הניתוח לא הושלם",
    sub: "מומלץ לנסות שנית לקבלת תוצאות מלאות",
    cta: "נסה שנית",
  },
  strategicAngle: "הניתוח לא הושלם — נסה שנית לקבלת תוצאות מלאות.",
};

// ─── Focused mode helpers ──────────────────────────────────────────────────────

/**
 * Returns true if the given pipeline step should be SKIPPED for a focused run.
 * Steps 0 and 1 always run (scrape + base analysis needed for context).
 */
function shouldSkip(stepId: number, category?: FocusedCategory): boolean {
  if (!category) return false;
  switch (category) {
    case "competitors": return stepId >= 2;                                                             // 0+1
    case "risk":        return stepId === 2 || stepId === 4 || stepId === 5 || stepId === 6 || stepId === 7; // 0+1+3
    case "porters":     return stepId === 2 || stepId === 3 || stepId === 4 || stepId === 6 || stepId === 7; // 0+1+5
    case "marketing":   return stepId === 2 || stepId === 3 || stepId === 4 || stepId === 5 || stepId === 7; // 0+1+6
    case "content":     return stepId === 2 || stepId === 3 || stepId === 4 || stepId === 5;                 // 0+1+6+7
    default:            return false;
  }
}

// ─── SSE helpers ──────────────────────────────────────────────────────────────

function encodeSSE(event: SSEEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

// ─── Pipeline ─────────────────────────────────────────────────────────────────

export async function runResearchPipeline(
  request: ResearchRequest,
  controller: ReadableStreamDefaultController<Uint8Array>,
): Promise<void> {
  const encoder = new TextEncoder();
  const send = (event: SSEEvent) =>
    controller.enqueue(encoder.encode(encodeSSE(event)));

  const { competitorUrl: url, additionalDetails: details } = request;
  const mode = request.mode ?? "full";
  const category = mode === "focused" ? request.focusedCategory : undefined;

  const reportId = crypto.randomUUID();
  const report: ResearchReport = {
    id: reportId,
    query: request,
    mode,
    focusedCategory: category,
    createdAt: Date.now(),
    steps: [
      { id: 0, nameEn: "סריקת נכסים דיגיטליים",           nameHe: "סריקת נכסים דיגיטליים",           status: "pending" },
      { id: 1, nameEn: "ניתוח מתחרים מעמיק",               nameHe: "ניתוח מתחרים מעמיק",               status: "pending" },
      { id: 2, nameEn: "אוקיינוס כחול (הזדמנויות בשוק)",   nameHe: "אוקיינוס כחול (הזדמנויות בשוק)",   status: "pending" },
      { id: 3, nameEn: "ניתוח סיכונים ואיומים",             nameHe: "ניתוח סיכונים ואיומים",             status: "pending" },
      { id: 4, nameEn: "סיכום מנהלים ותובנות",              nameHe: "סיכום מנהלים ותובנות",              status: "pending" },
      { id: 5, nameEn: "חמשת הכוחות של פורטר",             nameHe: "חמשת הכוחות של פורטר",             status: "pending" },
      { id: 6, nameEn: "ניתוח פערים שיווקי",               nameHe: "ניתוח פערים שיווקי",               status: "pending" },
      { id: 7, nameEn: "יצירת תוכן אסטרטגי",              nameHe: "יצירת תוכן אסטרטגי",              status: "pending" },
    ],
  };

  /** Instantly mark a step as skipped and emit step_complete */
  const skipStep = (id: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7) => {
    report.steps[id].status = "completed";
    report.steps[id].skipped = true;
    send({ type: "step_complete", stepId: id, skipped: true });
  };

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

    // ── Steps 2 + 3: PARALLEL — Haiku, 90s each (or skip) ───────────────────
    const skip2 = shouldSkip(2, category);
    const skip3 = shouldSkip(3, category);

    if (skip2) {
      skipStep(2);
    } else {
      report.steps[2].status = "running";
      report.steps[2].startedAt = Date.now();
      send({ type: "step_start", stepId: 2 });
    }

    if (skip3) {
      skipStep(3);
    } else {
      report.steps[3].status = "running";
      report.steps[3].startedAt = Date.now();
      send({ type: "step_start", stepId: 3 });
    }

    console.log(`[pipeline] Steps 2+3 — parallel Haiku (skip2=${skip2}, skip3=${skip3})`);

    const step2Promise = skip2
      ? Promise.resolve({ data: FALLBACK_STEP2, partial: true })
      : runStepWithFallback(
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

    const step3Promise = skip3
      ? Promise.resolve({ data: FALLBACK_STEP3, partial: true })
      : runStepWithFallback(
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

    const [step2Result, step3Result] = await Promise.all([step2Promise, step3Promise]);

    // ── Step 4: Executive Summary — Sonnet, 90s (or skip) ───────────────────
    if (shouldSkip(4, category)) {
      skipStep(4);
    } else {
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
    }

    // ── Step 5: Porter's Five Forces — Haiku, 90s (or skip) ─────────────────
    if (shouldSkip(5, category)) {
      skipStep(5);
    } else {
      report.steps[5].status = "running";
      report.steps[5].startedAt = Date.now();
      send({ type: "step_start", stepId: 5 });

      console.log(`[pipeline] Step 5 — Haiku Porter's Five Forces`);
      const step2Summary = JSON.stringify(step2Result.data, null, 2);
      const step3Summary = JSON.stringify(step3Result.data, null, 2);

      const { data: step5, partial: step5Partial } = await runStepWithFallback(
        () => runStructuredStep<Step5PorterAnalysis>(
          STEP5_SYSTEM,
          step5UserPrompt(url, step1Summary, step2Summary, step3Summary),
          MODEL_HAIKU,
          false,
        ),
        FALLBACK_STEP5,
        90_000,
        "Step 5 (Porter's Five Forces)",
      );

      report.step5 = step5;
      report.steps[5].status = "completed";
      report.steps[5].completedAt = Date.now();
      if (step5Partial) report.steps[5].partial = true;
      send({ type: "step_complete", stepId: 5, data: step5, partial: step5Partial });
      console.log(`[pipeline] Step 5 — done${step5Partial ? " (partial)" : ""}`);
    }

    // ── Step 6: Marketing Gap Analysis — Haiku, 90s (or skip) ───────────────
    let step6Data: Step6MarketingGapAnalysis = FALLBACK_STEP6;
    if (shouldSkip(6, category)) {
      skipStep(6);
    } else {
      report.steps[6].status = "running";
      report.steps[6].startedAt = Date.now();
      send({ type: "step_start", stepId: 6 });

      console.log(`[pipeline] Step 6 — Haiku Marketing Gap Analysis`);

      const { data: step6, partial: step6Partial } = await runStepWithFallback(
        () => runStructuredStep<Step6MarketingGapAnalysis>(
          STEP6_SYSTEM,
          step6UserPrompt(url, step1Summary),
          MODEL_HAIKU,
          false,
        ),
        FALLBACK_STEP6,
        90_000,
        "Step 6 (Marketing Gap)",
      );

      step6Data = step6;
      report.step6 = step6;
      report.steps[6].status = "completed";
      report.steps[6].completedAt = Date.now();
      if (step6Partial) report.steps[6].partial = true;
      send({ type: "step_complete", stepId: 6, data: step6, partial: step6Partial });
      console.log(`[pipeline] Step 6 — done${step6Partial ? " (partial)" : ""}`);
    }

    // ── Step 7: Strategic Content Generation — Sonnet, 90s (or skip) ────────
    if (shouldSkip(7, category)) {
      skipStep(7);
    } else {
      report.steps[7].status = "running";
      report.steps[7].startedAt = Date.now();
      send({ type: "step_start", stepId: 7 });

      console.log(`[pipeline] Step 7 — Sonnet Strategic Content Generation`);
      const step6Summary = JSON.stringify(step6Data, null, 2);

      const { data: step7, partial: step7Partial } = await runStepWithFallback(
        () => runStructuredStep<Step7ContentAssets>(
          STEP7_SYSTEM,
          step7UserPrompt(url, step1Summary, step6Summary),
          MODEL_SONNET,
          false,
        ),
        FALLBACK_STEP7,
        90_000,
        "Step 7 (Content Assets)",
      );

      report.step7 = step7;
      report.steps[7].status = "completed";
      report.steps[7].completedAt = Date.now();
      if (step7Partial) report.steps[7].partial = true;
      send({ type: "step_complete", stepId: 7, data: step7, partial: step7Partial });
      console.log(`[pipeline] Step 7 — done${step7Partial ? " (partial)" : ""}`);
    }

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
