"use client";

import { useEffect, useRef, useState } from "react";
import type { ResearchReport, CompetitorProfile, Step6MarketingGapAnalysis, Step7ContentAssets } from "@/types/research";

// ─── Design tokens ────────────────────────────────────────────────────────────
const G  = "#D4AF37";
const GD = "#C5A028";
const GM = "rgba(212,175,55,0.12)";
const GB = "rgba(212,175,55,0.22)";
const S  = "rgba(255,255,255,0.04)";
const SB = "rgba(255,255,255,0.08)";
const DT = "rgba(255,255,255,0.35)";

// ─── Shared primitives ────────────────────────────────────────────────────────

function SectionCard({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-6 space-y-5" style={{ background: S, border: `1px solid ${SB}` }}>
      <h2 className="text-base font-bold flex items-center gap-2.5">
        <span className="text-xl">{icon}</span>
        <span className="text-white">{title}</span>
      </h2>
      {children}
    </div>
  );
}

function Tag({ label, color = "default" }: { label: string; color?: "gold" | "red" | "blue" | "green" | "default" }) {
  const styles: Record<string, { background: string; color: string; border: string }> = {
    gold:    { background: GM, color: G,       border: GB },
    red:     { background: "rgba(239,68,68,0.1)",   color: "#f87171", border: "rgba(239,68,68,0.25)" },
    blue:    { background: "rgba(99,102,241,0.1)",  color: "#818cf8", border: "rgba(99,102,241,0.25)" },
    green:   { background: "rgba(52,211,153,0.1)",  color: "#6ee7b7", border: "rgba(52,211,153,0.25)" },
    default: { background: S, color: "#a1a1aa", border: SB },
  };
  const s = styles[color] ?? styles.default;
  return (
    <span className="inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium"
          style={{ background: s.background, color: s.color, border: `1px solid ${s.border}` }}>
      {label}
    </span>
  );
}

function BulletList({ items, goldDot }: { items: string[]; goldDot?: boolean }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 flex-none"
                style={{ background: goldDot ? G : DT }} />
          {item}
        </li>
      ))}
    </ul>
  );
}

function RiskBadge({ level }: { level: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    low:      { label: "נמוך",   bg: "rgba(52,211,153,0.1)",  color: "#6ee7b7" },
    medium:   { label: "בינוני", bg: "rgba(251,191,36,0.1)",  color: "#fbbf24" },
    high:     { label: "גבוה",   bg: "rgba(249,115,22,0.1)",  color: "#fb923c" },
    critical: { label: "קריטי",  bg: "rgba(239,68,68,0.1)",   color: "#f87171" },
  };
  const s = map[level] ?? map.medium;
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
          style={{ background: s.bg, color: s.color }}>{s.label}</span>
  );
}

function TimeframeBadge({ tf }: { tf: string }) {
  const map: Record<string, { label: string; color: string }> = {
    immediate:    { label: "מיידי",     color: "#f87171" },
    "short-term": { label: "קצר-טווח",  color: "#fbbf24" },
    "long-term":  { label: "ארוך-טווח", color: DT },
  };
  const s = map[tf] ?? map["long-term"];
  return <span className="text-xs" style={{ color: s.color }}>{s.label}</span>;
}

// ─── Market Position Score ────────────────────────────────────────────────────

function computeScore(report: ResearchReport): { score: number; strengths: string[]; improvements: string[] } {
  let score = 50;
  if (report.step5) score += (report.step5.overallAttractivenessScore - 5) * 5;
  if (report.step2) score += (report.step2.analysis.opportunityScore - 5) * 2;
  if (report.step3) {
    const adj: Record<string, number> = { low: 5, medium: 0, high: -10, critical: -18 };
    score += adj[report.step3.overallRiskLevel] ?? 0;
  }
  if (report.step6) {
    // High untapped marketing opportunity nudges score up (potential upside)
    score += Math.round((report.step6.overallGapScore - 5) * 0.8); // ±4
  }
  score = Math.max(5, Math.min(97, Math.round(score)));
  const strengths    = report.step4?.swotMatrix.strengths.slice(0, 3)   ?? [];
  const improvements = report.step4?.swotMatrix.weaknesses.slice(0, 3)  ?? [];
  return { score, strengths, improvements };
}

function ScoreGauge({ score }: { score: number }) {
  const R    = 52;
  const C    = 2 * Math.PI * R;
  const half = C / 2;
  const fill = (score / 100) * half;
  const arcColor = score >= 70 ? G : score >= 40 ? GD : "#9a6c10";
  const label    = score >= 70 ? "מיצוב חזק" : score >= 50 ? "טוב" : score >= 30 ? "בינוני" : "נמוך";

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="136" height="84" viewBox="0 0 136 84" aria-label={"Market Position Score " + score}>
        <circle cx="68" cy="68" r={R} fill="none" stroke={GM} strokeWidth="10"
          strokeDasharray={half + " " + (C - half)} strokeLinecap="round"
          transform="rotate(180 68 68)" />
        <circle cx="68" cy="68" r={R} fill="none" stroke={arcColor} strokeWidth="10"
          strokeDasharray={fill + " " + (C - fill)} strokeLinecap="round"
          transform="rotate(180 68 68)"
          style={{ filter: "drop-shadow(0 0 8px " + arcColor + "80)", transition: "stroke-dasharray 1s ease-out" }} />
        <text x="68" y="58" textAnchor="middle" fill="white" fontSize="28" fontWeight="800" fontFamily="Heebo,Arial">
          {score}
        </text>
        <text x="68" y="72" textAnchor="middle" fill={DT} fontSize="10" fontFamily="Heebo,Arial">/ 100</text>
        <text x="68" y="84" textAnchor="middle" fill={arcColor} fontSize="11" fontWeight="700" fontFamily="Heebo,Arial">
          {label}
        </text>
      </svg>
      <p style={{ color: G, fontSize: "9px", fontWeight: 700, letterSpacing: "0.18em" }}>
        MARKET POSITION SCORE
      </p>
    </div>
  );
}

function InsightsCards({ strengths, improvements }: { strengths: string[]; improvements: string[] }) {
  if (!strengths.length && !improvements.length) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="rounded-xl p-4 space-y-3" style={{ background: GM, border: "1px solid " + GB }}>
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 rounded-full" style={{ background: G }} />
          <p className="text-xs font-bold tracking-wide" style={{ color: G }}>נקודות לשימור</p>
        </div>
        <BulletList items={strengths.length ? strengths : ["בצע מחקר מלא לקבלת תובנות"]} goldDot />
      </div>
      <div className="rounded-xl p-4 space-y-3" style={{ background: S, border: "1px solid " + SB }}>
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 rounded-full bg-white" />
          <p className="text-xs font-bold tracking-wide text-white">נקודות לשיפור</p>
        </div>
        <BulletList items={improvements.length ? improvements : ["בצע מחקר מלא לקבלת תובנות"]} />
      </div>
    </div>
  );
}

// ─── PDF Export (client-side only, Hebrew RTL safe) ───────────────────────────

function DownloadPdfButton({ targetRef, filename }: {
  targetRef: React.RefObject<HTMLDivElement | null>;
  filename: string;
}) {
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Guard: only run on client
  useEffect(() => { setMounted(true); }, []);

  const handleDownload = async () => {
    if (!mounted || typeof window === "undefined") return;
    const el = targetRef.current;
    if (!el) return;
    setLoading(true);
    try {
      // Ensure Heebo font is loaded for html2canvas to capture correctly
      if (!document.getElementById("heebo-pdf-font")) {
        const link = document.createElement("link");
        link.id   = "heebo-pdf-font";
        link.rel  = "stylesheet";
        link.href = "https://fonts.googleapis.com/css2?family=Heebo:wght@400;700;800&display=swap";
        document.head.appendChild(link);
        // Small wait for font to load
        await new Promise<void>((r) => setTimeout(r, 400));
      }

      const [{ default: html2canvas }, jspdfMod] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      // jsPDF 4.x: named export. Older: default export. Handle both.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const JsPDF = (jspdfMod as any).jsPDF ?? (jspdfMod as any).default;

      // Scroll to top so html2canvas starts at the top of the element
      window.scrollTo({ top: 0, behavior: "instant" });
      await new Promise<void>((r) => setTimeout(r, 100));

      const canvas = await html2canvas(el, {
        scale: 2,
        backgroundColor: "#000000",
        useCORS: true,
        allowTaint: true,
        logging: false,
        scrollX: 0,
        scrollY: 0,
        // Capture the full element width, not the viewport
        width:  el.scrollWidth,
        height: el.scrollHeight,
        windowWidth:  el.scrollWidth,
        windowHeight: el.scrollHeight,
      });

      // Single data-URL call (performance)
      const imgData = canvas.toDataURL("image/jpeg", 0.92);

      const pdf  = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW  = pageW;
      const imgH  = (canvas.height * imgW) / canvas.width;

      let y = 0, page = 0;
      while (y < imgH) {
        if (page > 0) pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, -y, imgW, imgH);
        y += pageH;
        page++;
      }
      pdf.save(filename);
    } catch (err) {
      console.error("[PDF]", err);
      alert("שגיאה ביצירת ה-PDF — אנא נסה שנית");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="flex items-center gap-2 font-bold text-sm px-5 py-2.5 rounded-xl transition-all disabled:opacity-50"
      style={{
        background: loading ? GM : "linear-gradient(135deg, " + G + " 0%, " + GD + " 100%)",
        color: "#000",
        boxShadow: loading ? "none" : "0 4px 20px " + G + "40",
      }}
    >
      {loading ? (
        <>
          <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          <span>מייצר PDF...</span>
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>הורד דוח PDF</span>
        </>
      )}
    </button>
  );
}

// ─── Business Profile Card (reusable for user + competitors) ─────────────────

function BusinessCard({ profile, isUser }: { profile: CompetitorProfile; isUser?: boolean }) {
  return (
    <div className="rounded-xl p-4 space-y-3"
         style={{
           background: isUser ? "rgba(212,175,55,0.08)" : "rgba(0,0,0,0.5)",
           border: isUser ? "1px solid " + GB : "1px solid " + SB,
         }}>
      <div className="flex items-center gap-2 flex-wrap">
        <h3 className="font-bold text-white">{profile.name}</h3>
        {isUser && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: GM, color: G, border: "1px solid " + GB }}>
            העסק שלך
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: G }}>מיצוב</p>
          <p className="text-zinc-300 text-xs">{profile.identityAndNarrative.positioning}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: G }}>קהל יעד</p>
          <p className="text-zinc-300 text-xs">{profile.targetAudience.demographics}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: G }}>מחיר ומודל</p>
          <div className="flex flex-wrap gap-1">
            {profile.offer.pricingModels.map((pm, j) => <Tag key={j} label={pm} color="gold" />)}
            {profile.offer.priceRange && <Tag label={profile.offer.priceRange} />}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: G }}>ערוצים</p>
          <div className="flex flex-wrap gap-1">
            {profile.marketingAndTraffic.distributionChannels.slice(0, 4).map((ch, j) => <Tag key={j} label={ch} />)}
          </div>
        </div>
      </div>
      {profile.targetAudience.specificNeeds.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: G }}>צרכים ספציפיים</p>
          <div className="flex flex-wrap gap-1">
            {profile.targetAudience.specificNeeds.map((n, j) => <Tag key={j} label={n} color="green" />)}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step 1: Me vs. The Market ────────────────────────────────────────────────

function CompetitorAnalysisSection({ report }: { report: ResearchReport }) {
  const data = report.step1;
  if (!data) return null;
  return (
    <SectionCard icon="🔍" title="שלב 1: העסק שלי מול השוק">
      {data.marketOverview && (
        <div className="rounded-xl p-4 text-sm text-zinc-300 leading-relaxed"
             style={{ background: "rgba(0,0,0,0.4)", border: "1px solid " + SB }}>
          {data.marketOverview}
        </div>
      )}

      {/* User business — prominent */}
      {data.userProfile && (
        <div>
          <p className="text-sm font-bold mb-2" style={{ color: G }}>◆ העסק שלך</p>
          <BusinessCard profile={data.userProfile} isUser />
        </div>
      )}

      {/* Competitors */}
      {data.competitors.length > 0 && (
        <div>
          <p className="text-sm font-bold text-white mb-2">⚔️ מתחרים מרכזיים בתעשייה</p>
          <div className="space-y-3">
            {data.competitors.map((c, i) => <BusinessCard key={i} profile={c} />)}
          </div>
        </div>
      )}

      {data.indirectCompetitors.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-white mb-2">מתחרים עקיפים</p>
          <div className="flex flex-wrap gap-2">
            {data.indirectCompetitors.map((ic, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                   style={{ background: S, border: "1px solid " + SB }}>
                <span className="text-sm text-zinc-200">{ic.name}</span>
                <RiskBadge level={ic.threatLevel} />
              </div>
            ))}
          </div>
        </div>
      )}
    </SectionCard>
  );
}

// ─── Step 2: Blue Ocean ───────────────────────────────────────────────────────

function BlueOceanSection({ report }: { report: ResearchReport }) {
  const data = report.step2;
  if (!data) return null;
  return (
    <SectionCard icon="🌊" title="שלב 2: הזדמנויות שוק לעסק שלי">
      {data.topOpportunity && (
        <div className="rounded-xl p-4" style={{ background: GM, border: "1px solid " + GB }}>
          <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: G }}>ההזדמנות הגדולה ביותר</p>
          <p className="text-white font-medium text-sm">{data.topOpportunity}</p>
        </div>
      )}
      {data.analysis.opportunityScore != null && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-400">ציון הזדמנות:</span>
          <div className="flex gap-1">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="w-3.5 h-3.5 rounded-sm transition-colors"
                   style={{ background: i < data.analysis.opportunityScore ? G : SB }} />
            ))}
          </div>
          <span className="font-bold text-sm" style={{ color: G }}>{data.analysis.opportunityScore}/10</span>
        </div>
      )}
      {data.analysis.unmetNeeds.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-white mb-2">צרכים שלא נענים בשוק</p>
          <div className="space-y-2">
            {data.analysis.unmetNeeds.map((n, i) => (
              <div key={i} className="rounded-xl p-3" style={{ background: S, border: "1px solid " + SB }}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-zinc-200">{n.description}</p>
                  <span className="text-xs font-bold shrink-0" style={{ color: G }}>{n.intensityScore}/10</span>
                </div>
                {n.evidenceSources.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {n.evidenceSources.map((src, j) => <Tag key={j} label={src} color="gold" />)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {data.analysis.trendOpportunities.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-white mb-2">טרנדים כהזדמנויות</p>
          <div className="space-y-2">
            {data.analysis.trendOpportunities.map((t, i) => {
              const typeLabel: Record<string, string> = { social: "חברתי", economic: "כלכלי", technological: "טכנולוגי", regulatory: "רגולטורי" };
              return (
                <div key={i} className="rounded-xl p-3 space-y-1" style={{ background: S, border: "1px solid " + SB }}>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-white">{t.trendName}</span>
                    <Tag label={typeLabel[t.type] ?? t.type} color="gold" />
                  </div>
                  <p className="text-xs text-zinc-400">{t.description}</p>
                  <p className="text-xs" style={{ color: G }}>→ {t.howToLeverage}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {data.analysis.whitespaceInsights && (
        <div className="rounded-xl p-4" style={{ background: S, border: "1px solid " + SB }}>
          <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: DT }}>רווחים לבנים לכיבוש</p>
          <p className="text-sm text-zinc-300">{data.analysis.whitespaceInsights}</p>
        </div>
      )}
    </SectionCard>
  );
}

// ─── Step 3: Risk Analysis ────────────────────────────────────────────────────

function RiskSection({ report }: { report: ResearchReport }) {
  const data = report.step3;
  if (!data) return null;
  const groups = [
    { label: "שיבוש טכנולוגי",  items: data.technologicalDisruptions, icon: "⚙️" },
    { label: "חלופות צרכניות",   items: data.consumerAlternatives,    icon: "🔄" },
    { label: "יציבות שוק",       items: data.marketStabilityRisks,    icon: "📉" },
  ];
  return (
    <SectionCard icon="⚠️" title="שלב 3: סיכונים לעסק שלי בשוק">
      <div className="flex items-center gap-3 rounded-xl p-3" style={{ background: S, border: "1px solid " + SB }}>
        <span className="text-sm text-zinc-400">רמת סיכון כוללת:</span>
        <RiskBadge level={data.overallRiskLevel} />
      </div>
      {data.riskSummary && <p className="text-sm text-zinc-300 leading-relaxed">{data.riskSummary}</p>}
      {groups.map((g) => g.items.length > 0 && (
        <div key={g.label}>
          <p className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
            <span>{g.icon}</span><span>{g.label}</span>
          </p>
          <div className="space-y-2">
            {g.items.map((r, i) => (
              <div key={i} className="rounded-xl p-3 space-y-1" style={{ background: S, border: "1px solid " + SB }}>
                <div className="flex items-center flex-wrap gap-2">
                  <span className="font-medium text-sm text-white">{r.title}</span>
                  <RiskBadge level={r.severity} />
                  <TimeframeBadge tf={r.timeframe} />
                </div>
                <p className="text-xs text-zinc-400">{r.description}</p>
                <p className="text-xs" style={{ color: G }}>🛡 {r.mitigationStrategy}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </SectionCard>
  );
}

// ─── Step 4: Executive Summary ────────────────────────────────────────────────

function ExecutiveSummarySection({ report }: { report: ResearchReport }) {
  const data = report.step4;
  if (!data) return null;
  return (
    <SectionCard icon="📊" title="שלב 4: תקציר מנהלים — אני מול השוק">
      {data.executiveOneLiner && (
        <div className="rounded-xl p-5 text-center" style={{ background: GM, border: "1px solid " + GB }}>
          <p className="text-white font-semibold text-base leading-relaxed">{data.executiveOneLiner}</p>
        </div>
      )}
      {data.audienceMap.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-white mb-2">🎯 מפת קהל יעד</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {data.audienceMap.map((seg, i) => (
              <div key={i} className="rounded-xl p-3 space-y-2" style={{ background: S, border: "1px solid " + SB }}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-white text-sm">{seg.name}</span>
                  <Tag label={seg.willingnessToPay === "high" ? "נכונות גבוהה" : seg.willingnessToPay === "low" ? "נמוכה" : "בינונית"}
                       color={seg.willingnessToPay === "high" ? "gold" : "default"} />
                </div>
                <BulletList items={seg.burningPainPoints} />
              </div>
            ))}
          </div>
        </div>
      )}
      {data.blueOceanERRC && (
        <div>
          <p className="text-sm font-semibold text-white mb-2">🌊 מטריצת ERRC — הבידול שלי</p>
          {data.blueOceanERRC.blueOceanStatement && (
            <div className="rounded-xl p-3 mb-2" style={{ background: GM, border: "1px solid " + GB }}>
              <p className="text-sm text-white">{data.blueOceanERRC.blueOceanStatement}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            {([
              { key: "eliminate" as const, label: "הסר", icon: "🗑️" },
              { key: "reduce"    as const, label: "הפחת", icon: "📉" },
              { key: "raise"     as const, label: "הרם",  icon: "📈" },
              { key: "create"    as const, label: "צור",  icon: "✨" },
            ]).map(({ key, label, icon }) => (
              <div key={key} className="rounded-xl p-3 space-y-1.5" style={{ background: S, border: "1px solid " + SB }}>
                <p className="text-xs font-bold" style={{ color: G }}>{icon} {label}</p>
                {data.blueOceanERRC[key].map((item, i) => (
                  <p key={i} className="text-xs text-zinc-300 flex items-start gap-1.5">
                    <span style={{ color: DT }}>•</span>{item}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
      {data.swotMatrix && (
        <div>
          <p className="text-sm font-semibold text-white mb-2">🔲 SWOT — מיצוב שוק</p>
          <div className="grid grid-cols-2 gap-2 mb-2">
            {([
              { key: "strengths"     as const, label: "חוזקות",    color: G },
              { key: "weaknesses"    as const, label: "חולשות",    color: "#f87171" },
              { key: "opportunities" as const, label: "הזדמנויות", color: "#818cf8" },
              { key: "threats"       as const, label: "איומים",    color: "#fb923c" },
            ]).map(({ key, label, color }) => (
              <div key={key} className="rounded-xl p-3 space-y-1" style={{ background: S, border: "1px solid " + SB }}>
                <p className="text-xs font-bold" style={{ color }}>{label}</p>
                {data.swotMatrix[key].slice(0, 3).map((item, i) => (
                  <p key={i} className="text-xs text-zinc-300 flex items-start gap-1.5">
                    <span style={{ color: DT }}>•</span>{item}
                  </p>
                ))}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="rounded-xl p-3" style={{ background: GM, border: "1px solid " + GB }}>
              <p className="text-xs font-bold mb-2" style={{ color: G }}>⚡ פעל עכשיו</p>
              <BulletList items={data.swotMatrix.actNow} goldDot />
            </div>
            <div className="rounded-xl p-3" style={{ background: S, border: "1px solid " + SB }}>
              <p className="text-xs font-bold mb-2 text-red-400">🚫 הימנע</p>
              <BulletList items={data.swotMatrix.avoid} />
            </div>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

// ─── Step 5: Porter's Five Forces ─────────────────────────────────────────────

function PorterScoreBar({ score }: { score: number }) {
  const pct   = Math.round((score / 10) * 100);
  const color = score >= 7 ? G : score >= 4 ? GD : "#9a6c10";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div className="h-full rounded-full transition-all duration-700"
             style={{ width: pct + "%", background: color }} />
      </div>
      <span className="text-xs font-bold tabular-nums w-8 text-right" style={{ color }}>{score}/10</span>
    </div>
  );
}

function PortersSection({ report }: { report: ResearchReport }) {
  const data = report.step5;
  if (!data) return null;
  const forces = [
    { key: "rivalry"       as const, icon: "⚔️" },
    { key: "newEntrants"   as const, icon: "🚪" },
    { key: "supplierPower" as const, icon: "🏭" },
    { key: "buyerPower"    as const, icon: "🛒" },
    { key: "substitutes"   as const, icon: "🔄" },
  ];
  const overall = data.overallAttractivenessScore;
  const overallColor = overall >= 7 ? G : overall >= 4 ? GD : "#9a6c10";
  return (
    <SectionCard icon="🏛️" title="שלב 5: חמשת הכוחות של פורטר — פרספקטיבת העסק">
      <div className="rounded-xl p-4 space-y-3" style={{ background: GM, border: "1px solid " + GB }}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-white">ציון אטרקטיביות שוק לעסק שלי</span>
          <span className="text-2xl font-extrabold tabular-nums" style={{ color: overallColor }}>{overall}/10</span>
        </div>
        <PorterScoreBar score={overall} />
        {data.strategicImplication && (
          <p className="text-sm text-zinc-300 leading-relaxed pt-1">{data.strategicImplication}</p>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {forces.map(({ key, icon }) => {
          const f = data[key];
          return (
            <div key={key} className="rounded-xl p-4 space-y-2" style={{ background: S, border: "1px solid " + GB }}>
              <div className="flex items-center gap-2">
                <span className="text-base">{icon}</span>
                <p className="text-sm font-bold text-white leading-snug">{f.name}</p>
              </div>
              <PorterScoreBar score={f.score} />
              <p className="text-xs text-zinc-400 leading-relaxed">{f.analysis}</p>
              {f.keyFactors.length > 0 && (
                <ul className="space-y-0.5 pt-1">
                  {f.keyFactors.map((factor, i) => (
                    <li key={i} className="text-xs text-zinc-300 flex items-start gap-1.5">
                      <span style={{ color: G, flexShrink: 0 }}>◆</span>{factor}
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

// ─── Copy to Clipboard Button ─────────────────────────────────────────────────

function CopyButton({ text, label = "העתק" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select the text manually
    }
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all shrink-0"
      style={{
        background: copied ? GM : "rgba(255,255,255,0.05)",
        color: copied ? G : "rgba(255,255,255,0.5)",
        border: `1px solid ${copied ? GB : "rgba(255,255,255,0.1)"}`,
      }}
    >
      {copied ? (
        <>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          הועתק
        </>
      ) : (
        <>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          {label}
        </>
      )}
    </button>
  );
}

// ─── Asset Card wrapper ────────────────────────────────────────────────────────

function AssetCard({ badge, badgeColor = G, children, copyText }: {
  badge: string;
  badgeColor?: string;
  children: React.ReactNode;
  copyText: string;
}) {
  return (
    <div className="rounded-xl p-5 space-y-4"
         style={{ background: "rgba(0,0,0,0.5)", border: `1px solid ${GB}` }}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-black uppercase tracking-widest px-2.5 py-1 rounded-full"
              style={{ background: GM, color: badgeColor, border: `1px solid ${GB}` }}>
          {badge}
        </span>
        <CopyButton text={copyText} />
      </div>
      {children}
    </div>
  );
}

// ─── Step 7: Strategic Content Assets ─────────────────────────────────────────

const PLATFORM_ICON: Record<string, string> = {
  instagram: "📸", tiktok: "🎵", facebook: "👥", linkedin: "💼",
  google: "🔍", meta: "📣", both: "📣",
};
const FORMAT_LABEL: Record<string, string> = {
  reel: "ריל", post: "פוסט", carousel: "קרוסלה", story: "סטורי",
};

function ContentAssetsSection({ report }: { report: ResearchReport }) {
  const data: Step7ContentAssets | undefined = report.step7;
  if (!data) return null;

  const adCopyText = [
    `📢 ${data.adCopy.headline}`,
    `${data.adCopy.subheadline}`,
    ``,
    data.adCopy.bodyText,
    ``,
    `👉 ${data.adCopy.callToAction}`,
  ].join("\n");

  const headlineText = [
    data.landingPageHeadline.main,
    data.landingPageHeadline.sub,
    `→ ${data.landingPageHeadline.cta}`,
  ].join("\n");

  return (
    <SectionCard icon="✍️" title="שלב 7: תוכן אסטרטגי מוכן לשימוש">

      {/* Strategic angle callout */}
      {data.strategicAngle && (
        <div className="rounded-xl p-4 flex items-start gap-3"
             style={{ background: GM, border: `1px solid ${GB}` }}>
          <span className="text-xl shrink-0 mt-0.5">🎯</span>
          <div>
            <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: G }}>
              הזווית התחרותית שלך
            </p>
            <p className="text-white font-semibold text-sm leading-relaxed">{data.strategicAngle}</p>
          </div>
        </div>
      )}

      {/* Ad Copy */}
      {data.adCopy && (
        <AssetCard
          badge={`📣 Ad Copy — ${data.adCopy.platform === "google" ? "Google Ads" : data.adCopy.platform === "meta" ? "Meta Ads" : "Google & Meta"}`}
          copyText={adCopyText}
        >
          <div className="space-y-3">
            <div>
              <p className="text-xs text-zinc-500 mb-1">כותרת</p>
              <p className="text-lg font-black text-white leading-tight">{data.adCopy.headline}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-1">תת-כותרת</p>
              <p className="text-sm font-semibold text-zinc-200">{data.adCopy.subheadline}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-1">גוף הפרסומת</p>
              <p className="text-sm text-zinc-300 leading-relaxed">{data.adCopy.bodyText}</p>
            </div>
            <div className="pt-1">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold"
                    style={{ background: G, color: "#000" }}>
                {data.adCopy.callToAction}
              </span>
            </div>
          </div>
        </AssetCard>
      )}

      {/* Landing Page Headline */}
      {data.landingPageHeadline && (
        <AssetCard badge="🌐 כותרת דף נחיתה" copyText={headlineText}>
          <div className="space-y-3 text-center py-2">
            <p className="text-2xl font-black text-white leading-tight">{data.landingPageHeadline.main}</p>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-md mx-auto">{data.landingPageHeadline.sub}</p>
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: `linear-gradient(135deg, ${G} 0%, ${GD} 100%)`, color: "#000",
                           boxShadow: `0 4px 20px ${G}40` }}>
              {data.landingPageHeadline.cta}
            </span>
          </div>
        </AssetCard>
      )}

      {/* Social Posts */}
      {data.socialPosts.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-white mb-3">
            📱 3 פוסטים/ריילז ויראליים — מוכנים לפרסום
          </p>
          <div className="space-y-3">
            {data.socialPosts.map((post, i) => {
              const postText = [
                post.hook,
                ``,
                post.content,
                ``,
                `#${post.platform} #${post.format}`,
              ].join("\n");
              const platformIcon = PLATFORM_ICON[post.platform] ?? "📱";
              const formatLabel  = FORMAT_LABEL[post.format]   ?? post.format;
              return (
                <AssetCard
                  key={i}
                  badge={`${platformIcon} ${post.platform.charAt(0).toUpperCase() + post.platform.slice(1)} — ${formatLabel}`}
                  copyText={postText}
                >
                  <div className="space-y-3">
                    {post.concept && (
                      <p className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                         style={{ background: "rgba(212,175,55,0.08)", color: G }}>
                        💡 {post.concept}
                      </p>
                    )}
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">שורת פתיחה (Hook)</p>
                      <p className="text-base font-bold text-white leading-snug">{post.hook}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">סקריפט</p>
                      <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">{post.content}</p>
                    </div>
                  </div>
                </AssetCard>
              );
            })}
          </div>
        </div>
      )}
    </SectionCard>
  );
}

// ─── Step 6: Marketing Gap Analysis ──────────────────────────────────────────

const PRESENCE_LABEL: Record<string, string> = {
  strong:   "חזק",
  moderate: "בינוני",
  weak:     "חלש",
  none:     "נעדר",
};

const PRESENCE_COLOR: Record<string, string> = {
  strong:   "#6ee7b7",
  moderate: "#fbbf24",
  weak:     "#fb923c",
  none:     "#f87171",
};

const GAP_COLOR: Record<string, string> = {
  high:   G,
  medium: "#fbbf24",
  low:    "rgba(255,255,255,0.3)",
};

const GAP_LABEL: Record<string, string> = {
  high:   "פער גבוה ⚡",
  medium: "פוטנציאל",
  low:    "מינימלי",
};

const EFFORT_LABEL: Record<string, string> = {
  low:    "מאמץ נמוך",
  medium: "מאמץ בינוני",
  high:   "מאמץ גבוה",
};

const IMPACT_LABEL: Record<string, string> = {
  high:   "השפעה גבוהה",
  medium: "השפעה בינונית",
  low:    "השפעה נמוכה",
};

function PresenceDot({ level }: { level: string }) {
  const color = PRESENCE_COLOR[level] ?? DT;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold"
          style={{ color }}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
      {PRESENCE_LABEL[level] ?? level}
    </span>
  );
}

function MarketingGapSection({ report }: { report: ResearchReport }) {
  const data: Step6MarketingGapAnalysis | undefined = report.step6;
  if (!data) return null;

  const highGaps   = data.channelGaps.filter((c) => c.gapLevel === "high");
  const otherGaps  = data.channelGaps.filter((c) => c.gapLevel !== "high");

  return (
    <SectionCard icon="📊" title="שלב 6: ניתוח פערים שיווקי — אני מול המתחרים">

      {/* Big Gap + Opportunity callout */}
      {(data.biggestGap || data.biggestOpportunity) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {data.biggestGap && (
            <div className="rounded-xl p-4 space-y-1" style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#f87171" }}>הפער הגדול ביותר</p>
              <p className="text-sm text-zinc-200 leading-relaxed">{data.biggestGap}</p>
            </div>
          )}
          {data.biggestOpportunity && (
            <div className="rounded-xl p-4 space-y-1" style={{ background: GM, border: "1px solid " + GB }}>
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: G }}>הזדמנות גדולה לניצול</p>
              <p className="text-sm text-zinc-200 leading-relaxed">{data.biggestOpportunity}</p>
            </div>
          )}
        </div>
      )}

      {/* Overall gap score */}
      {data.overallGapScore != null && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-400">ציון פוטנציאל שיווקי לא מנוצל:</span>
          <div className="flex gap-1">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="w-3.5 h-3.5 rounded-sm transition-colors"
                   style={{ background: i < data.overallGapScore ? G : SB }} />
            ))}
          </div>
          <span className="font-bold text-sm" style={{ color: G }}>{data.overallGapScore}/10</span>
        </div>
      )}

      {/* Gap comparison table */}
      {data.channelGaps.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-white mb-3">השוואת ערוצי שיווק — אני מול המתחרים</p>

          {/* High-gap channels first */}
          {highGaps.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: G }}>
                ⚡ ערוצים עם פער גבוה — הזדמנויות מיידיות
              </p>
              <div className="space-y-2">
                {highGaps.map((gap, i) => (
                  <div key={i} className="rounded-xl p-4 space-y-2"
                       style={{ background: GM, border: "1px solid " + GB }}>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-bold text-white text-sm">{gap.channel}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{ background: "rgba(212,175,55,0.2)", color: GAP_COLOR[gap.gapLevel] ?? DT }}>
                        {GAP_LABEL[gap.gapLevel]}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-0.5">
                        <p className="text-xs text-zinc-500">העסק שלך</p>
                        <PresenceDot level={gap.userPresence} />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs text-zinc-500">המתחרים</p>
                        <PresenceDot level={gap.competitorPresence} />
                      </div>
                    </div>
                    {gap.insight && (
                      <p className="text-xs text-zinc-300 leading-relaxed border-t pt-2"
                         style={{ borderColor: "rgba(212,175,55,0.2)" }}>
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
              <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: DT }}>
                שאר הערוצים
              </p>
              <div className="rounded-xl overflow-hidden" style={{ border: "1px solid " + SB }}>
                {/* Header */}
                <div className="grid grid-cols-4 gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wide"
                     style={{ background: "rgba(255,255,255,0.04)", color: DT }}>
                  <span>ערוץ</span>
                  <span>אני</span>
                  <span>מתחרים</span>
                  <span>פער</span>
                </div>
                {otherGaps.map((gap, i) => (
                  <div key={i}
                       className="grid grid-cols-4 gap-2 px-4 py-3 text-xs items-center"
                       style={{
                         borderTop: "1px solid " + SB,
                         background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)",
                       }}>
                    <span className="font-medium text-zinc-300">{gap.channel}</span>
                    <PresenceDot level={gap.userPresence} />
                    <PresenceDot level={gap.competitorPresence} />
                    <span className="font-semibold text-xs"
                          style={{ color: GAP_COLOR[gap.gapLevel] ?? DT }}>
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
          <p className="text-sm font-semibold text-white mb-3">
            🍋 Low Hanging Fruit — פעולות מיידיות לביצוע
          </p>
          <div className="space-y-3">
            {data.lowHangingFruits.map((fruit, i) => (
              <div key={i} className="rounded-xl p-4 space-y-2"
                   style={{ background: S, border: "1px solid " + GB }}>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-xs font-black"
                       style={{ background: GM, color: G, border: "1px solid " + GB }}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm leading-snug">{fruit.action}</p>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{fruit.reason}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap pr-9">
                  <Tag label={fruit.channel} color="gold" />
                  <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: fruit.effort === "low"
                            ? "rgba(52,211,153,0.1)"
                            : fruit.effort === "medium"
                            ? "rgba(251,191,36,0.1)"
                            : "rgba(239,68,68,0.1)",
                          color: fruit.effort === "low"
                            ? "#6ee7b7"
                            : fruit.effort === "medium"
                            ? "#fbbf24"
                            : "#f87171",
                        }}>
                    {EFFORT_LABEL[fruit.effort] ?? fruit.effort}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: fruit.impact === "high"
                            ? GM
                            : fruit.impact === "medium"
                            ? "rgba(251,191,36,0.1)"
                            : "rgba(255,255,255,0.04)",
                          color: fruit.impact === "high"
                            ? G
                            : fruit.impact === "medium"
                            ? "#fbbf24"
                            : DT,
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

// ─── Main Export ──────────────────────────────────────────────────────────────

interface Props { report: ResearchReport; }

export default function ReportDisplay({ report }: Props) {
  const reportRef   = useRef<HTMLDivElement>(null);
  const allComplete = report.steps.every((s) => s.status === "completed");
  const { score, strengths, improvements } = computeScore(report);

  const hostname = (() => {
    try { return new URL(report.query.competitorUrl).hostname.replace(/^www\./, ""); }
    catch { return "report"; }
  })();
  const pdfFilename = "MarketLens-" + hostname + "-" + new Date(report.createdAt).toISOString().slice(0, 10) + ".pdf";

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      {/* Header card */}
      <div className="rounded-2xl p-5 fade-in-up" style={{ background: S, border: "1px solid " + GB }}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest mb-1"
               style={{ color: G, letterSpacing: "0.18em" }}>
              דוח השוואתי — העסק שלי מול השוק
            </p>
            <h1 className="text-lg font-bold text-white font-mono truncate" dir="ltr">
              {report.query.competitorUrl}
            </h1>
            {report.query.additionalDetails && (
              <p className="text-sm text-zinc-400 mt-1 truncate">{report.query.additionalDetails}</p>
            )}
            <p className="text-xs text-zinc-600 mt-1">
              {new Date(report.createdAt).toLocaleString("he-IL")}
            </p>
          </div>
          <div className="flex items-center gap-4 flex-wrap shrink-0">
            <ScoreGauge score={score} />
            <div className="flex flex-col gap-2">
              {allComplete && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
                      style={{ background: GM, color: G, border: "1px solid " + GB }}>
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

      {/* Quick insights */}
      <InsightsCards strengths={strengths} improvements={improvements} />

      {/* All sections */}
      <div ref={reportRef} className="space-y-6">
        <CompetitorAnalysisSection report={report} />
        <BlueOceanSection report={report} />
        <RiskSection report={report} />
        <ExecutiveSummarySection report={report} />
        <PortersSection report={report} />
        <MarketingGapSection report={report} />
        <ContentAssetsSection report={report} />
      </div>
    </div>
  );
}
