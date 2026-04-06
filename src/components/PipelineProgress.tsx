"use client";

import type { PipelineStep } from "@/types/research";

interface Props {
  steps: PipelineStep[];
}

const stepIcons: Record<number, string> = {
  1: "🔍",
  2: "🌊",
  3: "⚠️",
  4: "📊",
};

const statusConfig = {
  pending: {
    bg: "bg-slate-800",
    border: "border-slate-600",
    text: "text-slate-400",
    badge: "bg-slate-700 text-slate-300",
    label: "ממתין",
  },
  running: {
    bg: "bg-blue-950",
    border: "border-blue-500",
    text: "text-blue-300",
    badge: "bg-blue-600 text-white",
    label: "מעבד...",
  },
  completed: {
    bg: "bg-emerald-950",
    border: "border-emerald-500",
    text: "text-emerald-300",
    badge: "bg-emerald-600 text-white",
    label: "הושלם ✓",
  },
  error: {
    bg: "bg-red-950",
    border: "border-red-500",
    text: "text-red-300",
    badge: "bg-red-600 text-white",
    label: "שגיאה",
  },
};

function Spinner() {
  return (
    <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function StepStatusIcon({ status }: { status: PipelineStep["status"] }) {
  if (status === "running") return <Spinner />;
  if (status === "completed") return <CheckIcon />;
  if (status === "error") return <ErrorIcon />;
  return <div className="w-4 h-4 rounded-full border-2 border-slate-500" />;
}

function ElapsedTime({ step }: { step: PipelineStep }) {
  if (!step.startedAt) return null;
  const end = step.completedAt ?? Date.now();
  const seconds = Math.round((end - step.startedAt) / 1000);
  return (
    <span className="text-xs text-slate-400">{seconds} שנ׳</span>
  );
}

export default function PipelineProgress({ steps }: Props) {
  const completedCount = steps.filter((s) => s.status === "completed").length;
  const progressPct = (completedCount / steps.length) * 100;

  return (
    <div className="space-y-4">
      {/* Overall progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm text-slate-400">
          <span>התקדמות כוללת</span>
          <span>{completedCount}/{steps.length} שלבים</span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-700"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Step cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {steps.map((step) => {
          const cfg = statusConfig[step.status];
          return (
            <div
              key={step.id}
              className={`relative rounded-xl border p-4 transition-all duration-500 ${cfg.bg} ${cfg.border}`}
            >
              {/* Animated pulse border when running */}
              {step.status === "running" && (
                <div className="absolute inset-0 rounded-xl border border-blue-400 animate-pulse opacity-40 pointer-events-none" />
              )}

              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">{stepIcons[step.id]}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm font-semibold leading-snug ${cfg.text}`}>
                      {step.nameHe}
                    </span>
                    <StepStatusIcon status={step.status} />
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.badge}`}>
                      {cfg.label}
                    </span>
                    <ElapsedTime step={step} />
                  </div>
                  {step.error && (
                    <p className="text-xs text-red-400 mt-1 truncate">{step.error}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
