"use client";

import type { ResearchReport } from "@/types/research";
import { M, S, SB } from "./tokens";
import { SectionCard, RiskBadge, TimeframeBadge } from "./primitives";

export function RiskSection({ report }: { report: ResearchReport }) {
  const data = report.step3;
  if (!data) return null;

  const groups = [
    { label: "שיבוש טכנולוגי",  items: data.technologicalDisruptions, icon: "⚙️" },
    { label: "חלופות צרכניות",   items: data.consumerAlternatives,     icon: "🔄" },
    { label: "יציבות שוק",       items: data.marketStabilityRisks,     icon: "📉" },
  ];

  return (
    <SectionCard icon="⚠️" title="שלב 3: סיכונים לעסק שלי בשוק">

      <div className="flex items-center gap-3 rounded-xl p-3" style={{ background: S, border: `1px solid ${SB}` }}>
        <span className="text-sm text-gray-500">רמת סיכון כוללת:</span>
        <RiskBadge level={data.overallRiskLevel} />
      </div>

      {data.riskSummary && (
        <p className="text-sm text-gray-700 leading-relaxed">{data.riskSummary}</p>
      )}

      {groups.map((g) => g.items.length > 0 && (
        <div key={g.label}>
          <p className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <span>{g.icon}</span><span>{g.label}</span>
          </p>
          <div className="space-y-2">
            {g.items.map((r, i) => (
              <div key={i} className="rounded-xl p-3 space-y-1"
                   style={{ background: S, border: `1px solid ${SB}` }}>
                <div className="flex items-center flex-wrap gap-2">
                  <span className="font-medium text-sm text-gray-900">{r.title}</span>
                  <RiskBadge level={r.severity} />
                  <TimeframeBadge tf={r.timeframe} />
                </div>
                <p className="text-xs text-gray-500">{r.description}</p>
                <p className="text-xs font-medium" style={{ color: M }}>🛡 {r.mitigationStrategy}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </SectionCard>
  );
}
