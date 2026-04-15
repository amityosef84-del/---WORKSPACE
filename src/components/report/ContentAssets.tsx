"use client";

import type { ResearchReport, Step7ContentAssets } from "@/types/research";
import { M, MM, MB } from "./tokens";
import { SectionCard, AssetCard } from "./primitives";

const PLATFORM_ICON: Record<string, string> = {
  instagram: "📸", tiktok: "🎵", facebook: "👥", linkedin: "💼",
  google: "🔍", meta: "📣", both: "📣",
};
const FORMAT_LABEL: Record<string, string> = {
  reel: "ריל", post: "פוסט", carousel: "קרוסלה", story: "סטורי",
};

export function ContentAssetsSection({ report }: { report: ResearchReport }) {
  const data: Step7ContentAssets | undefined = report.step7;
  if (!data) return null;

  const adCopyText = [
    `📢 ${data.adCopy.headline}`,
    data.adCopy.subheadline,
    "",
    data.adCopy.bodyText,
    "",
    `👉 ${data.adCopy.callToAction}`,
  ].join("\n");

  const headlineText = [
    data.landingPageHeadline.main,
    data.landingPageHeadline.sub,
    `→ ${data.landingPageHeadline.cta}`,
  ].join("\n");

  return (
    <SectionCard icon="✍️" title="שלב 7: תוכן אסטרטגי מוכן לשימוש">

      {/* Strategic angle */}
      {data.strategicAngle && (
        <div className="rounded-xl p-4 flex items-start gap-3"
             style={{ background: MM, border: `1px solid ${MB}` }}>
          <span className="text-xl shrink-0 mt-0.5">🎯</span>
          <div>
            <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: M }}>
              הזווית התחרותית שלך
            </p>
            <p className="text-gray-900 font-semibold text-sm leading-relaxed">{data.strategicAngle}</p>
          </div>
        </div>
      )}

      {/* Ad copy */}
      {data.adCopy && (
        <AssetCard
          badge={`📣 Ad Copy — ${data.adCopy.platform === "google" ? "Google Ads" : data.adCopy.platform === "meta" ? "Meta Ads" : "Google & Meta"}`}
          copyText={adCopyText}
        >
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-400 mb-1">כותרת</p>
              <p className="text-lg font-black text-gray-900 leading-tight">{data.adCopy.headline}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">תת-כותרת</p>
              <p className="text-sm font-semibold text-gray-700">{data.adCopy.subheadline}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">גוף הפרסומת</p>
              <p className="text-sm text-gray-600 leading-relaxed">{data.adCopy.bodyText}</p>
            </div>
            <div className="pt-1">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white"
                    style={{ background: `linear-gradient(135deg, ${M} 0%, #059669 100%)` }}>
                {data.adCopy.callToAction}
              </span>
            </div>
          </div>
        </AssetCard>
      )}

      {/* Landing page headline */}
      {data.landingPageHeadline && (
        <AssetCard badge="🌐 כותרת דף נחיתה" copyText={headlineText}>
          <div className="space-y-3 text-center py-2">
            <p className="text-2xl font-black text-gray-900 leading-tight">{data.landingPageHeadline.main}</p>
            <p className="text-sm text-gray-500 leading-relaxed max-w-md mx-auto">{data.landingPageHeadline.sub}</p>
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: `linear-gradient(135deg, ${M} 0%, #059669 100%)`, boxShadow: `0 4px 20px ${M}40` }}>
              {data.landingPageHeadline.cta}
            </span>
          </div>
        </AssetCard>
      )}

      {/* Social posts */}
      {data.socialPosts.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-900 mb-3">
            📱 3 פוסטים/ריילז ויראליים — מוכנים לפרסום
          </p>
          <div className="space-y-3">
            {data.socialPosts.map((post, i) => {
              const postText = [post.hook, "", post.content, "", `#${post.platform} #${post.format}`].join("\n");
              const platformIcon = PLATFORM_ICON[post.platform] ?? "📱";
              const formatLabel  = FORMAT_LABEL[post.format]    ?? post.format;
              return (
                <AssetCard
                  key={i}
                  badge={`${platformIcon} ${post.platform.charAt(0).toUpperCase() + post.platform.slice(1)} — ${formatLabel}`}
                  copyText={postText}
                >
                  <div className="space-y-3">
                    {post.concept && (
                      <p className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                         style={{ background: MM, color: M }}>
                        💡 {post.concept}
                      </p>
                    )}
                    <div>
                      <p className="text-xs text-gray-400 mb-1">שורת פתיחה (Hook)</p>
                      <p className="text-base font-bold text-gray-900 leading-snug">{post.hook}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">סקריפט</p>
                      <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{post.content}</p>
                    </div>
                  </div>
                </AssetCard>
              );
            })}
          </div>
        </div>
      )}
    </SectionCard>
  );
}
