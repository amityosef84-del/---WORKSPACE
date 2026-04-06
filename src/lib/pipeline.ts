/**
 * The core 4-step research pipeline orchestrator.
 * Each step feeds its output into the next, building a progressively
 * richer context. Results are streamed via SSE as each step completes.
 */

import { runStructuredStep } from "./anthropic";
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
 * Run the full 4-step pipeline and stream SSE events to the provided
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
      { id: 1, nameEn: "Competitor Analysis", nameHe: "ניתוח מתחרים", status: "pending" },
      { id: 2, nameEn: "Blue Ocean Identification", nameHe: "זיהוי האוקיינוס הכחול", status: "pending" },
      { id: 3, nameEn: "Risk & Threat Analysis", nameHe: "ניתוח סיכונים ואיומים", status: "pending" },
      { id: 4, nameEn: "Executive Summary", nameHe: "תקציר מנהלים", status: "pending" },
    ],
  };

  const { marketOrCompetitor: market, additionalContext: context } = request;

  try {
    // ── Step 1: Competitor Analysis ─────────────────────────────────────────
    report.steps[0].status = "running";
    report.steps[0].startedAt = Date.now();
    send({ type: "step_start", stepId: 1 });

    const step1 = await runStructuredStep<Step1CompetitorAnalysis>(
      STEP1_SYSTEM,
      step1UserPrompt(market, context),
    );

    report.step1 = step1;
    report.steps[0].status = "completed";
    report.steps[0].completedAt = Date.now();
    send({ type: "step_complete", stepId: 1, data: step1 });

    // ── Step 2: Blue Ocean (informed by Step 1) ──────────────────────────────
    report.steps[1].status = "running";
    report.steps[1].startedAt = Date.now();
    send({ type: "step_start", stepId: 2 });

    const step1Summary = JSON.stringify(step1, null, 2);
    const step2 = await runStructuredStep<Step2BlueOcean>(
      STEP2_SYSTEM,
      step2UserPrompt(market, step1Summary),
    );

    report.step2 = step2;
    report.steps[1].status = "completed";
    report.steps[1].completedAt = Date.now();
    send({ type: "step_complete", stepId: 2, data: step2 });

    // ── Step 3: Risk Analysis (informed by Steps 1 + 2) ──────────────────────
    report.steps[2].status = "running";
    report.steps[2].startedAt = Date.now();
    send({ type: "step_start", stepId: 3 });

    const step2Summary = JSON.stringify(step2, null, 2);
    const step3 = await runStructuredStep<Step3RiskAnalysis>(
      STEP3_SYSTEM,
      step3UserPrompt(market, step1Summary, step2Summary),
    );

    report.step3 = step3;
    report.steps[2].status = "completed";
    report.steps[2].completedAt = Date.now();
    send({ type: "step_complete", stepId: 3, data: step3 });

    // ── Step 4: Executive Summary (informed by Steps 1 + 2 + 3) ─────────────
    report.steps[3].status = "running";
    report.steps[3].startedAt = Date.now();
    send({ type: "step_start", stepId: 4 });

    const step3Summary = JSON.stringify(step3, null, 2);
    const step4 = await runStructuredStep<Step4ExecutiveSummary>(
      STEP4_SYSTEM,
      step4UserPrompt(market, step1Summary, step2Summary, step3Summary),
    );

    report.step4 = step4;
    report.steps[3].status = "completed";
    report.steps[3].completedAt = Date.now();
    send({ type: "step_complete", stepId: 4, data: step4 });

    // ── Pipeline Complete ────────────────────────────────────────────────────
    send({ type: "pipeline_complete", report });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Find the currently running step and mark it as errored
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
