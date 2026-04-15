"use client";

import type { ResearchReport, Step6MarketingGapAnalysis } from "@/types/research";
import { M, MM, MB, S, SB, DT } from "./tokens";
import { SectionCard, Tag } from "./primitives";

const PRESENCE_LABEL: Record<string, string> = {
  strong: "חזק", moderate: "בינוני", weak: "חלש", none: "נעדר",
};
const PRESENCE_COLOR: Record<string, string> = {
  strong: "#059669", moderate: "#d97706", weak: "#ea580c", none: "#dc2626",
};
const GAP_COLOR: Record<string, string> = {
  high: M, medium: "#d97706", low: "#9CA3AF",
};
const GAP_LABEL: Record<string, string> = {
  high: "פער גבוה ⚡", medium: "פוטנציאל", low: "מינימלי",
};
const EFFORT_LABEL: Record<string, string> = {
  low: "מאמץ נמוך", medium: "מאמץ בינוני", high: "מאמץ גבוה",
};
const IMPACT_LABEL: Record<string, string> = {
  high: "השפעה גבוהה", medium: "השפעה בינונית", low: "השפעה נמוכה",
};

function PresenceDot({ level }: { level: string }) {
  const color = PRESENCE_COLOR[level] ?? DT;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color }}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
      {PRESENCE_LABEL[level] ?? level}
    </span>
  );
}

export function MarketingGapSection({ report }: { report: ResearchReport }) {
  const data: Step6MarketingGapAnalysis | undefined = report.step6;
  if (!data) return null;

  const highGaps  = data.channelGaps.filter((c) => c.gapLevel === "high");
  const otherGaps = data.channelGaps.filter((c) => c.gapLevel !== "high");

  return (
    <SectionCard icon="📈" title="שלב 6: ניתוח פערים שיווקי — אני מול המתחרים">

      {/* Biggest gap + opportunity */}
      {(data.biggestGap || data.biggestOpportunity) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {data.biggestGap && (
            <div className="rounded-xl p-4 space-y-1"
                 style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}>
              <p className="text-xs font-bold uppercase tracking-wide text-red-500">הפער הגדול ביותר</p>
              <p className="text-sm text-gray-700 leading-relaxed">{data.biggestGap}</p>
            </div>
          )}
          {data.biggestOpportunity && (
            <div className="rounded-xl p-4 space-y-1" style={{ background: MM, border: `1px solid ${MB}` }}>
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: M }}>הזדמנות לניצול</p>
              <p className="text-sm text-gray-700 leading-relaxed">{data.biggestOpportunity}</p>
            </div>
          )}
        </div>
      )}

      {/* Overall gap score */}
      {data.overallGapScore != null && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">ציון פוטנציאל שיווקי לא מנוצל:</span>
          <div className="flex gap-1">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="w-3.5 h-3.5 rounded-sm transition-colors"
                   style={{ background: i < data.overallGapScore ? M : "#E5E7EB" }} />
            ))}
          </div>
          <span className="font-bold text-sm" style={{ color: M }}>{data.overallGapScore}/10</span>
        </div>
      )}

      {/* Channel comparison */}
      {data.channelGaps.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-900 mb-3">השוואת ערוצי שיווק — אני מול המתחרים</p>

          {/* High-gap channels */}
          {highGaps.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: M }}>
                ⚡ ערוצים עם פער גבוה — הזדמנויות מיידיות
              </p>
              <div className="space-y-2">
                {highGaps.map((gap, i) => (
                  <div key={i} className="rounded-xl p-4 space-y-2"
                       style={{ background: MM, border: `1px solid ${MB}` }}>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-bold text-gray-900 text-sm">{gap.channel}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{ background: MM, color: GAP_COLOR[gap.gapLevel] ?? DT, border: `1px solid ${MB}` }}>
                        {GAP_LABEL[gap.gapLevel]}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-0.5">
                        <p className="text-xs text-gray-400">העסק שלך</p>
                        <PresenceDot level={gap.userPresence} />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs text-gray-400">המתחרים</p>
                        <PresenceDot level={gap.competitorPresence} />
                      </div>
                    </div>
                    {gap.insight && (
                      <p className="text-xs text-gray-600 leading-relaxed border-t pt-2"
                         style={{ borderColor: MB }}>
                        {gap.insight}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Other channels table */}
          {otherGaps.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: DT }}>שאר הערוצים</p>
              <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${SB}` }}>
                <div className="grid grid-cols-4 gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wide bg-gray-50 text-gray-400">
                  <span>ערוץ</span><span>אני</span><span>מתחרים</span><span>פער</span>
                </div>
                {otherGaps.map((gap, i) => (
                  <div key={i} className="grid grid-cols-4 gap-2 px-4 py-3 text-xs items-center"
                       style={{ borderTop: `1px solid ${SB}`, background: i % 2 === 0 ? "#fff" : "#F9FAFB" }}>
                    <span className="font-medium text-gray-700">{gap.channel}</span>
                    <PresenceDot level={gap.userPresence} />
                    <PresenceDot level={gap.competitorPresence} />
                    <span className="font-semibold" style={{ color: GAP_COLOR[gap.gapLevel] ?? DT }}>
                      {GAP_LABEL[gap.gapLevel]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Low-hanging fruit */}
      {data.lowHangingFruits.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-900 mb-3">🍋 Low Hanging Fruit — פעולות מיידיות לביצוע</p>
          <div className="space-y-3">
            {data.lowHangingFruits.map((fruit, i) => (
              <div key={i} className="rounded-xl p-4 space-y-2"
                   style={{ background: S, border: `1px solid ${MB}` }}>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-xs font-black"
                       style={{ background: MM, color: M, border: `1px solid ${MB}` }}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm leading-snug">{fruit.action}</p>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{fruit.reason}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap pr-9">
                  <Tag label={fruit.channel} color="mint" />
                  <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: fruit.effort === "low" ? "rgba(16,185,129,0.08)" : fruit.effort === "medium" ? "rgba(251,191,36,0.1)" : "rgba(239,68,68,0.08)",
                          color:      fruit.effort === "low" ? "#059669"               : fruit.effort === "medium" ? "#d97706"               : "#dc2626",
                        }}>
                    {EFFORT_LABEL[fruit.effort] ?? fruit.effort}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: fruit.impact === "high" ? MM : fruit.impact === "medium" ? "rgba(251,191,36,0.1)" : "#F9FAFB",
                          color:      fruit.impact === "high" ? M  : fruit.impact === "medium" ? "#d97706"               : DT,
                        }}>
                    {IMPACT_LABEL[fruit.impact] ?? fruit.impact}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </SectionCard>
  );
}
