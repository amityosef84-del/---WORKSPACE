"use client";

import type { ResearchReport } from "@/types/research";
import { M, MM, MB, S, SB, DT } from "./tokens";
import { SectionCard, Tag, BulletList } from "./primitives";

export function ExecutiveSummarySection({ report }: { report: ResearchReport }) {
  const data = report.step4;
  if (!data) return null;

  return (
    // defaultOpen — this is the "hero" section the user sees first
    <SectionCard icon="📊" title="שלב 4: תקציר מנהלים — אני מול השוק" defaultOpen>

      {data.executiveOneLiner && (
        <div className="rounded-xl p-5 text-center" style={{ background: MM, border: `1px solid ${MB}` }}>
          <p className="text-gray-900 font-semibold text-base leading-relaxed">{data.executiveOneLiner}</p>
        </div>
      )}

      {/* Audience map */}
      {data.audienceMap.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-900 mb-2">🎯 מפת קהל יעד</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {data.audienceMap.map((seg, i) => (
              <div key={i} className="rounded-xl p-3 space-y-2" style={{ background: S, border: `1px solid ${SB}` }}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-gray-900 text-sm">{seg.name}</span>
                  <Tag
                    label={seg.willingnessToPay === "high" ? "נכונות גבוהה" : seg.willingnessToPay === "low" ? "נמוכה" : "בינונית"}
                    color={seg.willingnessToPay === "high" ? "mint" : "default"}
                  />
                </div>
                <BulletList items={seg.burningPainPoints} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ERRC */}
      {data.blueOceanERRC && (
        <div>
          <p className="text-sm font-semibold text-gray-900 mb-2">🌊 מטריצת ERRC — הבידול שלי</p>
          {data.blueOceanERRC.blueOceanStatement && (
            <div className="rounded-xl p-3 mb-2" style={{ background: MM, border: `1px solid ${MB}` }}>
              <p className="text-sm text-gray-800">{data.blueOceanERRC.blueOceanStatement}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            {([
              { key: "eliminate" as const, label: "הסר",  icon: "🗑️" },
              { key: "reduce"    as const, label: "הפחת", icon: "📉" },
              { key: "raise"     as const, label: "הרם",  icon: "📈" },
              { key: "create"    as const, label: "צור",  icon: "✨" },
            ]).map(({ key, label, icon }) => (
              <div key={key} className="rounded-xl p-3 space-y-1.5"
                   style={{ background: S, border: `1px solid ${SB}` }}>
                <p className="text-xs font-bold" style={{ color: M }}>{icon} {label}</p>
                {data.blueOceanERRC[key].map((item, i) => (
                  <p key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                    <span style={{ color: DT }}>•</span>{item}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SWOT */}
      {data.swotMatrix && (
        <div>
          <p className="text-sm font-semibold text-gray-900 mb-2">🔲 SWOT — מיצוב שוק</p>
          <div className="grid grid-cols-2 gap-2 mb-2">
            {([
              { key: "strengths"     as const, label: "חוזקות",    color: M },
              { key: "weaknesses"    as const, label: "חולשות",    color: "#ef4444" },
              { key: "opportunities" as const, label: "הזדמנויות", color: "#6366f1" },
              { key: "threats"       as const, label: "איומים",    color: "#ea580c" },
            ]).map(({ key, label, color }) => (
              <div key={key} className="rounded-xl p-3 space-y-1"
                   style={{ background: S, border: `1px solid ${SB}` }}>
                <p className="text-xs font-bold" style={{ color }}>{label}</p>
                {data.swotMatrix[key].slice(0, 3).map((item, i) => (
                  <p key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                    <span style={{ color: DT }}>•</span>{item}
                  </p>
                ))}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="rounded-xl p-3" style={{ background: MM, border: `1px solid ${MB}` }}>
              <p className="text-xs font-bold mb-2" style={{ color: M }}>⚡ פעל עכשיו</p>
              <BulletList items={data.swotMatrix.actNow} mintDot />
            </div>
            <div className="rounded-xl p-3" style={{ background: "#FEF2F2", border: "1px solid rgba(239,68,68,0.2)" }}>
              <p className="text-xs font-bold mb-2 text-red-500">🚫 הימנע</p>
              <BulletList items={data.swotMatrix.avoid} />
            </div>
          </div>
        </div>
      )}
    </SectionCard>
  );
}
