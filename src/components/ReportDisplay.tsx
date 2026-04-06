"use client";

import type { ResearchReport } from "@/types/research";

interface Props {
  report: ResearchReport;
}

// ─── Shared UI primitives ─────────────────────────────────────────────────────

function SectionCard({
  emoji,
  title,
  children,
}: {
  emoji: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-4">
      <h2 className="text-lg font-bold text-white flex items-center gap-2">
        <span>{emoji}</span>
        <span>{title}</span>
      </h2>
      {children}
    </div>
  );
}

function Tag({ label, color = "slate" }: { label: string; color?: string }) {
  const colors: Record<string, string> = {
    slate: "bg-slate-700 text-slate-200",
    blue: "bg-blue-900 text-blue-300",
    emerald: "bg-emerald-900 text-emerald-300",
    amber: "bg-amber-900 text-amber-300",
    red: "bg-red-900 text-red-300",
    purple: "bg-purple-900 text-purple-300",
  };
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${colors[color] ?? colors.slate}`}>
      {label}
    </span>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
          <span className="text-emerald-400 mt-0.5 flex-shrink-0">◆</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function RiskBadge({ level }: { level: string }) {
  const config: Record<string, string> = {
    low: "bg-emerald-900 text-emerald-300",
    medium: "bg-amber-900 text-amber-300",
    high: "bg-orange-900 text-orange-300",
    critical: "bg-red-900 text-red-300",
  };
  const labels: Record<string, string> = {
    low: "נמוך",
    medium: "בינוני",
    high: "גבוה",
    critical: "קריטי",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${config[level] ?? config.low}`}>
      {labels[level] ?? level}
    </span>
  );
}

function TimeframeBadge({ tf }: { tf: string }) {
  const config: Record<string, string> = {
    immediate: "bg-red-900/60 text-red-300",
    "short-term": "bg-amber-900/60 text-amber-300",
    "long-term": "bg-slate-700 text-slate-300",
  };
  const labels: Record<string, string> = {
    immediate: "מיידי",
    "short-term": "קצר-טווח",
    "long-term": "ארוך-טווח",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${config[tf] ?? config["long-term"]}`}>
      {labels[tf] ?? tf}
    </span>
  );
}

// ─── Step 1 Section ───────────────────────────────────────────────────────────

function CompetitorAnalysisSection({ report }: { report: ResearchReport }) {
  const data = report.step1;
  if (!data) return null;

  return (
    <SectionCard emoji="🔍" title="שלב 1: ניתוח מתחרים">
      {data.marketOverview && (
        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
          <p className="text-sm text-slate-300 leading-relaxed">{data.marketOverview}</p>
        </div>
      )}

      {/* Competitor cards */}
      <div className="space-y-4">
        {data.competitors.map((c, i) => (
          <div key={i} className="bg-slate-900 rounded-xl p-4 border border-slate-700 space-y-3">
            <h3 className="font-bold text-white text-base">{c.name}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {/* Identity */}
              <div className="space-y-1">
                <p className="text-slate-400 font-semibold text-xs uppercase tracking-wide">זהות ונרטיב</p>
                <p className="text-slate-300">{c.identityAndNarrative.positioning}</p>
                {c.identityAndNarrative.brandVoice && (
                  <p className="text-slate-400 text-xs">{c.identityAndNarrative.brandVoice}</p>
                )}
              </div>

              {/* Target Audience */}
              <div className="space-y-1">
                <p className="text-slate-400 font-semibold text-xs uppercase tracking-wide">קהל יעד</p>
                <p className="text-slate-300 text-xs">{c.targetAudience.demographics}</p>
                <p className="text-slate-400 text-xs">{c.targetAudience.socioEconomicStatus}</p>
              </div>

              {/* Offer */}
              <div className="space-y-1">
                <p className="text-slate-400 font-semibold text-xs uppercase tracking-wide">הצעת ערך</p>
                <div className="flex flex-wrap gap-1">
                  {c.offer.pricingModels.map((pm, j) => (
                    <Tag key={j} label={pm} color="blue" />
                  ))}
                  {c.offer.priceRange && (
                    <Tag label={c.offer.priceRange} color="purple" />
                  )}
                </div>
              </div>

              {/* Marketing */}
              <div className="space-y-1">
                <p className="text-slate-400 font-semibold text-xs uppercase tracking-wide">ערוצי שיווק</p>
                <div className="flex flex-wrap gap-1">
                  {c.marketingAndTraffic.distributionChannels.slice(0, 4).map((ch, j) => (
                    <Tag key={j} label={ch} color="slate" />
                  ))}
                </div>
              </div>
            </div>

            {/* Specific needs */}
            {c.targetAudience.specificNeeds.length > 0 && (
              <div>
                <p className="text-slate-400 font-semibold text-xs uppercase tracking-wide mb-1.5">צרכים ספציפיים</p>
                <div className="flex flex-wrap gap-1">
                  {c.targetAudience.specificNeeds.map((need, j) => (
                    <Tag key={j} label={need} color="emerald" />
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Indirect competitors */}
      {data.indirectCompetitors.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-slate-300 mb-2">מתחרים עקיפים</p>
          <div className="flex flex-wrap gap-2">
            {data.indirectCompetitors.map((ic, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-slate-900 rounded-lg px-3 py-1.5 border border-slate-700">
                <span className="text-sm text-slate-200">{ic.name}</span>
                <RiskBadge level={ic.threatLevel} />
              </div>
            ))}
          </div>
        </div>
      )}
    </SectionCard>
  );
}

// ─── Step 2 Section ───────────────────────────────────────────────────────────

function BlueOceanSection({ report }: { report: ResearchReport }) {
  const data = report.step2;
  if (!data) return null;

  return (
    <SectionCard emoji="🌊" title="שלב 2: האוקיינוס הכחול - פערי הזדמנויות">
      {/* Top opportunity highlight */}
      {data.topOpportunity && (
        <div className="bg-gradient-to-r from-blue-900/60 to-cyan-900/60 border border-blue-700 rounded-xl p-4">
          <p className="text-xs text-blue-400 font-semibold uppercase tracking-wide mb-1">הזדמנות מרכזית</p>
          <p className="text-white font-medium">{data.topOpportunity}</p>
        </div>
      )}

      {/* Score */}
      {data.analysis.opportunityScore && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">ציון הזדמנות שוק:</span>
          <div className="flex items-center gap-1">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-sm transition-colors ${
                  i < data.analysis.opportunityScore
                    ? "bg-blue-500"
                    : "bg-slate-700"
                }`}
              />
            ))}
          </div>
          <span className="text-blue-300 font-bold">{data.analysis.opportunityScore}/10</span>
        </div>
      )}

      {/* Unmet needs */}
      <div>
        <p className="text-sm font-semibold text-slate-300 mb-3">צרכים לא נענים</p>
        <div className="space-y-3">
          {data.analysis.unmetNeeds.map((need, i) => (
            <div key={i} className="bg-slate-900 rounded-xl p-3 border border-slate-700">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-slate-200">{need.description}</p>
                <span className="text-xs font-bold text-amber-400 flex-shrink-0">
                  {need.intensityScore}/10
                </span>
              </div>
              {need.evidenceSources.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {need.evidenceSources.map((src, j) => (
                    <Tag key={j} label={src} color="amber" />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Trend opportunities */}
      <div>
        <p className="text-sm font-semibold text-slate-300 mb-3">טרנדים כהזדמנויות</p>
        <div className="space-y-3">
          {data.analysis.trendOpportunities.map((trend, i) => {
            const typeColor: Record<string, string> = {
              social: "emerald",
              economic: "blue",
              technological: "purple",
              regulatory: "amber",
            };
            const typeLabel: Record<string, string> = {
              social: "חברתי",
              economic: "כלכלי",
              technological: "טכנולוגי",
              regulatory: "רגולטורי",
            };
            return (
              <div key={i} className="bg-slate-900 rounded-xl p-3 border border-slate-700 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-white">{trend.trendName}</span>
                  <Tag label={typeLabel[trend.type] ?? trend.type} color={typeColor[trend.type] ?? "slate"} />
                </div>
                <p className="text-xs text-slate-400">{trend.description}</p>
                <div className="flex items-start gap-1.5">
                  <span className="text-emerald-400 text-xs flex-shrink-0 mt-0.5">→</span>
                  <p className="text-xs text-emerald-300">{trend.howToLeverage}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {data.analysis.whitespaceInsights && (
        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
          <p className="text-xs text-slate-400 font-semibold uppercase mb-1">תובנות רווח לבן</p>
          <p className="text-sm text-slate-300">{data.analysis.whitespaceInsights}</p>
        </div>
      )}
    </SectionCard>
  );
}

// ─── Step 3 Section ───────────────────────────────────────────────────────────

function RiskSection({ report }: { report: ResearchReport }) {
  const data = report.step3;
  if (!data) return null;

  const riskGroups = [
    { label: "שיבוש טכנולוגי", items: data.technologicalDisruptions, emoji: "⚙️" },
    { label: "חלופות צרכניות", items: data.consumerAlternatives, emoji: "🔄" },
    { label: "יציבות שוק", items: data.marketStabilityRisks, emoji: "📉" },
  ];

  return (
    <SectionCard emoji="⚠️" title="שלב 3: ניתוח סיכונים ואיומים">
      {/* Overall risk level */}
      <div className="flex items-center gap-3 bg-slate-900/50 rounded-xl p-3 border border-slate-700">
        <span className="text-sm text-slate-400">רמת סיכון כוללת:</span>
        <RiskBadge level={data.overallRiskLevel} />
      </div>

      {data.riskSummary && (
        <p className="text-sm text-slate-300 leading-relaxed">{data.riskSummary}</p>
      )}

      {riskGroups.map((group) =>
        group.items.length > 0 ? (
          <div key={group.label}>
            <p className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <span>{group.emoji}</span>
              <span>{group.label}</span>
            </p>
            <div className="space-y-2.5">
              {group.items.map((risk, i) => (
                <div key={i} className="bg-slate-900 rounded-xl p-3 border border-slate-700 space-y-2">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="font-medium text-sm text-white">{risk.title}</span>
                    <RiskBadge level={risk.severity} />
                    <TimeframeBadge tf={risk.timeframe} />
                  </div>
                  <p className="text-xs text-slate-400">{risk.description}</p>
                  <div className="flex items-start gap-1.5">
                    <span className="text-blue-400 text-xs flex-shrink-0 mt-0.5">🛡</span>
                    <p className="text-xs text-blue-300">{risk.mitigationStrategy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null
      )}
    </SectionCard>
  );
}

// ─── Step 4 Section ───────────────────────────────────────────────────────────

function ExecutiveSummarySection({ report }: { report: ResearchReport }) {
  const data = report.step4;
  if (!data) return null;

  return (
    <SectionCard emoji="📊" title="שלב 4: תקציר מנהלים">
      {/* One-liner */}
      {data.executiveOneLiner && (
        <div className="bg-gradient-to-r from-purple-900/60 to-blue-900/60 border border-purple-700 rounded-xl p-5 text-center">
          <p className="text-white font-semibold text-lg leading-relaxed">
            {data.executiveOneLiner}
          </p>
        </div>
      )}

      {/* Audience Map */}
      <div>
        <p className="text-sm font-semibold text-slate-300 mb-3">🎯 מפת קהל</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {data.audienceMap.map((seg, i) => (
            <div key={i} className="bg-slate-900 rounded-xl p-3 border border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white text-sm">{seg.name}</span>
                <div className="flex gap-1.5">
                  <Tag
                    label={seg.size === "גדול" || seg.size === "large" ? "גדול" : seg.size === "נישה" || seg.size === "niche" ? "נישה" : "בינוני"}
                    color={seg.size === "גדול" || seg.size === "large" ? "emerald" : seg.size === "נישה" || seg.size === "niche" ? "purple" : "blue"}
                  />
                  <Tag
                    label={
                      seg.willingnessToPay === "high"
                        ? "נכונות תשלום גבוהה"
                        : seg.willingnessToPay === "low"
                        ? "נכונות תשלום נמוכה"
                        : "נכונות תשלום בינונית"
                    }
                    color={
                      seg.willingnessToPay === "high"
                        ? "emerald"
                        : seg.willingnessToPay === "low"
                        ? "red"
                        : "amber"
                    }
                  />
                </div>
              </div>
              <BulletList items={seg.burningPainPoints} />
            </div>
          ))}
        </div>
      </div>

      {/* Competitor Squad */}
      <div>
        <p className="text-sm font-semibold text-slate-300 mb-3">⚔️ ה-Competitor Squad</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-xs font-bold text-amber-400 uppercase tracking-wide">3 הטיטאנים</p>
            {data.competitorSquad.titans.slice(0, 3).map((t, i) => (
              <div key={i} className="bg-slate-900 rounded-xl p-3 border border-amber-900/50 space-y-1.5">
                <span className="font-semibold text-white text-sm">{t.name}</span>
                <div className="flex items-start gap-1.5">
                  <span className="text-emerald-400 text-xs flex-shrink-0">💪</span>
                  <p className="text-xs text-emerald-300">{t.strength}</p>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-red-400 text-xs flex-shrink-0">⚡</span>
                  <p className="text-xs text-red-300">{t.weakness}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-bold text-blue-400 uppercase tracking-wide">3 העולים החדשים</p>
            {data.competitorSquad.upAndComers.slice(0, 3).map((u, i) => (
              <div key={i} className="bg-slate-900 rounded-xl p-3 border border-blue-900/50 space-y-1.5">
                <span className="font-semibold text-white text-sm">{u.name}</span>
                <div className="flex items-start gap-1.5">
                  <span className="text-blue-400 text-xs flex-shrink-0">🚀</span>
                  <p className="text-xs text-blue-300">{u.growthDriver}</p>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-amber-400 text-xs flex-shrink-0">⚠️</span>
                  <p className="text-xs text-amber-300">{u.threat}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ERRC Grid */}
      <div>
        <p className="text-sm font-semibold text-slate-300 mb-3">🌊 מטריצת ERRC - הזדמנות האוקיינוס הכחול</p>
        {data.blueOceanERRC.blueOceanStatement && (
          <div className="bg-gradient-to-r from-cyan-900/60 to-blue-900/60 border border-cyan-700 rounded-xl p-4 mb-3">
            <p className="text-cyan-200 text-sm leading-relaxed font-medium">
              {data.blueOceanERRC.blueOceanStatement}
            </p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: "eliminate" as const, label: "הסר (Eliminate)", color: "red", icon: "🗑️" },
            { key: "reduce" as const, label: "הפחת (Reduce)", color: "amber", icon: "📉" },
            { key: "raise" as const, label: "הרם (Raise)", color: "emerald", icon: "📈" },
            { key: "create" as const, label: "צור (Create)", color: "blue", icon: "✨" },
          ].map(({ key, label, color, icon }) => (
            <div key={key} className={`bg-slate-900 rounded-xl p-3 border border-${color}-900/50 space-y-2`}>
              <p className={`text-xs font-bold text-${color}-400 flex items-center gap-1.5`}>
                <span>{icon}</span>
                <span>{label}</span>
              </p>
              <ul className="space-y-1">
                {data.blueOceanERRC[key].map((item, i) => (
                  <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                    <span className="text-slate-500 flex-shrink-0">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* SWOT */}
      <div>
        <p className="text-sm font-semibold text-slate-300 mb-3">🔲 מטריצת SWOT</p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          {[
            { key: "strengths" as const, label: "חוזקות", color: "emerald", icon: "💪" },
            { key: "weaknesses" as const, label: "חולשות", color: "red", icon: "⚠️" },
            { key: "opportunities" as const, label: "הזדמנויות", color: "blue", icon: "🚀" },
            { key: "threats" as const, label: "איומים", color: "amber", icon: "🔥" },
          ].map(({ key, label, color, icon }) => (
            <div key={key} className={`bg-slate-900 rounded-xl p-3 border border-${color}-900/50 space-y-2`}>
              <p className={`text-xs font-bold text-${color}-400 flex items-center gap-1.5`}>
                <span>{icon}</span>
                <span>{label}</span>
              </p>
              <ul className="space-y-1">
                {data.swotMatrix[key].slice(0, 4).map((item, i) => (
                  <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                    <span className="text-slate-500 flex-shrink-0">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Act Now / Avoid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-emerald-950 rounded-xl p-4 border border-emerald-800">
            <p className="text-xs font-bold text-emerald-400 mb-2 flex items-center gap-1.5">
              <span>⚡</span>
              <span>פעל עכשיו</span>
            </p>
            <BulletList items={data.swotMatrix.actNow} />
          </div>
          <div className="bg-red-950 rounded-xl p-4 border border-red-800">
            <p className="text-xs font-bold text-red-400 mb-2 flex items-center gap-1.5">
              <span>🚫</span>
              <span>הימנע</span>
            </p>
            <BulletList items={data.swotMatrix.avoid} />
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function ReportDisplay({ report }: Props) {
  const allComplete = report.steps.every((s) => s.status === "completed");

  return (
    <div className="space-y-6">
      {/* Report header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 border border-slate-600 rounded-2xl p-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">
              דוח מחקר שוק
            </p>
            <h1 className="text-xl font-bold text-white font-mono" dir="ltr">
              {report.query.competitorUrl}
            </h1>
            {report.query.additionalDetails && (
              <p className="text-sm text-slate-400 mt-1">{report.query.additionalDetails}</p>
            )}
          </div>
          {allComplete && (
            <span className="bg-emerald-700 text-emerald-100 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <span>✓</span>
              הושלם
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-2">
          {new Date(report.createdAt).toLocaleString("he-IL")}
        </p>
      </div>

      {/* Steps in order */}
      <CompetitorAnalysisSection report={report} />
      <BlueOceanSection report={report} />
      <RiskSection report={report} />
      <ExecutiveSummarySection report={report} />
    </div>
  );
}
