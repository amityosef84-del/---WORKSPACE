"use client";

import { useRef } from "react";
import type { ResearchReport } from "@/types/research";

import { M, MM, MB } from "./report/tokens";
import { computeScore, ScoreGauge, InsightsCards } from "./report/ScoreHeader";
import { DownloadPdfButton }        from "./report/DownloadPdfButton";
import { CompetitorAnalysisSection } from "./report/CompetitorAnalysis";
import { BlueOceanSection }          from "./report/BlueOcean";
import { RiskSection }               from "./report/RiskAnalysis";
import { ExecutiveSummarySection }   from "./report/ExecutiveSummary";
import { PortersSection }            from "./report/PortersForces";
import { MarketingGapSection }       from "./report/MarketingGap";
import { ContentAssetsSection }      from "./report/ContentAssets";

interface Props { report: ResearchReport; }

export default function ReportDisplay({ report }: Props) {
  const reportRef   = useRef<HTMLDivElement>(null);
  const allComplete = report.steps.every((s) => s.status === "completed");
  const { score, strengths, improvements } = computeScore(report);

  const hostname = (() => {
    try { return new URL(report.query.competitorUrl).hostname.replace(/^www\./, ""); }
    catch { return "report"; }
  })();
  const pdfFilename =
    "MarketLens-" + hostname + "-" + new Date(report.createdAt).toISOString().slice(0, 10) + ".pdf";

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">

      {/* ── Completion banner — appears at top the moment pipeline finishes ── */}
      {allComplete && (
        <div className="rounded-2xl px-5 py-4 fade-in-up flex items-center justify-between flex-wrap gap-4"
             style={{ background: `linear-gradient(135deg, ${MM} 0%, rgba(16,185,129,0.14) 100%)`,
                      border: `1.5px solid ${MB}`,
                      boxShadow: "0 4px 24px rgba(16,185,129,0.12)" }}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-bold text-gray-900 text-sm leading-snug">הניתוח הושלם בהצלחה!</p>
              <p className="text-xs text-gray-500 mt-0.5">הדוח המלא מוכן — ניתן להורדה כ-PDF</p>
            </div>
          </div>
          <DownloadPdfButton targetRef={reportRef} filename={pdfFilename} />
        </div>
      )}

      {/* ── Header card ─────────────────────────────────────────────────────── */}
      <div className="rounded-2xl p-5 fade-in-up"
           style={{ background: "#fff", border: `1px solid ${MB}`, boxShadow: "0 1px 8px rgba(16,185,129,0.07)" }}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest mb-1"
               style={{ color: M, letterSpacing: "0.18em" }}>
              דוח השוואתי — העסק שלי מול השוק
            </p>
            <h1 className="text-lg font-bold text-gray-900 font-mono truncate" dir="ltr">
              {report.query.competitorUrl}
            </h1>
            {report.query.additionalDetails && (
              <p className="text-sm text-gray-500 mt-1 truncate">{report.query.additionalDetails}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              {new Date(report.createdAt).toLocaleString("he-IL")}
            </p>
          </div>

          <div className="flex items-center gap-4 flex-wrap shrink-0">
            <ScoreGauge score={score} />
            <div className="flex flex-col gap-2">
              {allComplete && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
                      style={{ background: MM, color: M, border: `1px solid ${MB}` }}>
                  ✓ הושלם
                </span>
              )}
              {allComplete && (
                <DownloadPdfButton targetRef={reportRef} filename={pdfFilename} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick insights ──────────────────────────────────────────────────── */}
      <InsightsCards strengths={strengths} improvements={improvements} />

      {/* ── Accordion sections (captured for PDF) ───────────────────────────── */}
      <div ref={reportRef} className="space-y-4">
        {/* Executive Summary is defaultOpen — first thing users read */}
        <ExecutiveSummarySection   report={report} />
        <CompetitorAnalysisSection report={report} />
        <BlueOceanSection          report={report} />
        <RiskSection               report={report} />
        <PortersSection            report={report} />
        <MarketingGapSection       report={report} />
        <ContentAssetsSection      report={report} />
      </div>
    </div>
  );
}
