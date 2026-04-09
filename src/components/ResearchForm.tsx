"use client";

import { useState } from "react";
import type { ResearchMode, FocusedCategory } from "@/types/research";

interface Props {
  onSubmit: (url: string, details?: string, mode?: ResearchMode, category?: FocusedCategory) => void;
  isLoading: boolean;
}

const EXAMPLE_URLS = ["monday.com", "notion.so", "hubspot.com", "wix.com"];

const FOCUSED_OPTIONS: { id: FocusedCategory; label: string; icon: string; desc: string }[] = [
  { id: "competitors", label: "מתחרים",        icon: "🏆", desc: "ניתוח עמוק של שחקני השוק" },
  { id: "risk",        label: "סיכונים",        icon: "⚡", desc: "איומים ואסטרטגיות מיתון" },
  { id: "porters",     label: "5 כוחות",        icon: "🏛️", desc: "מודל פורטר ואטרקטיביות" },
  { id: "content",     label: "תוכן אסטרטגי",  icon: "✍️", desc: "פרסומות, פוסטים, כותרות" },
];

// Internal 3-way mode state
type UiMode = "full" | "focused" | "marketing";

export default function ResearchForm({ onSubmit, isLoading }: Props) {
  const [url, setUrl]           = useState("");
  const [details, setDetails]   = useState("");
  const [uiMode, setUiMode]     = useState<UiMode>("full");
  const [category, setCategory] = useState<FocusedCategory | undefined>(undefined);

  const normalizeUrl = (raw: string) => {
    const t = raw.trim();
    if (!t) return "";
    return t.startsWith("http://") || t.startsWith("https://") ? t : `https://${t}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || isLoading) return;
    if (uiMode === "full") {
      onSubmit(normalizeUrl(url), details.trim() || undefined, "full", undefined);
    } else if (uiMode === "marketing") {
      onSubmit(normalizeUrl(url), details.trim() || undefined, "focused", "marketing");
    } else {
      // focused — requires sub-category
      if (!category) return;
      onSubmit(normalizeUrl(url), details.trim() || undefined, "focused", category);
    }
  };

  const isSubmitDisabled =
    !url.trim() || isLoading || (uiMode === "focused" && !category);

  const gold        = "#D4AF37";
  const goldMuted   = "rgba(212,175,55,0.12)";
  const goldBorder  = "rgba(212,175,55,0.28)";

  const getSubmitLabel = () => {
    if (isLoading) return null;
    if (uiMode === "marketing")           return "נתח פערים שיווקיים";
    if (uiMode === "focused" && !category) return "בחר קטגוריה לניתוח";
    if (uiMode === "focused")              return `נתח: ${FOCUSED_OPTIONS.find(o => o.id === category)?.label}`;
    return "הפעל ניתוח מלא";
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* URL Field */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-zinc-200">
          כתובת האתר שלך
          <span className="text-red-400 mr-1">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="mycompany.com  /  https://www.mysite.co.il"
            disabled={isLoading}
            dir="ltr"
            className="w-full bg-white/[0.04] border rounded-xl px-4 py-3 text-white text-left
                       placeholder:text-zinc-600 focus:outline-none transition-all
                       disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              borderColor: url ? goldBorder : "rgba(255,255,255,0.1)",
              boxShadow: url ? `0 0 0 1px ${goldBorder}` : "none",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = goldBorder;
              e.currentTarget.style.boxShadow = `0 0 0 1px ${goldBorder}`;
            }}
            onBlur={(e) => {
              if (!url) {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                e.currentTarget.style.boxShadow = "none";
              }
            }}
          />
        </div>

        {/* Example chips */}
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {EXAMPLE_URLS.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setUrl(ex)}
              disabled={isLoading}
              className="text-xs font-mono px-2.5 py-1 rounded-lg border border-white/10
                         text-zinc-500 hover:text-zinc-300 hover:border-white/20
                         bg-white/[0.03] transition-all disabled:opacity-40"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* Research Mode — 3 choices */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-zinc-300">סוג הניתוח</p>

        {/* Top row: Full Research + Focused Analysis */}
        <div className="grid grid-cols-2 gap-2">
          {([
            { v: "full"    as UiMode, label: "מחקר מלא",     icon: "🔬", sub: "כל 7 השלבים" },
            { v: "focused" as UiMode, label: "ניתוח ממוקד",   icon: "🎯", sub: "קטגוריה ספציפית" },
          ] as { v: UiMode; label: string; icon: string; sub: string }[]).map(({ v, label, icon, sub }) => {
            const active = uiMode === v;
            return (
              <button
                key={v}
                type="button"
                onClick={() => {
                  setUiMode(v);
                  if (v !== "focused") setCategory(undefined);
                }}
                disabled={isLoading}
                className="py-3 px-4 rounded-xl text-sm font-semibold border transition-all text-right"
                style={{
                  background: active ? goldMuted : "rgba(255,255,255,0.02)",
                  borderColor: active ? gold : "rgba(255,255,255,0.1)",
                  color: active ? gold : "#71717a",
                }}
              >
                <span className="text-base block mb-0.5">{icon}</span>
                <span className="block">{label}</span>
                <span className="block text-xs opacity-70 font-normal mt-0.5">{sub}</span>
              </button>
            );
          })}
        </div>

        {/* Marketing Gap — full-width distinctive button */}
        <button
          type="button"
          onClick={() => { setUiMode("marketing"); setCategory("marketing"); }}
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-xl text-sm font-semibold border transition-all text-right"
          style={{
            background: uiMode === "marketing"
              ? "rgba(212,175,55,0.14)"
              : "rgba(255,255,255,0.02)",
            borderColor: uiMode === "marketing"
              ? gold
              : "rgba(212,175,55,0.2)",
            color: uiMode === "marketing" ? gold : "#a1a1aa",
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <span className="text-xl">📊</span>
              <div>
                <span className="block font-bold">ניתוח פערים שיווקי</span>
                <span className="block text-xs opacity-70 font-normal mt-0.5">
                  Google Ads · Social · Lead Magnets — הדרך המהירה ביותר
                </span>
              </div>
            </div>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
              style={{
                background: uiMode === "marketing"
                  ? goldMuted
                  : "rgba(212,175,55,0.08)",
                color: gold,
                border: `1px solid rgba(212,175,55,0.25)`,
              }}
            >
              ⚡ מהיר
            </span>
          </div>
        </button>

        {/* Focused sub-category cards (only when focused + not marketing) */}
        {uiMode === "focused" && (
          <div className="grid grid-cols-2 gap-2 pt-1 fade-in">
            {FOCUSED_OPTIONS.map(({ id, label, icon, desc }) => {
              const active = category === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setCategory(id)}
                  disabled={isLoading}
                  className="py-3 px-2 rounded-xl text-xs font-semibold border transition-all text-center"
                  style={{
                    background: active ? goldMuted : "rgba(255,255,255,0.02)",
                    borderColor: active ? gold : "rgba(255,255,255,0.08)",
                    color: active ? gold : "#52525b",
                  }}
                >
                  <span className="text-lg block mb-1">{icon}</span>
                  <span className="block font-bold">{label}</span>
                  <span className="block opacity-70 font-normal leading-tight mt-1" style={{ fontSize: "10px" }}>
                    {desc}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Additional Details */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-zinc-300">
          פרטים נוספים
          <span className="text-zinc-600 font-normal text-xs mr-2">(אופציונלי)</span>
        </label>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="תחום עיסוק, שוק יעד, מיקוד גיאוגרפי..."
          disabled={isLoading}
          rows={2}
          className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white
                     placeholder:text-zinc-600 focus:outline-none resize-none transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          style={{ direction: "rtl" }}
          onFocus={(e) => { e.currentTarget.style.borderColor = goldBorder; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitDisabled}
        className="w-full font-bold py-4 px-6 rounded-xl transition-all duration-200
                   flex items-center justify-center gap-3 text-sm relative overflow-hidden"
        style={{
          background: isSubmitDisabled
            ? "rgba(255,255,255,0.06)"
            : `linear-gradient(135deg, ${gold} 0%, #C5A028 100%)`,
          color: isSubmitDisabled ? "#52525b" : "#000000",
          cursor: isSubmitDisabled ? "not-allowed" : "pointer",
          boxShadow: !isSubmitDisabled ? "0 4px 24px rgba(212,175,55,0.3)" : "none",
        }}
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            <span>מעבד מחקר...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>{getSubmitLabel()}</span>
          </>
        )}
      </button>

      {uiMode === "focused" && !category && !isLoading && (
        <p className="text-xs text-center" style={{ color: "rgba(212,175,55,0.6)" }}>
          בחר קטגוריה לניתוח ממוקד
        </p>
      )}
    </form>
  );
}
