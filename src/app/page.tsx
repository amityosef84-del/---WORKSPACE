"use client";

import { useState, useRef, useCallback } from "react";
import ResearchForm from "@/components/ResearchForm";
import ResearchRoadmap from "@/components/ResearchRoadmap";
import ReportDisplay from "@/components/ReportDisplay";
import type {
  ResearchReport, PipelineStep, SSEEvent,
  Step1CompetitorAnalysis, Step2BlueOcean, Step3RiskAnalysis,
  Step4ExecutiveSummary, Step5PorterAnalysis,
  ResearchMode, FocusedCategory,
} from "@/types/research";

const GOLD        = "#D4AF37";
const GOLD_MUTED  = "rgba(212,175,55,0.12)";
const GOLD_BORDER = "rgba(212,175,55,0.22)";

const ALL_STEPS: PipelineStep[] = [
  { id: 0, nameEn: "Digital Asset Scan",    nameHe: "סריקת נכסים דיגיטליים",         status: "pending" },
  { id: 1, nameEn: "Competitor Analysis",   nameHe: "ניתוח מתחרים מעמיק",             status: "pending" },
  { id: 2, nameEn: "Blue Ocean",            nameHe: "אוקיינוס כחול (הזדמנויות)",      status: "pending" },
  { id: 3, nameEn: "Risk Analysis",         nameHe: "ניתוח סיכונים ואיומים",          status: "pending" },
  { id: 4, nameEn: "Executive Summary",     nameHe: "סיכום מנהלים ותובנות",           status: "pending" },
  { id: 5, nameEn: "Porter's Five Forces",  nameHe: "חמשת הכוחות של פורטר",          status: "pending" },
];

type AppState = "idle" | "running" | "complete" | "error";

export default function HomePage() {
  const [appState, setAppState]         = useState<AppState>("idle");
  const [steps, setSteps]               = useState<PipelineStep[]>(ALL_STEPS);
  const [report, setReport]             = useState<ResearchReport | null>(null);
  const [error, setError]               = useState<string | null>(null);
  const [scrapeWarning, setScrapeWarning] = useState<string | null>(null);
  const partialReport = useRef<Partial<ResearchReport>>({});

  const updateStep = useCallback((id: 0|1|2|3|4|5, patch: Partial<PipelineStep>) => {
    setSteps((prev) => prev.map((s) => s.id === id ? { ...s, ...patch } : s));
  }, []);

  const handleSSEEvent = useCallback((event: SSEEvent) => {
    switch (event.type) {
      case "step_start":
        updateStep(event.stepId!, { status: "running", startedAt: Date.now() });
        break;
      case "step_complete":
        updateStep(event.stepId!, {
          status: "completed", completedAt: Date.now(),
          partial: event.partial ?? false,
          skipped: event.skipped ?? false,
        });
        if (event.stepId === 1) partialReport.current.step1 = event.data as Step1CompetitorAnalysis;
        if (event.stepId === 2) partialReport.current.step2 = event.data as Step2BlueOcean;
        if (event.stepId === 3) partialReport.current.step3 = event.data as Step3RiskAnalysis;
        if (event.stepId === 4) partialReport.current.step4 = event.data as Step4ExecutiveSummary;
        if (event.stepId === 5) partialReport.current.step5 = event.data as Step5PorterAnalysis;
        break;
      case "step_error":
        updateStep(event.stepId!, { status: "error", error: event.error });
        break;
      case "pipeline_complete":
        if (event.report) { setReport(event.report); setAppState("complete"); }
        break;
      case "scrape_warning":
        setScrapeWarning("לא הצלחנו לסרוק את האתר, ממשיכים בניתוח על בסיס מידע קיים");
        break;
      case "pipeline_error":
        setError(event.error ?? "אירעה שגיאה לא ידועה");
        setAppState("error");
        break;
    }
  }, [updateStep]);

  const handleSubmit = useCallback(async (
    url: string, details?: string,
    mode?: ResearchMode, focusedCategory?: FocusedCategory,
  ) => {
    setAppState("running");
    setError(null); setReport(null); setScrapeWarning(null);
    partialReport.current = {};
    setSteps(ALL_STEPS.map((s) => ({ ...s, status: "pending" })));
    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competitorUrl: url, additionalDetails: details, mode, focusedCategory }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      if (!res.body) throw new Error("No response body");
      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";
        for (const chunk of lines) {
          const line = chunk.trim();
          if (!line.startsWith("data: ")) continue;
          try { handleSSEEvent(JSON.parse(line.slice(6).trim())); } catch { /* ignore */ }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setAppState("error");
    }
  }, [handleSSEEvent]);

  const handleReset = () => {
    setAppState("idle");
    setSteps(ALL_STEPS.map((s) => ({ ...s, status: "pending" })));
    setReport(null); setError(null); setScrapeWarning(null);
    partialReport.current = {};
  };

  const isRunning = appState === "running";

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 backdrop-blur-md"
              style={{ background: "rgba(0,0,0,0.85)", borderBottom: `1px solid ${GOLD_BORDER}` }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {/* Logo ring */}
            <div className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-base"
                 style={{ border: `1.5px solid ${GOLD}`, background: GOLD_MUTED }}>
              🔭
            </div>
            <div className="min-w-0">
              <h1 className="font-black text-white text-base leading-tight tracking-tight">MarketLens AI</h1>
              <p className="text-xs truncate" style={{ color: GOLD }}>Strategic Market Intelligence</p>
            </div>
          </div>
          {appState !== "idle" && (
            <button onClick={handleReset}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all shrink-0"
              style={{ border: `1px solid ${GOLD_BORDER}`, color: GOLD, background: "transparent" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = GOLD_MUTED; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
              מחקר חדש
            </button>
          )}
        </div>
        {/* Gold gradient line under header */}
        <div className="h-px w-full" style={{ background: `linear-gradient(90deg, transparent 0%, ${GOLD} 50%, transparent 100%)`, opacity: 0.3 }} />
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 overflow-x-hidden">

        {/* ── Hero (idle only) ──────────────────────────────────────────────── */}
        {appState === "idle" && (
          <div className="text-center space-y-5 py-12 sm:py-16 fade-in-up">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase"
                 style={{ background: GOLD_MUTED, border: `1px solid ${GOLD_BORDER}`, color: GOLD }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: GOLD }} />
              Powered by Claude Opus 4.6
            </div>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight text-white">
              תובנות שוק אסטרטגיות
              <br />
              <span className="text-gold-gradient">בתוך פחות מ-5 דקות</span>
            </h2>

            <p className="text-zinc-400 text-lg max-w-xl mx-auto leading-relaxed">
              הדבק קישור לאתר המתחרה — המערכת סורקת, מנתחת, ומייצרת
              דוח אסטרטגי מקיף עם ניתוח פורטר, SWOT, וציון שוק 0–100
            </p>
          </div>
        )}

        <div className={`grid gap-8 ${appState !== "idle" ? "lg:grid-cols-[400px_1fr]" : "max-w-2xl mx-auto"}`}>

          {/* ── Left panel ──────────────────────────────────────────────────── */}
          <div className="space-y-5 min-w-0">
            {/* Form card */}
            <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${GOLD_BORDER}` }}>
              <ResearchForm onSubmit={handleSubmit} isLoading={isRunning} />
            </div>

            {/* Mini step tracker (while running) */}
            {appState !== "idle" && (
              <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid rgba(255,255,255,0.07)` }}>
                <div className="space-y-2">
                  {steps.map((step) => {
                    const isSkipped  = step.status === "completed" && step.skipped;
                    const isDone     = step.status === "completed" && !step.skipped;
                    const isRunning2 = step.status === "running";
                    const isError    = step.status === "error";
                    return (
                      <div key={step.id} className="flex items-center gap-2.5 min-w-0">
                        {/* dot */}
                        {isSkipped  && <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "rgba(255,255,255,0.15)" }} />}
                        {isDone     && <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: GOLD }} />}
                        {isRunning2 && <div className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse" style={{ background: GOLD }} />}
                        {isError    && <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-red-500" />}
                        {step.status === "pending" && <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-zinc-700" />}
                        <span className="text-xs font-medium truncate"
                              style={{ color: isDone ? GOLD : isRunning2 ? "#fff" : isError ? "#f87171" : isSkipped ? "rgba(255,255,255,0.2)" : "#52525b" }}>
                          {step.nameHe}
                          {isSkipped ? " — דולג" : ""}
                        </span>
                        {isDone && (
                          <svg className="w-3 h-3 shrink-0 mr-auto" fill="none" viewBox="0 0 24 24" stroke={GOLD} strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Steps preview (idle only) */}
            {appState === "idle" && (
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-center" style={{ color: GOLD, letterSpacing: "0.18em" }}>
                  6 שלבי AI
                </p>
                {ALL_STEPS.map((step) => (
                  <div key={step.id} className="flex items-center gap-3 text-sm rounded-xl px-4 py-2.5"
                       style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <span className="font-bold tabular-nums text-xs w-4 text-center shrink-0" style={{ color: GOLD }}>
                      {step.id}
                    </span>
                    <span className="text-zinc-400 truncate">{step.nameHe}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Right panel ─────────────────────────────────────────────────── */}
          {appState !== "idle" && (
            <div className="min-w-0 overflow-x-hidden">
              {error && appState === "error" && (
                <div className="rounded-2xl p-6 space-y-3"
                     style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)" }}>
                  <h3 className="text-red-400 font-bold flex items-center gap-2">❌ שגיאה בעיבוד</h3>
                  <p className="text-sm text-red-400">{error}</p>
                  <p className="text-xs text-red-600">ודא שמשתנה הסביבה ANTHROPIC_API_KEY מוגדר ותקין.</p>
                </div>
              )}
              {isRunning && !report && <ResearchRoadmap steps={steps} />}
              {report && <ReportDisplay report={report} />}
            </div>
          )}
        </div>
      </main>

      {/* ── Scrape warning toast ────────────────────────────────────────────── */}
      {scrapeWarning && (
        <div className="fixed bottom-6 left-6 z-50 max-w-sm rounded-2xl px-5 py-4 shadow-2xl flex items-start gap-3 fade-in"
             style={{ background: "rgba(10,10,10,0.95)", border: `1px solid rgba(251,191,36,0.4)`, color: "#fbbf24" }}>
          <span className="text-lg mt-0.5 shrink-0">⚠️</span>
          <p className="text-sm font-medium flex-1 leading-snug">{scrapeWarning}</p>
          <button onClick={() => setScrapeWarning(null)} className="text-lg leading-none shrink-0 opacity-60 hover:opacity-100">×</button>
        </div>
      )}

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="mt-20 py-6 text-center text-xs" style={{ borderTop: `1px solid rgba(255,255,255,0.05)`, color: "rgba(255,255,255,0.2)" }}>
        MarketLens AI · Claude Opus 4.6 · כל הניתוחים בעברית
      </footer>
    </div>
  );
}
