"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import type { PipelineStep } from "@/types/research";

// ─── Stage Configuration ──────────────────────────────────────────────────────

interface StageConfig {
  id: 0 | 1 | 2 | 3 | 4;
  title: string;
  subtitle: string;
  icon: string;
  estimatedSeconds: number;
  microUpdates: string[];
}

const STAGES: StageConfig[] = [
  {
    id: 0,
    title: "סריקת נכסים דיגיטליים",
    subtitle: "אתר ותוכן",
    icon: "🌐",
    estimatedSeconds: 30,
    microUpdates: [
      "סורק טקסטים ותיאורים...",
      "מנתח מטא-תגיות ו-OpenGraph...",
      "אוסף כותרות ומבנה עמוד...",
      "מחלץ מידע על מוצרים ושירותים...",
    ],
  },
  {
    id: 1,
    title: "ניתוח מתחרים מעמיק",
    subtitle: "הצעה, קהל יעד, מחיר",
    icon: "🔍",
    estimatedSeconds: 90,
    microUpdates: [
      "מנתח זהות ונרטיב המותג...",
      "מזהה הצעות ערך מרכזיות...",
      "מנתח אסטרטגיית מחיר...",
      "ממפה קהל יעד ופסיכוגרפיה...",
      "בוחן ערוצי שיווק ותוכן...",
    ],
  },
  {
    id: 2,
    title: 'איתור "אוקיינוס כחול"',
    subtitle: "הזדמנויות ופערים",
    icon: "🌊",
    estimatedSeconds: 90,
    microUpdates: [
      "מחפש פערים בשוק שלא נענו...",
      "מנתח ביקורות וצרכי לקוחות...",
      "זוהים טרנדים עולים...",
      "ממפה הזדמנויות לא מנוצלות...",
      "מחשב ציון הזדמנות כוללי...",
    ],
  },
  {
    id: 3,
    title: "הערכת סיכונים ומסקנות",
    subtitle: "סיכונים אסטרטגיים",
    icon: "⚡",
    estimatedSeconds: 90,
    microUpdates: [
      "בודק שיבושים טכנולוגיים...",
      "מנתח חלופות צרכניות...",
      "מעריך סיכוני שוק ורגולציה...",
      "מגבש אסטרטגיות מיתון...",
      "מדרג רמות חומרה...",
    ],
  },
  {
    id: 4,
    title: "הפקת דוח סיכום מנהלים",
    subtitle: "ERRC, SWOT, תקציר",
    icon: "📋",
    estimatedSeconds: 90,
    microUpdates: [
      "מסנתז ממצאי כל השלבים...",
      "ממפה סגמנטי קהל יעד...",
      "בונה מטריצת SWOT...",
      "מגבש גריד ERRC להזדמנות הכחולה...",
      "כותב תקציר מנהלים...",
    ],
  },
];

const TOTAL_ESTIMATED_SECONDS = STAGES.reduce((s, g) => s + g.estimatedSeconds, 0);

// ─── Helper Hooks ─────────────────────────────────────────────────────────────

function useNow(active: boolean): number {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

function useCyclingIndex(length: number, active: boolean, intervalMs = 3500): number {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!active) { setIdx(0); return; }
    const id = setInterval(() => setIdx((i) => (i + 1) % length), intervalMs);
    return () => clearInterval(id);
  }, [active, length, intervalMs]);
  return idx;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusDot({ status }: { status: PipelineStep["status"] }) {
  if (status === "completed") {
    return (
      <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-900/40 shrink-0">
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }
  if (status === "running") {
    return (
      <div className="w-9 h-9 rounded-full bg-blue-600/20 border-2 border-blue-500 flex items-center justify-center shrink-0 relative">
        <div className="absolute inset-0 rounded-full border-2 border-blue-400/60 animate-ping" />
        <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="w-9 h-9 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center shrink-0">
        <span className="text-red-400 text-sm font-bold">!</span>
      </div>
    );
  }
  // pending
  return (
    <div className="w-9 h-9 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center shrink-0">
      <div className="w-2 h-2 rounded-full bg-slate-500" />
    </div>
  );
}

function TimeDisplay({
  step,
  estimatedSeconds,
  now,
}: {
  step: PipelineStep;
  estimatedSeconds: number;
  now: number;
}) {
  if (step.status === "pending") {
    return (
      <span className="text-xs text-slate-500">
        כ-{estimatedSeconds < 60 ? `${estimatedSeconds} שנ׳` : `${Math.round(estimatedSeconds / 60)} דק׳`}
      </span>
    );
  }
  if (step.status === "running" && step.startedAt) {
    const elapsed = Math.floor((now - step.startedAt) / 1000);
    const remaining = Math.max(0, estimatedSeconds - elapsed);
    if (remaining > 0) {
      return (
        <span className="text-xs text-blue-400 font-medium tabular-nums">
          כ-{remaining < 60 ? `${remaining} שנ׳` : `${Math.ceil(remaining / 60)} דק׳`} נותרו
        </span>
      );
    }
    return (
      <span className="text-xs text-blue-400 font-medium tabular-nums">
        {elapsed} שנ׳ עובר...
      </span>
    );
  }
  if (step.status === "completed" && step.startedAt && step.completedAt) {
    const took = Math.round((step.completedAt - step.startedAt) / 1000);
    return (
      <span className="text-xs text-emerald-500 tabular-nums">
        ✓ {took} שנ׳
      </span>
    );
  }
  return null;
}

function StageRow({
  config,
  step,
  isLast,
  now,
}: {
  config: StageConfig;
  step: PipelineStep;
  isLast: boolean;
  now: number;
}) {
  const isRunning = step.status === "running";
  const isDone = step.status === "completed";
  const isPending = step.status === "pending";

  const microIdx = useCyclingIndex(config.microUpdates.length, isRunning);

  return (
    <div className="flex gap-4">
      {/* Left column: dot + connector line */}
      <div className="flex flex-col items-center">
        <StatusDot status={step.status} />
        {!isLast && (
          <div className={`w-0.5 flex-1 mt-2 mb-0 min-h-[2rem] transition-colors duration-700 ${
            isDone ? "bg-emerald-600/50" : "bg-slate-700"
          }`} />
        )}
      </div>

      {/* Right column: content */}
      <div className={`flex-1 pb-7 transition-all duration-500 ${isLast ? "pb-0" : ""}`}>
        {/* Title row */}
        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xl leading-none">{config.icon}</span>
            <div className="min-w-0">
              <p className={`text-sm font-bold leading-snug transition-colors duration-300 ${
                isDone ? "text-emerald-300"
                : isRunning ? "text-white"
                : "text-slate-400"
              }`}>
                {config.title}
              </p>
              <p className={`text-xs leading-tight transition-colors duration-300 ${
                isDone ? "text-emerald-600"
                : isRunning ? "text-slate-400"
                : "text-slate-600"
              }`}>
                {config.subtitle}
              </p>
            </div>
          </div>

          <TimeDisplay step={step} estimatedSeconds={config.estimatedSeconds} now={now} />
        </div>

        {/* Status badge + micro-update */}
        <div className="pr-9">
          {isRunning && (
            <p className="text-xs text-blue-400/80 mt-1.5 transition-all duration-500">
              {config.microUpdates[microIdx]}
            </p>
          )}
          {isDone && (
            <p className="text-xs text-emerald-600/70 mt-1">הושלם בהצלחה</p>
          )}
          {isPending && (
            <p className="text-xs text-slate-600 mt-1">ממתין לשלב הקודם</p>
          )}
          {step.status === "error" && step.error && (
            <p className="text-xs text-red-400 mt-1 truncate">{step.error}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  steps: PipelineStep[];
}

export default function ResearchRoadmap({ steps }: Props) {
  const hasAnyActive = steps.some((s) => s.status === "running" || s.status === "completed");
  const now = useNow(steps.some((s) => s.status === "running"));

  // Overall progress
  const completedCount = steps.filter((s) => s.status === "completed").length;
  const runningStep = steps.find((s) => s.status === "running");
  const progressPct = (completedCount / steps.length) * 100;

  // Total elapsed for display
  const firstStart = steps.find((s) => s.startedAt)?.startedAt;
  const totalElapsed = firstStart ? Math.floor((now - firstStart) / 1000) : 0;

  // Estimated total remaining
  const completedSecs = STAGES.filter((g) =>
    steps.find((s) => s.id === g.id)?.status === "completed"
  ).reduce((sum, g) => sum + g.estimatedSeconds, 0);
  const runningSecs = runningStep
    ? Math.max(
        0,
        (STAGES.find((g) => g.id === runningStep.id)?.estimatedSeconds ?? 0) -
          Math.floor((now - (runningStep.startedAt ?? now)) / 1000),
      )
    : 0;
  const pendingStages = STAGES.filter((g) =>
    steps.find((s) => s.id === g.id)?.status === "pending"
  );
  const pendingSecs = pendingStages.reduce((sum, g) => sum + g.estimatedSeconds, 0);
  const totalRemaining = runningSecs + pendingSecs;

  if (!hasAnyActive) return null;

  return (
    <div className="bg-slate-800/40 border border-slate-700 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-700/60">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-200">מפת מהלך המחקר</h3>
          </div>
          <div className="text-left">
            {totalRemaining > 0 ? (
              <span className="text-xs text-slate-400 tabular-nums">
                ~{Math.ceil(totalRemaining / 60)} דק׳ נותרו
              </span>
            ) : completedCount === steps.length ? (
              <span className="text-xs text-emerald-400 font-medium">הושלם ✓</span>
            ) : (
              <span className="text-xs text-blue-400 tabular-nums">{totalElapsed} שנ׳</span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-500">
            <span>{completedCount} מתוך {steps.length} שלבים הושלמו</span>
            <span>{Math.round(progressPct)}%</span>
          </div>
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stage list */}
      <div className="px-6 pt-5 pb-6">
        {STAGES.map((config, i) => {
          const step = steps.find((s) => s.id === config.id)!;
          return (
            <StageRow
              key={config.id}
              config={config}
              step={step}
              isLast={i === STAGES.length - 1}
              now={now}
            />
          );
        })}
      </div>
    </div>
  );
}
