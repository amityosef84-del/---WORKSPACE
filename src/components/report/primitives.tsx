"use client";

import { useState } from "react";
import { M, MD, MM, MB, S, SB, DT, TXT } from "./tokens";

// ─── Accordion Section Card ───────────────────────────────────────────────────

export function SectionCard({
  icon, title, children, defaultOpen = false,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl overflow-hidden"
         style={{ background: "#fff", border: `1px solid ${MB}`, boxShadow: "0 1px 8px rgba(16,185,129,0.07), 0 1px 2px rgba(0,0,0,0.04)" }}>
      {/* Header — always visible, click to toggle */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-6 py-4 text-right"
        style={{ background: open ? MM : "transparent" }}
      >
        <h2 className="text-base font-bold flex items-center gap-2.5">
          <span className="text-xl">{icon}</span>
          <span style={{ color: TXT }}>{title}</span>
        </h2>
        <svg
          className="w-5 h-5 shrink-0 transition-transform duration-300"
          style={{ color: M, transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Body — collapses smoothly */}
      <div
        className="accordion-content"
        style={{ maxHeight: open ? "10000px" : "0", opacity: open ? 1 : 0 }}
      >
        <div className="px-6 pb-6 space-y-5" style={{ borderTop: `1px solid ${MB}` }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Tag chip ─────────────────────────────────────────────────────────────────

export function Tag({ label, color = "default" }: {
  label: string;
  color?: "mint" | "red" | "blue" | "green" | "default";
}) {
  const styles: Record<string, { background: string; color: string; border: string }> = {
    mint:    { background: MM,                           color: M,        border: MB },
    red:     { background: "rgba(239,68,68,0.08)",       color: "#ef4444", border: "rgba(239,68,68,0.2)" },
    blue:    { background: "rgba(99,102,241,0.08)",      color: "#6366f1", border: "rgba(99,102,241,0.2)" },
    green:   { background: "rgba(52,211,153,0.1)",       color: "#059669", border: "rgba(52,211,153,0.2)" },
    default: { background: S,                            color: DT,        border: SB },
  };
  const st = styles[color] ?? styles.default;
  return (
    <span className="inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium"
          style={{ background: st.background, color: st.color, border: `1px solid ${st.border}` }}>
      {label}
    </span>
  );
}

// ─── Bullet list ──────────────────────────────────────────────────────────────

export function BulletList({ items, mintDot }: { items: string[]; mintDot?: boolean }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "#374151" }}>
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 flex-none"
                style={{ background: mintDot ? M : DT }} />
          {item}
        </li>
      ))}
    </ul>
  );
}

// ─── Risk badge ───────────────────────────────────────────────────────────────

export function RiskBadge({ level }: { level: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    low:      { label: "נמוך",   bg: "rgba(16,185,129,0.1)",  color: "#059669" },
    medium:   { label: "בינוני", bg: "rgba(251,191,36,0.1)",  color: "#d97706" },
    high:     { label: "גבוה",   bg: "rgba(249,115,22,0.1)",  color: "#ea580c" },
    critical: { label: "קריטי",  bg: "rgba(239,68,68,0.1)",   color: "#dc2626" },
  };
  const s = map[level] ?? map.medium;
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
          style={{ background: s.bg, color: s.color }}>{s.label}</span>
  );
}

// ─── Timeframe badge ──────────────────────────────────────────────────────────

export function TimeframeBadge({ tf }: { tf: string }) {
  const map: Record<string, { label: string; color: string }> = {
    immediate:    { label: "מיידי",     color: "#dc2626" },
    "short-term": { label: "קצר-טווח",  color: "#d97706" },
    "long-term":  { label: "ארוך-טווח", color: DT },
  };
  const s = map[tf] ?? map["long-term"];
  return <span className="text-xs font-medium" style={{ color: s.color }}>{s.label}</span>;
}

// ─── Inner surface card ───────────────────────────────────────────────────────

export function InnerCard({ children, accent }: {
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl p-4"
         style={{
           background: accent ? MM : S,
           border: `1px solid ${accent ? MB : SB}`,
         }}>
      {children}
    </div>
  );
}

// ─── Copy to clipboard button ─────────────────────────────────────────────────

export function CopyButton({ text, label = "העתק" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all shrink-0"
      style={{
        background: copied ? MM : "#F9FAFB",
        color: copied ? M : DT,
        border: `1px solid ${copied ? MB : "#E5E7EB"}`,
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

// ─── Asset card (content step) ────────────────────────────────────────────────

export function AssetCard({ badge, children, copyText }: {
  badge: string;
  children: React.ReactNode;
  copyText: string;
}) {
  return (
    <div className="rounded-xl p-5 space-y-4"
         style={{ background: "#fff", border: `1px solid ${MB}`, boxShadow: "0 1px 4px rgba(16,185,129,0.06)" }}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-black uppercase tracking-widest px-2.5 py-1 rounded-full"
              style={{ background: MM, color: M, border: `1px solid ${MB}` }}>
          {badge}
        </span>
        <CopyButton text={copyText} />
      </div>
      {children}
    </div>
  );
}

// suppress unused import lint warnings for tokens used by name only
void MD;
