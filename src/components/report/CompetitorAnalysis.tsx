"use client";

import type { ResearchReport, CompetitorProfile } from "@/types/research";
import { M, MM, MB, S, SB } from "./tokens";
import { SectionCard, Tag, RiskBadge } from "./primitives";

function BusinessCard({ profile, isUser }: { profile: CompetitorProfile; isUser?: boolean }) {
  return (
    <div className="rounded-xl p-4 space-y-3"
         style={{
           background: isUser ? MM : S,
           border: `1px solid ${isUser ? MB : SB}`,
         }}>
      <div className="flex items-center gap-2 flex-wrap">
        <h3 className="font-bold text-gray-900">{profile.name}</h3>
        {isUser && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: MM, color: M, border: `1px solid ${MB}` }}>
            העסק שלך
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: M }}>מיצוב</p>
          <p className="text-gray-600 text-xs">{profile.identityAndNarrative.positioning}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: M }}>קהל יעד</p>
          <p className="text-gray-600 text-xs">{profile.targetAudience.demographics}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: M }}>מחיר ומודל</p>
          <div className="flex flex-wrap gap-1">
            {profile.offer.pricingModels.map((pm, j) => <Tag key={j} label={pm} color="mint" />)}
            {profile.offer.priceRange && <Tag label={profile.offer.priceRange} />}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: M }}>ערוצים</p>
          <div className="flex flex-wrap gap-1">
            {profile.marketingAndTraffic.distributionChannels.slice(0, 4).map((ch, j) => (
              <Tag key={j} label={ch} />
            ))}
          </div>
        </div>
      </div>
      {profile.targetAudience.specificNeeds.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: M }}>צרכים ספציפיים</p>
          <div className="flex flex-wrap gap-1">
            {profile.targetAudience.specificNeeds.map((n, j) => <Tag key={j} label={n} color="green" />)}
          </div>
        </div>
      )}
    </div>
  );
}

export function CompetitorAnalysisSection({ report }: { report: ResearchReport }) {
  const data = report.step1;
  if (!data) return null;
  return (
    <SectionCard icon="🔍" title="שלב 1: העסק שלי מול השוק">
      {data.marketOverview && (
        <div className="rounded-xl p-4 text-sm text-gray-700 leading-relaxed"
             style={{ background: S, border: `1px solid ${SB}` }}>
          {data.marketOverview}
        </div>
      )}

      {data.userProfile && (
        <div>
          <p className="text-sm font-bold mb-2" style={{ color: M }}>◆ העסק שלך</p>
          <BusinessCard profile={data.userProfile} isUser />
        </div>
      )}

      {data.competitors.length > 0 && (
        <div>
          <p className="text-sm font-bold text-gray-900 mb-2">⚔️ מתחרים מרכזיים בתעשייה</p>
          <div className="space-y-3">
            {data.competitors.map((c, i) => <BusinessCard key={i} profile={c} />)}
          </div>
        </div>
      )}

      {data.indirectCompetitors.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-900 mb-2">מתחרים עקיפים</p>
          <div className="flex flex-wrap gap-2">
            {data.indirectCompetitors.map((ic, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                   style={{ background: S, border: `1px solid ${SB}` }}>
                <span className="text-sm text-gray-700">{ic.name}</span>
                <RiskBadge level={ic.threatLevel} />
              </div>
            ))}
          </div>
        </div>
      )}
    </SectionCard>
  );
}
