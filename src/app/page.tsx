"use client";

import { useState, useRef, useCallback } from "react";
import ResearchForm from "@/components/ResearchForm";
import ResearchRoadmap from "@/components/ResearchRoadmap";
import ReportDisplay from "@/components/ReportDisplay";
import type {
  ResearchReport,
  PipelineStep,
  SSEEvent,
  Step1CompetitorAnalysis,
  Step2BlueOcean,
  Step3RiskAnalysis,
  Step4ExecutiveSummary,
} from "@/types/research";

const INITIAL_STEPS: PipelineStep[] = [
  { id: 0, nameEn: "סריקת אתר המתחרה",             nameHe: "סריקת אתר המתחרה",             status: "pending" },
  { id: 1, nameEn: "ניתוח מתחרים מעמיק",            nameHe: "ניתוח מתחרים מעמיק",            status: "pending" },
  { id: 2, nameEn: "אוקיינוס כחול (הזדמנויות בשוק)", nameHe: "אוקיינוס כחול (הזדמנויות בשוק)", status: "pending" },
  { id: 3, nameEn: "ניתוח סיכונים ואיומים",          nameHe: "ניתוח סיכונים ואיומים",          status: "pending" },
  { id: 4, nameEn: "סיכום מנהלים ותובנות",           nameHe: "סיכום מנהלים ותובנות",           status: "pending" },
];

type AppState = "idle" | "running" | "complete" | "error";

export default function HomePage() {
  const [appState, setAppState] = useState<AppState>("idle");
  const [steps, setSteps] = useState<PipelineStep[]>(INITIAL_STEPS);
  const [report, setReport] = useState<ResearchReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scrapeWarning, setScrapeWarning] = useState<string | null>(null);

  const partialReport = useRef<Partial<ResearchReport>>({});

  const updateStep = useCallback((id: 0 | 1 | 2 | 3 | 4, patch: Partial<PipelineStep>) => {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }, []);

  const handleSSEEvent = useCallback(
    (event: SSEEvent) => {
      switch (event.type) {
        case "step_start":
          updateStep(event.stepId!, { status: "running", startedAt: Date.now() });
          break;
        case "step_complete":
          updateStep(event.stepId!, { status: "completed", completedAt: Date.now() });
          if (event.stepId === 1) partialReport.current.step1 = event.data as Step1CompetitorAnalysis;
          if (event.stepId === 2) partialReport.current.step2 = event.data as Step2BlueOcean;
          if (event.stepId === 3) partialReport.current.step3 = event.data as Step3RiskAnalysis;
          if (event.stepId === 4) partialReport.current.step4 = event.data as Step4ExecutiveSummary;
          break;
        case "step_error":
          updateStep(event.stepId!, { status: "error", error: event.error });
          break;
        case "pipeline_complete":
          if (event.report) {
            setReport(event.report);
            setAppState("complete");
          }
          break;
        case "scrape_warning":
          setScrapeWarning("לא הצלחנו לסרוק את האתר, ממשיכים בניתוח על בסיס מידע קיים");
          break;
        case "pipeline_error":
          setError(event.error ?? "אירעה שגיאה לא ידועה");
          setAppState("error");
          break;
      }
    },
    [updateStep],
  );

  const handleSubmit = useCallback(
    async (url: string, details?: string) => {
      setAppState("running");
      setError(null);
      setReport(null);
      setScrapeWarning(null);
      partialReport.current = {};
      setSteps(INITIAL_STEPS.map((s) => ({ ...s, status: "pending" })));

      try {
        const res = await fetch("/api/research", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ competitorUrl: url, additionalDetails: details }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
        }

        if (!res.body) throw new Error("No response body");

        const reader = res.body.getReader();
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
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;
            try {
              handleSSEEvent(JSON.parse(jsonStr));
            } catch {
              // ignore malformed frames
            }
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        setAppState("error");
      }
    },
    [handleSSEEvent],
  );

  const handleReset = () => {
    setAppState("idle");
    setSteps(INITIAL_STEPS.map((s) => ({ ...s, status: "pending" })));
    setReport(null);
    setError(null);
    setScrapeWarning(null);
    partialReport.current = {};
  };

  const isRunning = appState === "running";

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-lg shadow-lg shadow-blue-900/30">
              🔭
            </div>
            <div>
              <h1 className="font-bold text-white text-lg leading-tight">MarketLens AI</h1>
              <p className="text-xs text-slate-400">מחקר שוק ומתחרים מבוסס-AI</p>
            </div>
          </div>
          {appState !== "idle" && (
            <button
              onClick={handleReset}
              className="text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded-lg transition-all"
            >
              מחקר חדש
            </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Hero — only on idle */}
        {appState === "idle" && (
          <div className="text-center space-y-3 py-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              נתח כל מתחרה{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                רק עם ה-URL שלו
              </span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              הדבק קישור לאתר המתחרה — המערכת סורקת אותו אוטומטית ומריצה 4 שלבי AI עוקבים:
              ניתוח מתחרים, זיהוי הזדמנויות, ניתוח סיכונים, ותקציר מנהלים.
            </p>
          </div>
        )}

        <div className={`grid gap-8 ${appState !== "idle" ? "lg:grid-cols-[380px_1fr]" : "max-w-2xl mx-auto"}`}>
          {/* Left panel */}
          <div className="space-y-6">
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
              <ResearchForm onSubmit={handleSubmit} isLoading={isRunning} />
            </div>

            {appState !== "idle" && (
              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
                <div className="space-y-2">
                  {steps.map((step) => {
                    const dotColor =
                      step.status === "completed" ? "bg-emerald-400"
                      : step.status === "running"  ? "bg-blue-400 animate-pulse"
                      : step.status === "error"    ? "bg-red-400"
                      : "bg-slate-600";
                    const textColor =
                      step.status === "completed" ? "text-emerald-300"
                      : step.status === "running"  ? "text-white"
                      : step.status === "error"    ? "text-red-400"
                      : "text-slate-500";
                    return (
                      <div key={step.id} className="flex items-center gap-2.5">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
                        <span className={`text-xs font-medium ${textColor}`}>
                          {step.nameHe}
                        </span>
                        {step.status === "completed" && (
                          <svg className="w-3 h-3 text-emerald-500 mr-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {appState === "idle" && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide text-center">
                  תהליך ה-AI
                </p>
                {INITIAL_STEPS.map((step) => (
                  <div
                    key={step.id}
                    className="flex items-center gap-3 text-sm text-slate-400 bg-slate-800/30 rounded-xl px-4 py-3 border border-slate-800"
                  >
                    <span className="font-bold text-slate-500 tabular-nums w-4 text-center">
                      {step.id}
                    </span>
                    <span className="text-slate-300">{step.nameHe}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right panel */}
          {appState !== "idle" && (
            <div>
              {error && appState === "error" && (
                <div className="bg-red-950 border border-red-800 rounded-2xl p-6 space-y-3">
                  <h3 className="text-red-300 font-bold flex items-center gap-2">
                    <span>❌</span>
                    <span>שגיאה בעיבוד</span>
                  </h3>
                  <p className="text-sm text-red-400">{error}</p>
                  <p className="text-xs text-red-500">
                    ודא שמשתנה הסביבה ANTHROPIC_API_KEY מוגדר ותקין.
                  </p>
                </div>
              )}

              {appState === "running" && !report && (
                <ResearchRoadmap steps={steps} />
              )}

              {report && <ReportDisplay report={report} />}
            </div>
          )}
        </div>
      </main>

      {/* Scrape warning toast */}
      {scrapeWarning && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-amber-900/90 border border-amber-600 text-amber-100 rounded-2xl px-5 py-4 shadow-2xl flex items-start gap-3 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <span className="text-lg mt-0.5">⚠️</span>
          <div className="flex-1">
            <p className="text-sm font-semibold leading-snug">{scrapeWarning}</p>
          </div>
          <button
            onClick={() => setScrapeWarning(null)}
            className="text-amber-400 hover:text-amber-200 text-lg leading-none mt-0.5 shrink-0"
            aria-label="סגור"
          >
            ×
          </button>
        </div>
      )}

      <footer className="border-t border-slate-800 mt-16 py-6 text-center text-xs text-slate-600">
        <p>MarketLens AI · מופעל על ידי Claude Opus 4.6 · כל הניתוחים בעברית</p>
      </footer>
    </div>
  );
}
