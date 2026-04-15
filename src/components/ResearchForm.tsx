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

type UiMode = "full" | "focused" | "marketing";

// ─── Design tokens ─────────────────────────────────────────────────────────────
const MINT        = "#10B981";
const MINT_MUTED  = "rgba(16,185,129,0.08)";
const MINT_BORDER = "rgba(16,185,129,0.22)";

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
      if (!category) return;
      onSubmit(normalizeUrl(url), details.trim() || undefined, "focused", category);
    }
  };

  const isSubmitDisabled = !url.trim() || isLoading || (uiMode === "focused" && !category);

  const getSubmitLabel = () => {
    if (isLoading) return null;
    if (uiMode === "marketing")            return "נתח פערים שיווקיים";
    if (uiMode === "focused" && !category) return "בחר קטגוריה לניתוח";
    if (uiMode === "focused")              return `נתח: ${FOCUSED_OPTIONS.find(o => o.id === category)?.label}`;
    return "הפעל ניתוח מלא";
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* URL Field */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          כתובת האתר שלך
          <span className="text-red-400 mr-1">*</span>
        </label>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="mycompany.com  /  https://www.mysite.co.il"
          disabled={isLoading}
          dir="ltr"
          className="w-full bg-white border rounded-xl px-4 py-3 text-gray-900 text-left
                     placeholder:text-gray-400 focus:outline-none transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            borderColor: url ? MINT_BORDER : "#E5E7EB",
            boxShadow: url ? `0 0 0 3px ${MINT_MUTED}` : "none",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = MINT_BORDER;
            e.currentTarget.style.boxShadow = `0 0 0 3px ${MINT_MUTED}`;
          }}
          onBlur={(e) => {
            if (!url) {
              e.currentTarget.style.borderColor = "#E5E7EB";
              e.currentTarget.style.boxShadow = "none";
            }
          }}
        />

        {/* Example chips */}
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {EXAMPLE_URLS.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setUrl(ex)}
              disabled={isLoading}
              className="text-xs font-mono px-2.5 py-1 rounded-lg border border-gray-200
                         text-gray-400 hover:text-gray-700 hover:border-gray-300
                         bg-gray-50 transition-all disabled:opacity-40"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* Research Mode */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-gray-700">סוג הניתוח</p>

        {/* Top row: Full + Focused */}
        <div className="grid grid-cols-2 gap-2">
          {([
            { v: "full"    as UiMode, label: "מחקר מלא",    icon: "🔬", sub: "כל 7 השלבים" },
            { v: "focused" as UiMode, label: "ניתוח ממוקד",  icon: "🎯", sub: "קטגוריה ספציפית" },
          ] as { v: UiMode; label: string; icon: string; sub: string }[]).map(({ v, label, icon, sub }) => {
            const active = uiMode === v;
            return (
              <button
                key={v}
                type="button"
                onClick={() => { setUiMode(v); if (v !== "focused") setCategory(undefined); }}
                disabled={isLoading}
                className="py-3 px-4 rounded-xl text-sm font-semibold border transition-all text-right"
                style={{
                  background: active ? MINT_MUTED : "#F9FAFB",
                  borderColor: active ? MINT : "#E5E7EB",
                  color: active ? MINT : "#6B7280",
                }}
              >
                <span className="text-base block mb-0.5">{icon}</span>
                <span className="block">{label}</span>
                <span className="block text-xs opacity-70 font-normal mt-0.5">{sub}</span>
              </button>
            );
          })}
        </div>

        {/* Marketing Gap — full-width */}
        <button
          type="button"
          onClick={() => { setUiMode("marketing"); setCategory("marketing"); }}
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-xl text-sm font-semibold border transition-all text-right"
          style={{
            background: uiMode === "marketing" ? MINT_MUTED : "#F9FAFB",
            borderColor: uiMode === "marketing" ? MINT : "rgba(16,185,129,0.2)",
            color: uiMode === "marketing" ? MINT : "#9CA3AF",
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
              style={{ background: MINT_MUTED, color: MINT, border: `1px solid ${MINT_BORDER}` }}
            >
              ⚡ מהיר
            </span>
          </div>
        </button>

        {/* Focused sub-category cards */}
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
                    background: active ? MINT_MUTED : "#F9FAFB",
                    borderColor: active ? MINT : "#E5E7EB",
                    color: active ? MINT : "#9CA3AF",
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
        <label className="block text-sm font-semibold text-gray-700">
          פרטים נוספים
          <span className="text-gray-400 font-normal text-xs mr-2">(אופציונלי)</span>
        </label>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="תחום עיסוק, שוק יעד, מיקוד גיאוגרפי..."
          disabled={isLoading}
          rows={2}
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900
                     placeholder:text-gray-400 focus:outline-none resize-none transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          style={{ direction: "rtl" }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = MINT_BORDER;
            e.currentTarget.style.boxShadow = `0 0 0 3px ${MINT_MUTED}`;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "#E5E7EB";
            e.currentTarget.style.boxShadow = "none";
          }}
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
            ? "#F3F4F6"
            : `linear-gradient(135deg, ${MINT} 0%, #059669 100%)`,
          color: isSubmitDisabled ? "#9CA3AF" : "#FFFFFF",
          cursor: isSubmitDisabled ? "not-allowed" : "pointer",
          boxShadow: !isSubmitDisabled ? "0 4px 24px rgba(16,185,129,0.3)" : "none",
        }}
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
        <p className="text-xs text-center" style={{ color: MINT }}>
          בחר קטגוריה לניתוח ממוקד
        </p>
      )}
    </form>
  );
}
