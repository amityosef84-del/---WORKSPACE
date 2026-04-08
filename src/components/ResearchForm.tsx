"use client";

import { useState } from "react";
import type { ResearchMode, FocusedCategory } from "@/types/research";

interface Props {
  onSubmit: (url: string, details?: string, mode?: ResearchMode, category?: FocusedCategory) => void;
  isLoading: boolean;
}

const EXAMPLE_URLS = ["monday.com", "notion.so", "hubspot.com", "wix.com"];

const FOCUSED_OPTIONS: { id: FocusedCategory; label: string; icon: string; desc: string }[] = [
  { id: "competitors", label: "מתחרים",   icon: "🏆", desc: "ניתוח עמוק של שחקני השוק" },
  { id: "risk",        label: "סיכונים",   icon: "⚡", desc: "איומים ואסטרטגיות מיתון" },
  { id: "porters",     label: "5 כוחות",   icon: "🏛️", desc: "מודל פורטר ואטרקטיביות" },
];

export default function ResearchForm({ onSubmit, isLoading }: Props) {
  const [url, setUrl]         = useState("");
  const [details, setDetails] = useState("");
  const [mode, setMode]       = useState<ResearchMode>("full");
  const [category, setCategory] = useState<FocusedCategory | undefined>(undefined);

  const normalizeUrl = (raw: string) => {
    const t = raw.trim();
    if (!t) return "";
    return t.startsWith("http://") || t.startsWith("https://") ? t : `https://${t}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || isLoading) return;
    onSubmit(normalizeUrl(url), details.trim() || undefined, mode, mode === "focused" ? category : undefined);
  };

  const gold = "#D4AF37";
  const goldMuted = "rgba(212,175,55,0.12)";
  const goldBorder = "rgba(212,175,55,0.28)";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* URL Field */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-zinc-200">
          כתובת אתר המתחרה
          <span className="text-red-400 mr-1">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="monday.com  /  https://notion.so"
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

      {/* Research Mode Toggle */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-zinc-300">סוג הניתוח</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { v: "full"    as ResearchMode, label: "מחקר מלא", icon: "🔬", sub: "כל 6 השלבים" },
            { v: "focused" as ResearchMode, label: "ניתוח ממוקד", icon: "🎯", sub: "קטגוריה ספציפית" },
          ].map(({ v, label, icon, sub }) => {
            const active = mode === v;
            return (
              <button
                key={v}
                type="button"
                onClick={() => { setMode(v); if (v === "full") setCategory(undefined); }}
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

        {/* Focused category selector */}
        {mode === "focused" && (
          <div className="grid grid-cols-3 gap-2 pt-1 fade-in">
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
          placeholder="גיאוגרפיה, פלח שוק, שאלות ספציפיות..."
          disabled={isLoading}
          rows={2}
          className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white
                     placeholder:text-zinc-600 focus:outline-none resize-none transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          style={{ direction: "rtl" }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = goldBorder;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
          }}
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!url.trim() || isLoading || (mode === "focused" && !category)}
        className="w-full font-bold py-4 px-6 rounded-xl transition-all duration-200
                   flex items-center justify-center gap-3 text-sm relative overflow-hidden"
        style={{
          background: !url.trim() || isLoading || (mode === "focused" && !category)
            ? "rgba(255,255,255,0.06)"
            : `linear-gradient(135deg, ${gold} 0%, #C5A028 100%)`,
          color: !url.trim() || isLoading || (mode === "focused" && !category)
            ? "#52525b"
            : "#000000",
          cursor: !url.trim() || isLoading || (mode === "focused" && !category)
            ? "not-allowed"
            : "pointer",
          boxShadow: url.trim() && !isLoading && (mode !== "focused" || category)
            ? "0 4px 24px rgba(212,175,55,0.3)"
            : "none",
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
            <span>
              {mode === "focused" && !category
                ? "בחר קטגוריה לניתוח"
                : mode === "focused"
                ? `נתח: ${FOCUSED_OPTIONS.find(o => o.id === category)?.label}`
                : "הפעל ניתוח מלא"}
            </span>
          </>
        )}
      </button>

      {mode === "focused" && !category && !isLoading && (
        <p className="text-xs text-center" style={{ color: "rgba(212,175,55,0.6)" }}>
          בחר קטגוריה לניתוח ממוקד
        </p>
      )}
    </form>
  );
}
