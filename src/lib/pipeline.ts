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
  STEP1_SYSTEM, STEP2_SYSTEM, STEP3_SYSTEM, STEP4_SYSTEM,
  STEP5_FORCE_SYSTEM, STEP5_IMPLICATION_SYSTEM,
  step5ForcePrompt, step5ImplicationPrompt,
  STEP6_SYSTEM, STEP7_SYSTEM,
  step1UserPrompt, step2UserPrompt, step3UserPrompt, step4UserPrompt,
  step6UserPrompt, step7UserPrompt,
} from "./prompts";
import type {
  ResearchReport,
  Step1CompetitorAnalysis, Step2BlueOcean, Step3RiskAnalysis,
  Step4ExecutiveSummary, Step5PorterAnalysis, PorterForce,
  Step6MarketingGapAnalysis, Step7ContentAssets,
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

const FALLBACK_FORCE: PorterForce = {
  name: "הניתוח לא הושלם",
  analysis: "הניתוח לא הושלם.",
  score: 5,
  keyFactors: [],
};

const FALLBACK_STEP5: Step5PorterAnalysis = {
  rivalry:      { ...FALLBACK_FORCE, name: "תחרות בין מתחרים קיימים" },
  newEntrants:  { ...FALLBACK_FORCE, name: "איום של נכנסים חדשים" },
  supplierPower:{ ...FALLBACK_FORCE, name: "כוח המיקוח של ספקים" },
  buyerPower:   { ...FALLBACK_FORCE, name: "כוח המיקוח של קונים" },
  substitutes:  { ...FALLBACK_FORCE, name: "איום של תחליפים" },
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

  // ── Heartbeat: prevents Vercel from closing the SSE connection during long
  //    AI steps. The browser ignores "heartbeat" events; the stream stays open.
  const heartbeatInterval = setInterval(() => {
    try { send({ type: "heartbeat" }); } catch { /* stream already closed */ }
  }, 15_000);

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

    // ── Step 5: Porter's Five Forces — 5 PARALLEL Haiku calls ──────────────
    // Running each force as a separate small call has two benefits:
    //  1. Each call finishes much faster (fewer tokens) → lower total latency.
    //  2. Progress events stream back as each force completes → keeps the
    //     Vercel SSE connection active and the UI progress bar moving.
    if (shouldSkip(5, category)) {
      skipStep(5);
    } else {
      report.steps[5].status = "running";
      report.steps[5].startedAt = Date.now();
      send({ type: "step_start", stepId: 5 });
      console.log(`[pipeline] Step 5 — 5 parallel Porter force calls (Haiku)`);

      const FORCE_CONFIGS = [
        { key: "rivalry"       as const, name: "תחרות בין מתחרים קיימים" },
        { key: "newEntrants"   as const, name: "איום של נכנסים חדשים" },
        { key: "supplierPower" as const, name: "כוח המיקוח של ספקים" },
        { key: "buyerPower"    as const, name: "כוח המיקוח של קונים" },
        { key: "substitutes"   as const, name: "איום של תחליפים" },
      ] as const;

      let completedForces = 0;

      const forcePromises = FORCE_CONFIGS.map((fc) =>
        runStepWithFallback(
          () => runStructuredStep<PorterForce>(
            STEP5_FORCE_SYSTEM,
            step5ForcePrompt(fc.name, fc.key, url, step1Summary),
            MODEL_HAIKU,
            false,
          ),
          { ...FALLBACK_FORCE, name: fc.name },
          45_000,
          `Step 5 (${fc.name})`,
        ).then(({ data, partial }) => {
          completedForces++;
          // Stream a progress tick immediately so the frontend sees activity
          send({ type: "step_progress", stepId: 5, message: `${fc.name} ✓ (${completedForces}/5)` });
          return { key: fc.key, data, partial };
        })
      );

      const forceResults = await Promise.all(forcePromises);

      // Build the forces object from results
      const forces = {
        rivalry:       forceResults[0].data,
        newEntrants:   forceResults[1].data,
        supplierPower: forceResults[2].data,
        buyerPower:    forceResults[3].data,
        substitutes:   forceResults[4].data,
      };

      // Overall score = average of 5 force scores
      const avgScore = Math.round(
        forceResults.reduce((sum, r) => sum + r.data.score, 0) / forceResults.length,
      );

      const anyForcePartial = forceResults.some((r) => r.partial);

      // Strategic implication — one quick Haiku call using all 5 force analyses
      const forcesSummary = forceResults
        .map((r) => `${r.data.name} (${r.data.score}/10): ${r.data.analysis}`)
        .join("\n");

      const { data: stratData } = await runStepWithFallback(
        () => runStructuredStep<{ strategicImplication: string }>(
          STEP5_IMPLICATION_SYSTEM,
          step5ImplicationPrompt(url, forcesSummary, avgScore),
          MODEL_HAIKU,
          false,
        ),
        { strategicImplication: "ניתוח הכוחות הושלם — ראה את הציונים הבודדים לתמונה האסטרטגית." },
        30_000,
        "Step 5 (Strategic Implication)",
      );

      const step5: Step5PorterAnalysis = {
        ...forces,
        overallAttractivenessScore: avgScore,
        strategicImplication: stratData.strategicImplication,
      };

      report.step5 = step5;
      report.steps[5].status = "completed";
      report.steps[5].completedAt = Date.now();
      if (anyForcePartial) report.steps[5].partial = true;
      send({ type: "step_complete", stepId: 5, data: step5, partial: anyForcePartial });
      console.log(`[pipeline] Step 5 — done (${forceResults.filter((r) => !r.partial).length}/5 forces full)`);
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
    clearInterval(heartbeatInterval);
    controller.close();
  }
}
