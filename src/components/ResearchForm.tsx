"use client";

import { useState } from "react";

interface Props {
  onSubmit: (url: string, details?: string) => void;
  isLoading: boolean;
}

const EXAMPLE_URLS = [
  "monday.com",
  "notion.so",
  "hubspot.com",
  "wix.com",
];

export default function ResearchForm({ onSubmit, isLoading }: Props) {
  const [url, setUrl] = useState("");
  const [details, setDetails] = useState("");

  const normalizeUrl = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return "";
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed;
    }
    return `https://${trimmed}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || isLoading) return;
    onSubmit(normalizeUrl(url), details.trim() || undefined);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-200">
          קישור לאתר המתחרה (URL)
          <span className="text-red-400 mr-1">*</span>
        </label>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="לדוגמה: monday.com או https://www.hubspot.com"
          disabled={isLoading}
          className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white
                     placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500
                     focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all text-left dir-ltr"
          dir="ltr"
        />
        <p className="text-xs text-slate-500">
          המערכת תסרוק את האתר אוטומטית לפני תחילת הניתוח
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-200">
          פרטים נוספים על העסק{" "}
          <span className="text-slate-500 font-normal text-xs">(אופציונלי)</span>
        </label>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="פרטים נוספים שיעזרו לניתוח — גיאוגרפיה, פלח שוק, מודל עסקי, שאלות ספציפיות..."
          disabled={isLoading}
          rows={3}
          className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white
                     placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500
                     focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed
                     resize-none transition-all text-right"
        />
      </div>

      {/* Example chips */}
      <div className="space-y-2">
        <p className="text-xs text-slate-500 font-medium">דוגמאות לאתרים:</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_URLS.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setUrl(example)}
              disabled={isLoading}
              className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-600
                         hover:border-slate-500 text-slate-300 hover:text-white rounded-lg
                         px-3 py-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed
                         font-mono"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={!url.trim() || isLoading}
        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600
                   disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed
                   text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-200
                   shadow-lg shadow-blue-900/30 hover:shadow-blue-900/50
                   flex items-center justify-center gap-2.5"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            <span>מעבד מחקר... אנא המתן</span>
          </>
        ) : (
          <>
            <span>🔍</span>
            <span>נתח את אתר המתחרה</span>
          </>
        )}
      </button>

      {isLoading && (
        <p className="text-xs text-center text-slate-500">
          המחקר מורכב מ-5 שלבים עוקבים — סריקה ו-4 שלבי AI — ועשוי לקחת מספר דקות
        </p>
      )}
    </form>
  );
}
