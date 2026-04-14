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
  STEP1_SYSTEM, STEP2_SYSTEM, STEP3_SYSTEM,
  STEP4_AUDIENCE_SYSTEM, STEP4_SQUAD_SYSTEM, STEP4_ERRC_SYSTEM, STEP4_SWOT_SYSTEM,
  step4AudiencePrompt, step4SquadPrompt, step4ErrcPrompt, step4SwotPrompt,
  STEP5_FORCE_SYSTEM, STEP5_IMPLICATION_SYSTEM,
  step5ForcePrompt, step5ImplicationPrompt,
  STEP6_CHANNELS_SYSTEM, STEP6_INSIGHTS_SYSTEM,
  step6ChannelsPrompt, step6InsightsPrompt,
  STEP7_ADCOPY_SYSTEM, STEP7_LANDING_SYSTEM, STEP7_SOCIAL_SYSTEM,
  step7AdCopyPrompt, step7LandingPrompt, step7SocialPrompt,
  step1UserPrompt, step2UserPrompt, step3UserPrompt,
} from "./prompts";
import type {
  ResearchReport,
  Step1CompetitorAnalysis, Step2BlueOcean, Step3RiskAnalysis,
  Step4ExecutiveSummary, AudienceSegment, CompetitorSquad, ERRCGrid, SWOTOpportunityMatrix,
  Step5PorterAnalysis, PorterForce,
  Step6MarketingGapAnalysis, MarketingChannelGap,
  Step7ContentAssets, SocialPostIdea,
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

// ─── Context trimmer ──────────────────────────────────────────────────────────

/**
 * Extract only the fields each Step 4 sub-call actually needs.
 * Step 1 (Opus output) is often 3–4 K tokens of JSON; this trims it to
 * ~600 tokens so parallel Haiku calls finish quickly.
 */
function slimStep1(step1: Step1CompetitorAnalysis): string {
  try {
    return JSON.stringify({
      userProfile: step1.userProfile ? {
        name: step1.userProfile.name ?? "",
        positioning: step1.userProfile.identityAndNarrative?.positioning ?? "",
        brandVoice: step1.userProfile.identityAndNarrative?.brandVoice ?? "",
        keyFocusPoints: step1.userProfile.offer?.keyFocusPoints ?? [],
        pricingModels: step1.userProfile.offer?.pricingModels ?? [],
        distributionChannels: step1.userProfile.marketingAndTraffic?.distributionChannels ?? [],
        targetAudience: step1.userProfile.targetAudience?.demographics ?? "",
        psychographics: step1.userProfile.targetAudience?.psychographics ?? "",
      } : undefined,
      competitors: (step1.competitors ?? []).map((c) => ({
        name: c.name ?? "",
        positioning: c.identityAndNarrative?.positioning ?? "",
        keyFocusPoints: c.offer?.keyFocusPoints ?? [],
        pricingModels: c.offer?.pricingModels ?? [],
        distributionChannels: c.marketingAndTraffic?.distributionChannels ?? [],
        targetAudience: c.targetAudience?.demographics ?? "",
      })),
      indirectCompetitors: (step1.indirectCompetitors ?? []).map((c) => ({
        name: c.name ?? "", threatLevel: c.threatLevel,
      })),
      marketOverview: step1.marketOverview ?? "",
    });
  } catch {
    // Nuclear fallback — if any field access still fails, return minimal safe context
    return JSON.stringify({
      marketOverview: step1.marketOverview ?? "",
      competitors: (step1.competitors ?? []).map((c) => ({ name: c.name ?? "" })),
    });
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

    // ── Step 4: Executive Summary — 4 PARALLEL Haiku calls ─────────────────
    // Audience map | Competitor Squad | ERRC | SWOT+OneLiner
    // Each call gets only the slim subset of step1 it needs (~600 tokens vs
    // 4K for the full JSON), so all 4 finish in ~15-20s instead of 90s.
    if (shouldSkip(4, category)) {
      skipStep(4);
    } else {
      report.steps[4].status = "running";
      report.steps[4].startedAt = Date.now();
      send({ type: "step_start", stepId: 4 });
      console.log(`[pipeline] Step 4 — 4 parallel Haiku calls (audience+squad+ERRC+SWOT)`);

      // Build slim context once — shared by all 4 sub-calls
      const slimCtx = step1 ? slimStep1(step1) : step1Summary;
      const topOpportunity = step2Result.data.topOpportunity ?? "לא זוהתה";
      const riskSummary    = step3Result.data.riskSummary    ?? "לא זוהה";

      let completedParts = 0;

      const [audienceResult, squadResult, errcResult, swotResult] = await Promise.all([

        // Call A: audience map
        runStepWithFallback(
          () => runStructuredStep<{ audienceMap: AudienceSegment[] }>(
            STEP4_AUDIENCE_SYSTEM,
            step4AudiencePrompt(url, slimCtx),
            MODEL_HAIKU, false,
          ),
          { audienceMap: FALLBACK_STEP4.audienceMap },
          45_000, "Step 4A (Audience Map)",
        ).then(({ data, partial }) => {
          completedParts++;
          send({ type: "step_progress", stepId: 4, message: `מפת קהל ✓ (${completedParts}/4)` });
          return { data, partial };
        }),

        // Call B: competitor squad
        runStepWithFallback(
          () => runStructuredStep<{ competitorSquad: CompetitorSquad }>(
            STEP4_SQUAD_SYSTEM,
            step4SquadPrompt(url, slimCtx),
            MODEL_HAIKU, false,
          ),
          { competitorSquad: FALLBACK_STEP4.competitorSquad },
          45_000, "Step 4B (Competitor Squad)",
        ).then(({ data, partial }) => {
          completedParts++;
          send({ type: "step_progress", stepId: 4, message: `מפת מתחרים ✓ (${completedParts}/4)` });
          return { data, partial };
        }),

        // Call C: blue ocean ERRC
        runStepWithFallback(
          () => runStructuredStep<{ blueOceanERRC: ERRCGrid }>(
            STEP4_ERRC_SYSTEM,
            step4ErrcPrompt(url, slimCtx, topOpportunity),
            MODEL_HAIKU, false,
          ),
          { blueOceanERRC: FALLBACK_STEP4.blueOceanERRC },
          45_000, "Step 4C (ERRC Grid)",
        ).then(({ data, partial }) => {
          completedParts++;
          send({ type: "step_progress", stepId: 4, message: `ERRC אוקיינוס כחול ✓ (${completedParts}/4)` });
          return { data, partial };
        }),

        // Call D: SWOT + executive one-liner
        runStepWithFallback(
          () => runStructuredStep<{ swotMatrix: SWOTOpportunityMatrix; executiveOneLiner: string }>(
            STEP4_SWOT_SYSTEM,
            step4SwotPrompt(url, slimCtx, riskSummary),
            MODEL_HAIKU, false,
          ),
          { swotMatrix: FALLBACK_STEP4.swotMatrix, executiveOneLiner: FALLBACK_STEP4.executiveOneLiner },
          45_000, "Step 4D (SWOT)",
        ).then(({ data, partial }) => {
          completedParts++;
          send({ type: "step_progress", stepId: 4, message: `SWOT ✓ (${completedParts}/4)` });
          return { data, partial };
        }),
      ]);

      const step4: Step4ExecutiveSummary = {
        audienceMap:       audienceResult.data.audienceMap,
        competitorSquad:   squadResult.data.competitorSquad,
        blueOceanERRC:     errcResult.data.blueOceanERRC,
        swotMatrix:        swotResult.data.swotMatrix,
        executiveOneLiner: swotResult.data.executiveOneLiner,
      };
      const step4Partial =
        audienceResult.partial || squadResult.partial ||
        errcResult.partial     || swotResult.partial;

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

    // ── Step 6: Marketing Gap Analysis — 2 PARALLEL Haiku calls ────────────
    // Call A: channel gaps  |  Call B: strategic insights
    // Both finish in ~15-20s each; progress ticks keep the connection alive.
    let step6Data: Step6MarketingGapAnalysis = FALLBACK_STEP6;
    if (shouldSkip(6, category)) {
      skipStep(6);
    } else {
      report.steps[6].status = "running";
      report.steps[6].startedAt = Date.now();
      send({ type: "step_start", stepId: 6 });
      console.log(`[pipeline] Step 6 — 2 parallel Haiku calls (channels + insights)`);

      // Use slim context to reduce input tokens for these Haiku calls too
      const slimCtx6 = step1 ? slimStep1(step1) : step1Summary;

      const [channelsResult, insightsResult] = await Promise.all([
        runStepWithFallback(
          () => runStructuredStep<{ channelGaps: MarketingChannelGap[] }>(
            STEP6_CHANNELS_SYSTEM,
            step6ChannelsPrompt(url, slimCtx6),
            MODEL_HAIKU,
            false,
          ),
          { channelGaps: [] },
          45_000,
          "Step 6A (Channel Gaps)",
        ).then(({ data, partial }) => {
          send({ type: "step_progress", stepId: 6, message: `ניתוח ערוצים שיווקיים ✓` });
          return { data, partial };
        }),

        runStepWithFallback(
          () => runStructuredStep<{
            lowHangingFruits: Step6MarketingGapAnalysis["lowHangingFruits"];
            biggestGap: string;
            biggestOpportunity: string;
            overallGapScore: number;
          }>(
            STEP6_INSIGHTS_SYSTEM,
            step6InsightsPrompt(url, slimCtx6),
            MODEL_HAIKU,
            false,
          ),
          {
            lowHangingFruits: FALLBACK_STEP6.lowHangingFruits,
            biggestGap: FALLBACK_STEP6.biggestGap,
            biggestOpportunity: FALLBACK_STEP6.biggestOpportunity,
            overallGapScore: FALLBACK_STEP6.overallGapScore,
          },
          45_000,
          "Step 6B (Marketing Insights)",
        ).then(({ data, partial }) => {
          send({ type: "step_progress", stepId: 6, message: `זיהוי הזדמנויות מיידיות ✓` });
          return { data, partial };
        }),
      ]);

      const step6: Step6MarketingGapAnalysis = {
        channelGaps: channelsResult.data.channelGaps,
        lowHangingFruits: insightsResult.data.lowHangingFruits,
        biggestGap: insightsResult.data.biggestGap,
        biggestOpportunity: insightsResult.data.biggestOpportunity,
        overallGapScore: insightsResult.data.overallGapScore,
      };
      const step6Partial = channelsResult.partial || insightsResult.partial;

      step6Data = step6;
      report.step6 = step6;
      report.steps[6].status = "completed";
      report.steps[6].completedAt = Date.now();
      if (step6Partial) report.steps[6].partial = true;
      send({ type: "step_complete", stepId: 6, data: step6, partial: step6Partial });
      console.log(`[pipeline] Step 6 — done${step6Partial ? " (partial)" : ""}`);
    }

    // ── Step 7: Strategic Content Generation — 5 PARALLEL Haiku calls ──────
    // Each call receives only slim context (~600 tokens) + a single short
    // signal from step 6, so TTFT stays under 5s per call.
    //
    //  Call A : adCopy only                      (Haiku, 10K tokens, 45s)
    //  Call B : landingPageHeadline + angle       (Haiku, 10K tokens, 45s)
    //  Calls C,D,E: Instagram / TikTok / Facebook (Haiku, 10K tokens, 45s each)
    if (shouldSkip(7, category)) {
      skipStep(7);
    } else {
      report.steps[7].status = "running";
      report.steps[7].startedAt = Date.now();
      send({ type: "step_start", stepId: 7 });
      console.log(`[pipeline] Step 7 — 5 parallel Haiku calls (adCopy + landing + 3 social)`);

      // Use slim context for all sub-calls — reduces per-call input by ~85%
      const slimCtx7    = step1 ? slimStep1(step1) : step1Summary;
      const biggestGap  = step6Data.biggestGap        ?? "אין עדיין נתונים";
      const biggestOpp  = step6Data.biggestOpportunity ?? "אין עדיין נתונים";

      const SOCIAL_CONFIGS = [
        { platform: "instagram", format: "reel",  angle: "תקוף חולשה ספציפית של מתחרה" },
        { platform: "tiktok",    format: "reel",  angle: "לפני ואחרי: חוויה עם המתחרה vs. עם המשתמש" },
        { platform: "facebook",  format: "post",  angle: "תוכן חינוכי שמציב את העסק כמומחה" },
      ] as const;

      let completedAssets = 0;
      const TOTAL = 5;

      const [adCopyResult, landingResult, ...socialResults] = await Promise.all([

        // Call A: ad copy only
        runStepWithFallback(
          () => runStructuredStep<{ adCopy: Step7ContentAssets["adCopy"] }>(
            STEP7_ADCOPY_SYSTEM,
            step7AdCopyPrompt(url, slimCtx7, biggestGap),
            MODEL_HAIKU, false, 10_000,
          ),
          { adCopy: FALLBACK_STEP7.adCopy },
          45_000, "Step 7A (Ad Copy)",
        ).then(({ data, partial }) => {
          completedAssets++;
          send({ type: "step_progress", stepId: 7, message: `פרסומת ✓ (${completedAssets}/${TOTAL})` });
          return { data, partial };
        }),

        // Call B: landing page + winning angle
        runStepWithFallback(
          () => runStructuredStep<{
            landingPageHeadline: Step7ContentAssets["landingPageHeadline"];
            strategicAngle: string;
          }>(
            STEP7_LANDING_SYSTEM,
            step7LandingPrompt(url, slimCtx7, biggestOpp),
            MODEL_HAIKU, false, 10_000,
          ),
          { landingPageHeadline: FALLBACK_STEP7.landingPageHeadline, strategicAngle: FALLBACK_STEP7.strategicAngle },
          45_000, "Step 7B (Landing + Angle)",
        ).then(({ data, partial }) => {
          completedAssets++;
          send({ type: "step_progress", stepId: 7, message: `זווית תחרותית + דף נחיתה ✓ (${completedAssets}/${TOTAL})` });
          return { data, partial };
        }),

        // Calls C, D, E: one social post each (slim context, no step6 JSON)
        ...SOCIAL_CONFIGS.map((sc) =>
          runStepWithFallback(
            () => runStructuredStep<SocialPostIdea>(
              STEP7_SOCIAL_SYSTEM,
              step7SocialPrompt(sc.platform, sc.format, sc.angle, url, slimCtx7),
              MODEL_HAIKU, false, 10_000,
            ),
            {
              concept: sc.angle,
              hook: "הניתוח לא הושלם — נסה שנית",
              content: "הניתוח לא הושלם.",
              platform: sc.platform,
              format: sc.format,
            } as SocialPostIdea,
            45_000, `Step 7 (${sc.platform})`,
          ).then(({ data, partial }) => {
            completedAssets++;
            send({ type: "step_progress", stepId: 7, message: `${sc.platform} ✓ (${completedAssets}/${TOTAL})` });
            return { data, partial };
          })
        ),
      ]);

      const step7: Step7ContentAssets = {
        adCopy:              adCopyResult.data.adCopy,
        landingPageHeadline: landingResult.data.landingPageHeadline,
        strategicAngle:      landingResult.data.strategicAngle,
        socialPosts:         socialResults.map((r) => r.data),
      };
      const step7Partial =
        adCopyResult.partial || landingResult.partial ||
        socialResults.some((r) => r.partial);

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
