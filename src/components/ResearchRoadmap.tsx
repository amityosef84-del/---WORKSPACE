"use client";

import { useEffect, useState } from "react";
import type { PipelineStep } from "@/types/research";

// ─── Stage Configuration ──────────────────────────────────────────────────────

interface MicroTask {
  label: string;
}

interface StageConfig {
  id: 0 | 1 | 2 | 3 | 4 | 5;
  title: string;
  subtitle: string;
  icon: string;
  /** Realistic average duration in seconds */
  estimatedSeconds: number;
  microTasks: MicroTask[];
}

const STAGES: StageConfig[] = [
  {
    id: 0,
    title: "סריקת נכסים דיגיטליים",
    subtitle: "אתר ותוכן",
    icon: "🌐",
    estimatedSeconds: 20,
    microTasks: [
      { label: "שולח בקשה לאתר המתחרה" },
      { label: "מחלץ מטא-תגיות ותיאורים" },
      { label: "אוסף כותרות ותוכן גלוי" },
      { label: "מעבד את המידע לניתוח AI" },
    ],
  },
  {
    id: 1,
    title: "ניתוח מתחרים מעמיק",
    subtitle: "הצעה, קהל יעד, מחיר",
    icon: "🔍",
    estimatedSeconds: 75,
    microTasks: [
      { label: "מנתח זהות ונרטיב המותג" },
      { label: "מזהה הצעות ערך מרכזיות" },
      { label: "מנתח אסטרטגיית תוכן ושיווק" },
      { label: "ממפה קהל יעד ופסיכוגרפיה" },
      { label: "מעריך מבנה מחיר ומודל עסקי" },
    ],
  },
  {
    id: 2,
    title: 'איתור "אוקיינוס כחול"',
    subtitle: "הזדמנויות ופערים",
    icon: "🌊",
    estimatedSeconds: 50,
    microTasks: [
      { label: "סורק צרכים שלא נענים בשוק" },
      { label: "מזהה טרנדים טכנולוגיים וחברתיים" },
      { label: "ממפה רווחים לבנים לכיבוש" },
      { label: "מחשב ציון הזדמנות כוללי" },
    ],
  },
  {
    id: 3,
    title: "הערכת סיכונים ואיומים",
    subtitle: "סיכונים אסטרטגיים",
    icon: "⚡",
    estimatedSeconds: 50,
    microTasks: [
      { label: "בודק שיבושים טכנולוגיים פוטנציאליים" },
      { label: "מנתח חלופות זולות לצרכנים" },
      { label: "מעריך סיכוני רגולציה ושוק" },
      { label: "מגבש אסטרטגיות מיתון לכל איום" },
    ],
  },
  {
    id: 4,
    title: "הפקת דוח סיכום מנהלים",
    subtitle: "ERRC, SWOT, תקציר",
    icon: "📋",
    estimatedSeconds: 55,
    microTasks: [
      { label: "ממפה סגמנטי קהל יעד ונקודות כאב" },
      { label: "בונה מטריצת SWOT" },
      { label: "מגבש גריד ERRC להזדמנות הכחולה" },
      { label: "כותב תקציר מנהלים ומשפט-מסכם" },
    ],
  },
  {
    id: 5,
    title: "חמשת הכוחות של פורטר",
    subtitle: "ניתוח אטרקטיביות השוק",
    icon: "🏛️",
    estimatedSeconds: 40,
    microTasks: [
      { label: "מנתח עוצמת התחרות הקיימת" },
      { label: "מעריך איום מנכנסים חדשים" },
      { label: "בוחן כוח מיקוח ספקים ולקוחות" },
      { label: "מחשב ציון אטרקטיביות כוללי" },
    ],
  },
];

// Steps 2+3 run in parallel — effective critical-path time is max, not sum
const EFFECTIVE_TOTAL_SECONDS =
  STAGES[0].estimatedSeconds +
  STAGES[1].estimatedSeconds +
  Math.max(STAGES[2].estimatedSeconds, STAGES[3].estimatedSeconds) +
  STAGES[4].estimatedSeconds +
  STAGES[5].estimatedSeconds;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSeconds(s: number): string {
  if (s <= 0) return "0 שנ׳";
  if (s < 60) return `${s} שנ׳`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r > 0 ? `${m} דק׳ ${r} שנ׳` : `${m} דק׳`;
}

/** Which micro-task index is "in progress" given elapsed seconds */
function activeMicroIdx(elapsed: number, estimated: number, total: number): number {
  if (total === 0) return 0;
  // Each micro-task occupies an equal slice of the estimated time
  const sliceSec = estimated / total;
  return Math.min(Math.floor(elapsed / sliceSec), total - 1);
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
        <div className="absolute inset-0 rounded-full border-2 border-blue-400/50 animate-ping" />
        <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="w-9 h-9 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center shrink-0">
        <span className="text-red-400 font-bold text-sm">!</span>
      </div>
    );
  }
  return (
    <div className="w-9 h-9 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center shrink-0">
      <div className="w-2 h-2 rounded-full bg-slate-600" />
    </div>
  );
}

function MicroTaskList({
  tasks,
  activeIdx,
  allDone,
}: {
  tasks: MicroTask[];
  activeIdx: number;
  allDone: boolean;
}) {
  return (
    <ul className="mt-2.5 space-y-1.5">
      {tasks.map((task, i) => {
        const done = allDone || i < activeIdx;
        const active = !allDone && i === activeIdx;
        const pending = !allDone && i > activeIdx;
        return (
          <li key={i} className={`flex items-center gap-2 text-xs transition-all duration-300 ${pending ? "opacity-35" : ""}`}>
            {done && (
              <svg className="w-3 h-3 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {active && (
              <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0" />
            )}
            {pending && (
              <div className="w-3 h-3 rounded-full border border-slate-600 shrink-0" />
            )}
            <span className={done ? "text-emerald-500/80" : active ? "text-slate-200" : "text-slate-500"}>
              {task.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
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
  const isPartial = isDone && step.partial;

  const elapsedSec = isRunning && step.startedAt
    ? Math.floor((now - step.startedAt) / 1000)
    : 0;
  const remainingSec = Math.max(0, config.estimatedSeconds - elapsedSec);
  const isOverrun = isRunning && elapsedSec > config.estimatedSeconds;

  // Within-step progress fill: 0→85% while running, snaps to 100% on complete
  const fillPct = isDone
    ? 100
    : isRunning
    ? Math.min(85, Math.round((elapsedSec / config.estimatedSeconds) * 100))
    : 0;

  const tookSec =
    isDone && step.startedAt && step.completedAt
      ? Math.round((step.completedAt - step.startedAt) / 1000)
      : null;

  const microIdx = activeMicroIdx(elapsedSec, config.estimatedSeconds, config.microTasks.length);

  return (
    <div className="flex gap-4">
      {/* Dot + connector */}
      <div className="flex flex-col items-center">
        <StatusDot status={step.status} />
        {!isLast && (
          <div
            className={`w-0.5 flex-1 mt-2 min-h-[2rem] transition-colors duration-700 ${isDone ? "bg-emerald-600/40" : "bg-slate-700/60"}`}
          />
        )}
      </div>

      {/* Content */}
      <div className={`flex-1 ${isLast ? "pb-0" : "pb-6"}`}>
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-lg leading-none">{config.icon}</span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className={`text-sm font-bold leading-snug transition-colors duration-300 ${
                  isDone ? (isPartial ? "text-amber-300" : "text-emerald-300") : isRunning ? "text-white" : "text-slate-400"
                }`}>
                  {config.title}
                </p>
                {/* Partial result badge */}
                {isPartial && (
                  <span className="inline-flex items-center gap-1 text-xs bg-amber-900/40 border border-amber-700/60 text-amber-400 px-1.5 py-0.5 rounded-full leading-none">
                    ⚡ תוצאה חלקית
                  </span>
                )}
              </div>
              <p className={`text-xs transition-colors duration-300 ${
                isDone ? (isPartial ? "text-amber-700" : "text-emerald-700") : isRunning ? "text-slate-400" : "text-slate-600"
              }`}>
                {config.subtitle}
              </p>
            </div>
          </div>

          {/* Time badge */}
          <div className="shrink-0 text-left">
            {step.status === "pending" && (
              <span className="text-xs text-slate-600">~{formatSeconds(config.estimatedSeconds)}</span>
            )}
            {isRunning && !isOverrun && (
              <span className="text-xs text-blue-400 font-medium tabular-nums">
                {remainingSec > 0 ? `${remainingSec} שנ׳ נותרו` : "מסיים..."}
              </span>
            )}
            {isRunning && isOverrun && (
              <span className="text-xs text-amber-400 font-medium tabular-nums animate-pulse">
                כמעט שם...
              </span>
            )}
            {isDone && tookSec !== null && (
              <span className={`text-xs tabular-nums ${isPartial ? "text-amber-600" : "text-emerald-600"}`}>
                {isPartial ? "⚡" : "✓"} {tookSec} שנ׳
              </span>
            )}
          </div>
        </div>

        {/* Within-step progress fill bar */}
        {(isRunning || isDone) && (
          <div className="mt-1.5 pr-8">
            <div className="h-0.5 bg-slate-700/50 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ease-linear ${
                  isDone
                    ? isPartial
                      ? "bg-amber-500/50 duration-300"
                      : "bg-emerald-500/50 duration-300"
                    : "bg-blue-500/40 duration-1000"
                }`}
                style={{ width: `${fillPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Overrun message */}
        {isRunning && isOverrun && (
          <p className="text-xs text-amber-500/80 mt-1.5 pr-8">
            מעבד נתונים מורכבים, כמעט שם...
          </p>
        )}

        {/* Partial fallback notice */}
        {isPartial && (
          <p className="text-xs text-amber-600/70 mt-1 pr-8">
            הצגת תוצאה חלקית — הניתוח הושלם עם מידע מוגבל
          </p>
        )}

        {/* Micro-tasks — only while running or completed */}
        {(isRunning || isDone) && !isPartial && (
          <div className="pr-8">
            <MicroTaskList
              tasks={config.microTasks}
              activeIdx={microIdx}
              allDone={isDone}
            />
          </div>
        )}

        {/* Pending state hint */}
        {step.status === "pending" && (
          <p className="text-xs text-slate-600 mt-1 pr-8">ממתין לשלב הקודם</p>
        )}

        {/* Error */}
        {step.status === "error" && step.error && (
          <p className="text-xs text-red-400 mt-1 pr-8 truncate">{step.error}</p>
        )}
      </div>
    </div>
  );
}

// ─── Overall ETA Banner ───────────────────────────────────────────────────────

function ETABanner({ steps, now }: { steps: PipelineStep[]; now: number }) {
  const completedCount = steps.filter((s) => s.status === "completed").length;
  const allDone = completedCount === steps.length;

  // Calculate remaining time: sum of remaining seconds across pending/running steps,
  // accounting for the parallel pair (2+3)
  let remainingSec = 0;
  const parallelPair = [steps[2], steps[3]]; // ids 2 and 3 run together
  const parallelBothPending = parallelPair.every((s) => s.status === "pending");
  const parallelBothRunning = parallelPair.every((s) => s.status === "running" || s.status === "completed");
  const parallelMaxEstimate = Math.max(STAGES[2].estimatedSeconds, STAGES[3].estimatedSeconds);

  steps.forEach((step, i) => {
    const cfg = STAGES[i];
    if (!cfg) return;

    // Skip individual parallel steps — we handle them together below
    if (step.id === 2 || step.id === 3) return;

    if (step.status === "pending") {
      remainingSec += cfg.estimatedSeconds;
    } else if (step.status === "running" && step.startedAt) {
      const elapsed = Math.floor((now - step.startedAt) / 1000);
      remainingSec += Math.max(0, cfg.estimatedSeconds - elapsed);
    }
  });

  // Add parallel pair contribution once
  const p2 = steps.find((s) => s.id === 2)!;
  const p3 = steps.find((s) => s.id === 3)!;
  if (p2.status === "pending" && p3.status === "pending") {
    remainingSec += parallelMaxEstimate;
  } else if (p2.status === "running" || p3.status === "running") {
    // Use the running one's remaining
    const elapsedP2 = p2.status === "running" && p2.startedAt ? Math.floor((now - p2.startedAt) / 1000) : 0;
    const elapsedP3 = p3.status === "running" && p3.startedAt ? Math.floor((now - p3.startedAt) / 1000) : 0;
    const remP2 = p2.status !== "completed" ? Math.max(0, STAGES[2].estimatedSeconds - elapsedP2) : 0;
    const remP3 = p3.status !== "completed" ? Math.max(0, STAGES[3].estimatedSeconds - elapsedP3) : 0;
    remainingSec += Math.max(remP2, remP3);
  }

  const firstStart = steps.find((s) => s.startedAt)?.startedAt;
  const totalElapsed = firstStart ? Math.floor((now - firstStart) / 1000) : 0;

  if (allDone) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-sm font-bold text-slate-200">מחקר הושלם</span>
        </div>
        <span className="text-xs text-emerald-500 tabular-nums">
          סה״כ {formatSeconds(totalElapsed)}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
        <span className="text-sm font-bold text-slate-200">מפת מהלך המחקר</span>
      </div>
      <div className="text-left">
        {remainingSec > 0 ? (
          <span className="text-xs text-slate-300 font-medium tabular-nums">
            זמן משוער לסיום: <span className="text-blue-300">{formatSeconds(remainingSec)}</span>
          </span>
        ) : (
          <span className="text-xs text-amber-400 tabular-nums">{totalElapsed} שנ׳ עברו</span>
        )}
      </div>
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ steps }: { steps: PipelineStep[] }) {
  const completedCount = steps.filter((s) => s.status === "completed").length;
  const pct = Math.round((completedCount / steps.length) * 100);
  return (
    <div className="space-y-1 mt-3">
      <div className="flex justify-between text-xs text-slate-500">
        <span>{completedCount} מתוך {steps.length} שלבים הושלמו</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  steps: PipelineStep[];
}

export default function ResearchRoadmap({ steps }: Props) {
  const isAnyActive = steps.some(
    (s) => s.status === "running" || s.status === "completed" || s.status === "error",
  );
  const hasRunning = steps.some((s) => s.status === "running");

  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!hasRunning) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [hasRunning]);

  if (!isAnyActive) return null;

  return (
    <div className="bg-slate-800/40 border border-slate-700 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b border-slate-700/60 space-y-0">
        <ETABanner steps={steps} now={now} />
        <ProgressBar steps={steps} />
      </div>

      {/* Stage list */}
      <div className="px-6 pt-5 pb-6">
        {STAGES.map((config, i) => {
          const step = steps.find((s) => s.id === config.id);
          if (!step) return null;
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
