"use client";

import { useEffect, useState } from "react";
import { M, MM, MB } from "./tokens";

export function DownloadPdfButton({
  targetRef,
  filename,
}: {
  targetRef: React.RefObject<HTMLDivElement | null>;
  filename: string;
}) {
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleDownload = async () => {
    if (!mounted || typeof window === "undefined") return;
    const el = targetRef.current;
    if (!el) return;
    setLoading(true);
    try {
      // Ensure Assistant font is loaded before capture
      if (!document.getElementById("assistant-pdf-font")) {
        const link = document.createElement("link");
        link.id   = "assistant-pdf-font";
        link.rel  = "stylesheet";
        link.href = "https://fonts.googleapis.com/css2?family=Assistant:wght@400;700;800&display=swap";
        document.head.appendChild(link);
        await new Promise<void>((r) => setTimeout(r, 800));
      }

      const [html2canvasMod, jspdfMod] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const html2canvas = (html2canvasMod as any).default ?? html2canvasMod;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const JsPDF = (jspdfMod as any).jsPDF ?? (jspdfMod as any).default;

      // Scroll to top and wait two frames for layout to settle
      window.scrollTo({ top: 0, behavior: "instant" });
      await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

      // IMPORTANT: Do NOT use allowTaint:true — taints the canvas and breaks
      // toDataURL() with SecurityError. useCORS:true is sufficient.
      const canvas = await html2canvas(el, {
        scale: 2,
        backgroundColor: "#FFFFFF",   // white background for mint theme
        useCORS: true,
        logging: false,
        scrollX: -window.scrollX,
        scrollY: -window.scrollY,
        width:        el.scrollWidth,
        height:       el.scrollHeight,
        windowWidth:  el.scrollWidth,
        windowHeight: el.scrollHeight,
        imageTimeout: 15000,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.92);

      const pdf   = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW  = pageW;
      const imgH  = (canvas.height * imgW) / canvas.width;

      let y = 0, page = 0;
      while (y < imgH) {
        if (page > 0) pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, -y, imgW, imgH);
        y += pageH;
        page++;
      }

      pdf.save(filename);
    } catch (err) {
      console.error("[PDF] Export failed:", err);
      if (err instanceof Error) {
        console.error("[PDF] Message:", err.message);
        console.error("[PDF] Stack:", err.stack);
      }
      alert("שגיאה ביצירת ה-PDF — אנא נסה שנית");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="flex items-center gap-2 font-bold text-sm px-5 py-2.5 rounded-xl transition-all disabled:opacity-50"
      style={{
        background: loading ? MM : `linear-gradient(135deg, ${M} 0%, #059669 100%)`,
        color: "#fff",
        boxShadow: loading ? "none" : `0 4px 20px ${M}40`,
      }}
    >
      {loading ? (
        <>
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>מייצר PDF...</span>
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>הורד דוח PDF</span>
        </>
      )}
    </button>
  );
}

// suppress unused token warning
void MB;
