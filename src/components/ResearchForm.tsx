"use client";

import { useState } from "react";

interface Props {
  onSubmit: (market: string, context?: string) => void;
  isLoading: boolean;
}

const EXAMPLES = [
  "פלטפורמות SaaS לניהול לקוחות (CRM)",
  "שירותי ייעוץ שיווק דיגיטלי לעסקים קטנים",
  "אפליקציות בריאות ופיטנס",
  "פתרונות AI לשירות לקוחות",
];

export default function ResearchForm({ onSubmit, isLoading }: Props) {
  const [market, setMarket] = useState("");
  const [context, setContext] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!market.trim() || isLoading) return;
    onSubmit(market.trim(), context.trim() || undefined);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-200">
          שוק או מתחרה לניתוח
          <span className="text-red-400 mr-1">*</span>
        </label>
        <input
          type="text"
          value={market}
          onChange={(e) => setMarket(e.target.value)}
          placeholder='לדוגמה: "פלטפורמות CRM" או "Salesforce"'
          disabled={isLoading}
          className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white
                     placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500
                     focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all text-right"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-200">
          הקשר נוסף{" "}
          <span className="text-slate-500 font-normal text-xs">(אופציונלי)</span>
        </label>
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="פרטים נוספים שיעזרו לניתוח, לדוגמה: גיאוגרפיה, פלח שוק ספציפי, מודל עסקי..."
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
        <p className="text-xs text-slate-500 font-medium">דוגמאות:</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setMarket(example)}
              disabled={isLoading}
              className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-600
                         hover:border-slate-500 text-slate-300 hover:text-white rounded-lg
                         px-3 py-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={!market.trim() || isLoading}
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
            <span>🚀</span>
            <span>הפעל מחקר שוק מעמיק</span>
          </>
        )}
      </button>

      {isLoading && (
        <p className="text-xs text-center text-slate-500">
          המחקר מורכב מ-4 שלבים עוקבים ועשוי לקחת מספר דקות
        </p>
      )}
    </form>
  );
}
