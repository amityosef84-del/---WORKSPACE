"use client";

import type { ResearchReport } from "@/types/research";
import { M, MM, MB, S, SB, DT } from "./tokens";
import { SectionCard, Tag } from "./primitives";

export function BlueOceanSection({ report }: { report: ResearchReport }) {
  const data = report.step2;
  if (!data) return null;
  return (
    <SectionCard icon="🌊" title="שלב 2: הזדמנויות שוק לעסק שלי">

      {data.topOpportunity && (
        <div className="rounded-xl p-4" style={{ background: MM, border: `1px solid ${MB}` }}>
          <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: M }}>
            ההזדמנות הגדולה ביותר
          </p>
          <p className="text-gray-900 font-semibold text-sm">{data.topOpportunity}</p>
        </div>
      )}

      {data.analysis.opportunityScore != null && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">ציון הזדמנות:</span>
          <div className="flex gap-1">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="w-3.5 h-3.5 rounded-sm transition-colors"
                   style={{ background: i < data.analysis.opportunityScore ? M : "#E5E7EB" }} />
            ))}
          </div>
          <span className="font-bold text-sm" style={{ color: M }}>{data.analysis.opportunityScore}/10</span>
        </div>
      )}

      {data.analysis.unmetNeeds.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-900 mb-2">צרכים שלא נענים בשוק</p>
          <div className="space-y-2">
            {data.analysis.unmetNeeds.map((n, i) => (
              <div key={i} className="rounded-xl p-3" style={{ background: S, border: `1px solid ${SB}` }}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-gray-700">{n.description}</p>
                  <span className="text-xs font-bold shrink-0" style={{ color: M }}>{n.intensityScore}/10</span>
                </div>
                {n.evidenceSources.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {n.evidenceSources.map((src, j) => <Tag key={j} label={src} color="mint" />)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {data.analysis.trendOpportunities.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-900 mb-2">טרנדים כהזדמנויות</p>
          <div className="space-y-2">
            {data.analysis.trendOpportunities.map((t, i) => {
              const typeLabel: Record<string, string> = {
                social: "חברתי", economic: "כלכלי", technological: "טכנולוגי", regulatory: "רגולטורי",
              };
              return (
                <div key={i} className="rounded-xl p-3 space-y-1" style={{ background: S, border: `1px solid ${SB}` }}>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-gray-900">{t.trendName}</span>
                    <Tag label={typeLabel[t.type] ?? t.type} color="mint" />
                  </div>
                  <p className="text-xs text-gray-500">{t.description}</p>
                  <p className="text-xs font-medium" style={{ color: M }}>→ {t.howToLeverage}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {data.analysis.whitespaceInsights && (
        <div className="rounded-xl p-4" style={{ background: S, border: `1px solid ${SB}` }}>
          <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: DT }}>
            רווחים לבנים לכיבוש
          </p>
          <p className="text-sm text-gray-700">{data.analysis.whitespaceInsights}</p>
        </div>
      )}
    </SectionCard>
  );
}
