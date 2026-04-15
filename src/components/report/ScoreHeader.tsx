"use client";

import type { ResearchReport } from "@/types/research";
import { M, MD, MM, MB, DT } from "./tokens";
import { BulletList } from "./primitives";

// ─── Score computation ────────────────────────────────────────────────────────

export function computeScore(report: ResearchReport): {
  score: number; strengths: string[]; improvements: string[];
} {
  let score = 50;
  if (report.step5) score += (report.step5.overallAttractivenessScore - 5) * 5;
  if (report.step2) score += (report.step2.analysis.opportunityScore - 5) * 2;
  if (report.step3) {
    const adj: Record<string, number> = { low: 5, medium: 0, high: -10, critical: -18 };
    score += adj[report.step3.overallRiskLevel] ?? 0;
  }
  if (report.step6) score += Math.round((report.step6.overallGapScore - 5) * 0.8);
  score = Math.max(5, Math.min(97, Math.round(score)));
  const strengths    = report.step4?.swotMatrix.strengths.slice(0, 3)  ?? [];
  const improvements = report.step4?.swotMatrix.weaknesses.slice(0, 3) ?? [];
  return { score, strengths, improvements };
}

// ─── Half-circle gauge ────────────────────────────────────────────────────────

export function ScoreGauge({ score }: { score: number }) {
  const R    = 52;
  const C    = 2 * Math.PI * R;
  const half = C / 2;
  const fill = (score / 100) * half;
  const arcColor = score >= 70 ? M : score >= 40 ? MD : "#6EE7B7";
  const label    = score >= 70 ? "מיצוב חזק" : score >= 50 ? "טוב" : score >= 30 ? "בינוני" : "נמוך";

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="136" height="84" viewBox="0 0 136 84" aria-label={"Market Position Score " + score}>
        {/* Track */}
        <circle cx="68" cy="68" r={R} fill="none" stroke={MM} strokeWidth="10"
          strokeDasharray={`${half} ${C - half}`} strokeLinecap="round"
          transform="rotate(180 68 68)" />
        {/* Fill */}
        <circle cx="68" cy="68" r={R} fill="none" stroke={arcColor} strokeWidth="10"
          strokeDasharray={`${fill} ${C - fill}`} strokeLinecap="round"
          transform="rotate(180 68 68)"
          style={{ filter: `drop-shadow(0 0 6px ${arcColor}60)`, transition: "stroke-dasharray 1s ease-out" }} />
        {/* Score text */}
        <text x="68" y="58" textAnchor="middle" fill="#1A1A1A" fontSize="28" fontWeight="800" fontFamily="Assistant,Arial">
          {score}
        </text>
        <text x="68" y="72" textAnchor="middle" fill={DT} fontSize="10" fontFamily="Assistant,Arial">/ 100</text>
        <text x="68" y="84" textAnchor="middle" fill={arcColor} fontSize="11" fontWeight="700" fontFamily="Assistant,Arial">
          {label}
        </text>
      </svg>
      <p style={{ color: M, fontSize: "9px", fontWeight: 700, letterSpacing: "0.18em" }}>
        MARKET POSITION SCORE
      </p>
    </div>
  );
}

// ─── Strengths / improvements quick-cards ─────────────────────────────────────

export function InsightsCards({ strengths, improvements }: {
  strengths: string[]; improvements: string[];
}) {
  if (!strengths.length && !improvements.length) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="rounded-xl p-4 space-y-3" style={{ background: MM, border: `1px solid ${MB}` }}>
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 rounded-full" style={{ background: M }} />
          <p className="text-xs font-bold tracking-wide" style={{ color: M }}>נקודות לשימור</p>
        </div>
        <BulletList items={strengths.length ? strengths : ["בצע מחקר מלא לקבלת תובנות"]} mintDot />
      </div>
      <div className="rounded-xl p-4 space-y-3" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 rounded-full bg-gray-300" />
          <p className="text-xs font-bold tracking-wide text-gray-600">נקודות לשיפור</p>
        </div>
        <BulletList items={improvements.length ? improvements : ["בצע מחקר מלא לקבלת תובנות"]} />
      </div>
    </div>
  );
}
