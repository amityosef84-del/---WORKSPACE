"use client";

import { useEffect, useState } from "react";
import type { PipelineStep } from "@/types/research";

// ─── Stage Configuration ──────────────────────────────────────────────────────

interface MicroTask { label: string; }

interface StageConfig {
  id: 0 | 1 | 2 | 3 | 4 | 5;
  title: string;
  subtitle: string;
  icon: string;
  estimatedSeconds: number;
  microTasks: MicroTask[];
}

const STAGES: StageConfig[] = [
  {
    id: 0, icon: "🌐",
    title: "סריקת נכסים דיגיטליים",
    subtitle: "אתר ותוכן",
    estimatedSeconds: 20,
    microTasks: [
      { label: "שולח בקשה לאתר המתחרה" },
      { label: "מחלץ מטא-תגיות ותיאורים" },
      { label: "אוסף כותרות ותוכן" },
      { label: "מעבד מידע לניתוח AI" },
    ],
  },
  {
    id: 1, icon: "🔍",
    title: "ניתוח מתחרים מעמיק",
    subtitle: "הצעה, קהל יעד, מחיר",
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
    id: 2, icon: "🌊",
    title: 'איתור "אוקיינוס כחול"',
    subtitle: "הזדמנויות ופערים",
    estimatedSeconds: 50,
    microTasks: [
      { label: "סורק צרכים שלא נענים בשוק" },
      { label: "מזהה טרנדים טכנולוגיים וחברתיים" },
      { label: "ממפה רווחים לבנים לכיבוש" },
      { label: "מחשב ציון הזדמנות כוללי" },
    ],
  },
  {
    id: 3, icon: "⚡",
    title: "הערכת סיכונים ואיומים",
    subtitle: "סיכונים אסטרטגיים",
    estimatedSeconds: 50,
    microTasks: [
      { label: "בודק שיבושים טכנולוגיים" },
      { label: "מנתח חלופות זולות לצרכנים" },
      { label: "מעריך סיכוני רגולציה ושוק" },
      { label: "מגבש אסטרטגיות מיתון" },
    ],
  },
  {
    id: 4, icon: "📋",
    title: "הפקת דוח סיכום מנהלים",
    subtitle: "ERRC, SWOT, תקציר",
    estimatedSeconds: 55,
    microTasks: [
      { label: "ממפה סגמנטי קהל יעד" },
      { label: "בונה מטריצת SWOT" },
      { label: "מגבש גריד ERRC" },
      { label: "כותב תקציר מנהלים" },
    ],
  },
  {
    id: 5, icon: "🏛️",
    title: "חמשת הכוחות של פורטר",
    subtitle: "ניתוח אטרקטיביות השוק",
    estimatedSeconds: 40,
    microTasks: [
      { label: "מנתח עוצמת התחרות הקיימת" },
      { label: "מעריך איום מנכנסים חדשים" },
      { label: "בוחן כוח מיקוח ספקים ולקוחות" },
      { label: "מחשב ציון אטרקטיביות כוללי" },
    ],
  },
];

const EFFECTIVE_TOTAL_SECONDS =
  STAGES[0].estimatedSeconds +
  STAGES[1].estimatedSeconds +
  Math.max(STAGES[2].estimatedSeconds, STAGES[3].estimatedSeconds) +
  STAGES[4].estimatedSeconds +
  STAGES[5].estimatedSeconds;

// ─── Design tokens ────────────────────────────────────────────────────────────
const GOLD        = "#D4AF37";
const GOLD_MUTED  = "rgba(212,175,55,0.12)";
const GOLD_BORDER = "rgba(212,175,55,0.22)";
const DIM         = "rgba(255,255,255,0.08)";
const DIM_TEXT    = "rgba(255,255,255,0.25)";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSeconds(s: number): string {
  if (s <= 0) return "0 שנ׳";
  if (s < 60) return `${s} שנ׳`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r > 0 ? `${m} דק׳ ${r} שנ׳` : `${m} דק׳`;
}

function activeMicroIdx(elapsed: number, estimated: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(Math.floor(elapsed / (estimated / total)), total - 1);
}

// ─── Status Dot ───────────────────────────────────────────────────────────────

function StatusDot({ status, skipped }: { status: PipelineStep["status"]; skipped?: boolean }) {
  if (skipped) {
    return (
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
           style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${DIM}` }}>
        <span style={{ color: DIM_TEXT, fontSize: "12px" }}>—</span>
      </div>
    );
  }
  if (status === "completed") {
    return (
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
           style={{ background: GOLD_MUTED, border: `1px solid ${GOLD_BORDER}` }}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={GOLD} strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }
  if (status === "running") {
    return (
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 relative"
           style={{ border: `1.5px solid ${GOLD}`, background: GOLD_MUTED }}>
        <div className="absolute inset-0 rounded-full animate-ping"
             style={{ border: `1px solid ${GOLD}`, opacity: 0.3 }} />
        <div className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin"
             style={{ borderColor: `${GOLD} transparent transparent transparent` }} />
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
           style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.4)" }}>
        <span className="text-red-400 font-bold text-xs">!</span>
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
         style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${DIM}` }}>
      <div className="w-1.5 h-1.5 rounded-full" style={{ background: DIM_TEXT }} />
    </div>
  );
}

// ─── Micro-task list ──────────────────────────────────────────────────────────

function MicroTaskList({ tasks, activeIdx, allDone }: {
  tasks: MicroTask[]; activeIdx: number; allDone: boolean;
}) {
  return (
    <ul className="mt-2 space-y-1.5">
      {tasks.map((task, i) => {
        const done    = allDone || i < activeIdx;
        const active  = !allDone && i === activeIdx;
        const pending = !allDone && i > activeIdx;
        return (
          <li key={i} className="flex items-center gap-2 text-xs" style={{ opacity: pending ? 0.3 : 1 }}>
            {done   && <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke={GOLD} strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
            {active && <div className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin shrink-0" style={{ borderColor: `${GOLD} transparent transparent transparent` }}/>}
            {pending && <div className="w-3 h-3 rounded-full border shrink-0" style={{ borderColor: DIM }}/>}
            <span style={{ color: done ? GOLD : active ? "#fff" : DIM_TEXT }}>{task.label}</span>
          </li>
        );
      })}
    </ul>
  );
}

// ─── Stage Row ────────────────────────────────────────────────────────────────

function StageRow({ config, step, isLast, now }: {
  config: StageConfig; step: PipelineStep; isLast: boolean; now: number;
}) {
  const isRunning  = step.status === "running";
  const isDone     = step.status === "completed";
  const isSkipped  = isDone && step.skipped;
  const isPartial  = isDone && step.partial && !isSkipped;
  const isPending  = step.status === "pending";

  const elapsedSec = isRunning && step.startedAt
    ? Math.floor((now - step.startedAt) / 1000) : 0;
  const remainingSec = Math.max(0, config.estimatedSeconds - elapsedSec);
  const isOverrun    = isRunning && elapsedSec > config.estimatedSeconds;
  const fillPct      = isDone ? 100 : isRunning
    ? Math.min(85, Math.round((elapsedSec / config.estimatedSeconds) * 100)) : 0;
  const tookSec      = isDone && !isSkipped && step.startedAt && step.completedAt
    ? Math.round((step.completedAt - step.startedAt) / 1000) : null;
  const microIdx = activeMicroIdx(elapsedSec, config.estimatedSeconds, config.microTasks.length);

  return (
    <div className="flex gap-3">
      {/* Dot + connector */}
      <div className="flex flex-col items-center">
        <StatusDot status={step.status} skipped={step.skipped} />
        {!isLast && (
          <div className="w-px flex-1 mt-2 min-h-[1.5rem] transition-colors duration-700"
               style={{ background: isDone && !isSkipped ? GOLD_BORDER : DIM }} />
        )}
      </div>

      {/* Content */}
      <div className={`flex-1 min-w-0 ${isLast ? "pb-0" : "pb-5"}`}>
        {/* Title row */}
        <div className="flex items-start justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base leading-none shrink-0">{config.icon}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-bold leading-snug transition-colors duration-300 truncate"
                   style={{
                     color: isSkipped ? DIM_TEXT
                          : isDone    ? GOLD
                          : isRunning ? "#fff"
                          : DIM_TEXT,
                   }}>
                  {config.title}
                </p>
                {isPartial && (
                  <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full shrink-0"
                        style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b", fontSize: "10px" }}>
                    ⚡ חלקי
                  </span>
                )}
                {isSkipped && (
                  <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full shrink-0"
                        style={{ background: DIM, border: `1px solid ${DIM}`, color: DIM_TEXT, fontSize: "10px" }}>
                    דולג
                  </span>
                )}
              </div>
              <p className="text-xs truncate" style={{ color: DIM_TEXT }}>
                {config.subtitle}
              </p>
            </div>
          </div>

          {/* Time badge */}
          <div className="shrink-0 text-left">
            {isPending && (
              <span className="text-xs" style={{ color: DIM_TEXT }}>~{formatSeconds(config.estimatedSeconds)}</span>
            )}
            {isRunning && !isOverrun && (
              <span className="text-xs font-medium tabular-nums" style={{ color: GOLD }}>
                {remainingSec > 0 ? `${remainingSec} שנ׳` : "מסיים..."}
              </span>
            )}
            {isRunning && isOverrun && (
              <span className="text-xs font-medium tabular-nums animate-pulse" style={{ color: "#f59e0b" }}>
                כמעט...
              </span>
            )}
            {isDone && !isSkipped && tookSec !== null && (
              <span className="text-xs tabular-nums" style={{ color: isPartial ? "#f59e0b" : GOLD }}>
                {tookSec} שנ׳
              </span>
            )}
          </div>
        </div>

        {/* Progress fill bar */}
        {(isRunning || (isDone && !isSkipped)) && (
          <div className="mt-1.5 pr-6">
            <div className="h-px rounded-full overflow-hidden" style={{ background: DIM }}>
              <div className="h-full rounded-full transition-all ease-linear"
                   style={{
                     width: `${fillPct}%`,
                     background: isDone ? GOLD : GOLD,
                     transitionDuration: isDone ? "300ms" : "1000ms",
                     opacity: isDone ? 0.6 : 0.8,
                   }} />
            </div>
          </div>
        )}

        {/* Micro-tasks */}
        {(isRunning || isDone) && !isSkipped && !isPartial && (
          <div className="pr-6">
            <MicroTaskList tasks={config.microTasks} activeIdx={microIdx} allDone={isDone} />
          </div>
        )}

        {isPending && !isSkipped && (
          <p className="text-xs mt-1 pr-6" style={{ color: DIM_TEXT }}>ממתין לשלב הקודם</p>
        )}
        {isPartial && (
          <p className="text-xs mt-1 pr-6" style={{ color: "#f59e0b" }}>הצגת תוצאה חלקית</p>
        )}
        {step.status === "error" && step.error && (
          <p className="text-xs mt-1 pr-6 text-red-400 truncate">{step.error}</p>
        )}
      </div>
    </div>
  );
}

// ─── ETA Banner ───────────────────────────────────────────────────────────────

function ETABanner({ steps, now }: { steps: PipelineStep[]; now: number }) {
  const visibleSteps   = steps.filter((s) => !s.skipped);
  const completedCount = visibleSteps.filter((s) => s.status === "completed").length;
  const allDone        = completedCount === visibleSteps.length;

  let remainingSec = 0;
  steps.forEach((step, i) => {
    const cfg = STAGES[i];
    if (!cfg || step.skipped) return;
    if (step.id === 2 || step.id === 3) return; // handled separately
    if (step.status === "pending") {
      remainingSec += cfg.estimatedSeconds;
    } else if (step.status === "running" && step.startedAt) {
      remainingSec += Math.max(0, cfg.estimatedSeconds - Math.floor((now - step.startedAt) / 1000));
    }
  });

  const p2 = steps.find((s) => s.id === 2)!;
  const p3 = steps.find((s) => s.id === 3)!;
  if (!p2.skipped && !p3.skipped) {
    if (p2.status === "pending" && p3.status === "pending") {
      remainingSec += Math.max(STAGES[2].estimatedSeconds, STAGES[3].estimatedSeconds);
    } else if (p2.status === "running" || p3.status === "running") {
      const el2 = p2.status === "running" && p2.startedAt ? Math.floor((now - p2.startedAt) / 1000) : 0;
      const el3 = p3.status === "running" && p3.startedAt ? Math.floor((now - p3.startedAt) / 1000) : 0;
      const r2  = p2.status !== "completed" ? Math.max(0, STAGES[2].estimatedSeconds - el2) : 0;
      const r3  = p3.status !== "completed" ? Math.max(0, STAGES[3].estimatedSeconds - el3) : 0;
      remainingSec += Math.max(r2, r3);
    }
  }

  const firstStart   = steps.find((s) => s.startedAt)?.startedAt;
  const totalElapsed = firstStart ? Math.floor((now - firstStart) / 1000) : 0;

  if (allDone) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: GOLD }} />
          <span className="text-sm font-bold text-white">המחקר הושלם</span>
        </div>
        <span className="text-xs tabular-nums" style={{ color: GOLD }}>
          סה״כ {formatSeconds(totalElapsed)}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: GOLD }} />
        <span className="text-sm font-bold text-white">מפת מהלך המחקר</span>
      </div>
      <div className="text-left">
        {remainingSec > 0 ? (
          <span className="text-xs font-medium tabular-nums text-zinc-400">
            ~{" "}
            <span style={{ color: GOLD }}>{formatSeconds(remainingSec)}</span>
            {" "}נותרו
          </span>
        ) : (
          <span className="text-xs tabular-nums" style={{ color: "#f59e0b" }}>
            {totalElapsed} שנ׳ עברו
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ steps }: { steps: PipelineStep[] }) {
  const visible   = steps.filter((s) => !s.skipped);
  const completed = visible.filter((s) => s.status === "completed").length;
  const pct       = Math.round((completed / Math.max(visible.length, 1)) * 100);
  return (
    <div className="space-y-1 mt-3">
      <div className="flex justify-between text-xs" style={{ color: DIM_TEXT }}>
        <span>{completed}/{visible.length} שלבים</span>
        <span>{pct}%</span>
      </div>
      <div className="h-px rounded-full overflow-hidden" style={{ background: DIM }}>
        <div className="h-full rounded-full transition-all duration-700 ease-out"
             style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${GOLD} 0%, #E8C84A 100%)` }} />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props { steps: PipelineStep[]; }

export default function ResearchRoadmap({ steps }: Props) {
  const isAnyActive = steps.some((s) => s.status !== "pending");
  const hasRunning  = steps.some((s) => s.status === "running");

  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!hasRunning) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [hasRunning]);

  if (!isAnyActive) return null;

  return (
    <div className="rounded-2xl overflow-hidden fade-in"
         style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${GOLD_BORDER}` }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-4 space-y-0"
           style={{ borderBottom: `1px solid rgba(212,175,55,0.12)` }}>
        <ETABanner steps={steps} now={now} />
        <ProgressBar steps={steps} />
      </div>

      {/* Stages */}
      <div className="px-5 pt-5 pb-6">
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
