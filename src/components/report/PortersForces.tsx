"use client";

import type { ResearchReport } from "@/types/research";
import { M, MD, MM, MB, S } from "./tokens";
import { SectionCard } from "./primitives";

function PorterScoreBar({ score }: { score: number }) {
  const pct   = Math.round((score / 10) * 100);
  const color = score >= 7 ? M : score >= 4 ? MD : "#6EE7B7";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-gray-100">
        <div className="h-full rounded-full transition-all duration-700"
             style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-bold tabular-nums w-8 text-right" style={{ color }}>{score}/10</span>
    </div>
  );
}

export function PortersSection({ report }: { report: ResearchReport }) {
  const data = report.step5;
  if (!data) return null;

  const forces = [
    { key: "rivalry"       as const, icon: "⚔️" },
    { key: "newEntrants"   as const, icon: "🚪" },
    { key: "supplierPower" as const, icon: "🏭" },
    { key: "buyerPower"    as const, icon: "🛒" },
    { key: "substitutes"   as const, icon: "🔄" },
  ];
  const overall      = data.overallAttractivenessScore;
  const overallColor = overall >= 7 ? M : overall >= 4 ? MD : "#6EE7B7";

  return (
    <SectionCard icon="🏛️" title="שלב 5: חמשת הכוחות של פורטר — פרספקטיבת העסק">

      <div className="rounded-xl p-4 space-y-3" style={{ background: MM, border: `1px solid ${MB}` }}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-900">ציון אטרקטיביות שוק לעסק שלי</span>
          <span className="text-2xl font-extrabold tabular-nums" style={{ color: overallColor }}>
            {overall}/10
          </span>
        </div>
        <PorterScoreBar score={overall} />
        {data.strategicImplication && (
          <p className="text-sm text-gray-700 leading-relaxed pt-1">{data.strategicImplication}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {forces.map(({ key, icon }) => {
          const f = data[key];
          return (
            <div key={key} className="rounded-xl p-4 space-y-2"
                 style={{ background: S, border: `1px solid ${MB}` }}>
              <div className="flex items-center gap-2">
                <span className="text-base">{icon}</span>
                <p className="text-sm font-bold text-gray-900 leading-snug">{f.name}</p>
              </div>
              <PorterScoreBar score={f.score} />
              <p className="text-xs text-gray-500 leading-relaxed">{f.analysis}</p>
              {f.keyFactors.length > 0 && (
                <ul className="space-y-0.5 pt-1">
                  {f.keyFactors.map((factor, i) => (
                    <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                      <span style={{ color: M, flexShrink: 0 }}>◆</span>{factor}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
