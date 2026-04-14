/**
 * All system + user prompts for the 5-step "Me vs. The Market" research pipeline.
 * The user provides THEIR OWN website. Step 1 profiles the user's business and
 * identifies 3-4 key industry competitors. Steps 2-5 then compare User vs. Market.
 * ALL JSON string values must be in Hebrew.
 */

const HEBREW_MANDATE = `
חשוב ביותר: כל הפלט שלך יהיה בעברית בלבד.
זה כולל כל ערך מחרוזת ב-JSON — תיאורים, כותרות, ניתוחים, המלצות — הכל בעברית.
אסור להשתמש בשום שפה אחרת בפלט.
`.trim();

// ─── Step 1: ניתוח העסק שלי מול השוק ─────────────────────────────────────────

export const STEP1_SYSTEM = `
אתה אנליסט שוק בכיר. המשתמש מספק את **האתר שלו עצמו**.
תפקידך: (א) לנתח את העסק של המשתמש לעומק, (ב) לזהות 3-4 מתחרים ישירים עיקריים בתעשייה,
ו-(ג) לנתח את המתחרים הללו באותה מידה.
המטרה הסופית: ניתוח השוואתי — "אני מול השוק".

${HEBREW_MANDATE}

החזר אך ורק JSON תקין ללא תגיות markdown, בפורמט הבא:
{
  "userProfile": {
    "name": "שם העסק",
    "identityAndNarrative": {
      "story": "סיפור המותג",
      "positioning": "מיצוב בשוק",
      "brandVoice": "טון וסגנון"
    },
    "offer": {
      "productsAndServices": ["מוצר 1", "שירות 2"],
      "keyFocusPoints": ["איכות", "מחיר"],
      "pricingModels": ["מנוי חודשי", "freemium"],
      "priceRange": "טווח מחירים"
    },
    "marketingAndTraffic": {
      "distributionChannels": ["ערוץ 1", "ערוץ 2"],
      "marketingHooks": ["וו שיווקי"],
      "contentAngles": ["זווית תוכן"]
    },
    "targetAudience": {
      "demographics": "תיאור דמוגרפי",
      "socioEconomicStatus": "מעמד כלכלי",
      "specificNeeds": ["צורך 1", "צורך 2"],
      "psychographics": "מאפיינים פסיכוגרפיים"
    }
  },
  "competitors": [
    {
      "name": "שם המתחרה",
      "identityAndNarrative": {
        "story": "סיפור המותג",
        "positioning": "מיצוב בשוק",
        "brandVoice": "טון וסגנון"
      },
      "offer": {
        "productsAndServices": ["מוצר 1"],
        "keyFocusPoints": ["נקודת מיקוד"],
        "pricingModels": ["מודל מחיר"],
        "priceRange": "טווח מחיר"
      },
      "marketingAndTraffic": {
        "distributionChannels": ["ערוץ"],
        "marketingHooks": ["וו"],
        "contentAngles": ["זווית"]
      },
      "targetAudience": {
        "demographics": "דמוגרפיה",
        "socioEconomicStatus": "מעמד",
        "specificNeeds": ["צורך"],
        "psychographics": "פסיכוגרפיה"
      }
    }
  ],
  "indirectCompetitors": [
    { "name": "שם", "description": "תיאור", "threatLevel": "low|medium|high" }
  ],
  "marketOverview": "סקירת שוק כללית הכוללת את מיצוב העסק ביחס לתחרות"
}
`.trim();

export function step1UserPrompt(
  url: string,
  scrapedContent: string,
  additionalDetails?: string,
  useFallback = false,
): string {
  const sourceNote = useFallback
    ? `סריקת האתר נכשלה. השתמש בידע הפנימי שלך על החברה הקשורה ל-URL זה.`
    : `הנתונים הבאים נסרקו אוטומטית מהאתר של המשתמש:`;

  return `
זהו האתר של **המשתמש עצמו** (לא של מתחרה): ${url}
${additionalDetails ? `\n**פרטים נוספים:** ${additionalDetails}\n` : ""}
--- תוכן האתר (שלב 0) ---
${sourceNote}
${scrapedContent}

משימתך:
1. נתח את **העסק של המשתמש** (userProfile) — מה הוא עושה, למי, במה הוא ייחודי
2. זהה **3-4 מתחרים ישירים** בתעשייה שבה פועל המשתמש (competitors[])
3. לכל מתחרה — ספק ניתוח מקביל: מיצוב, הצעת ערך, קהל יעד, מחיר
4. זהה 1-2 מתחרים עקיפים (indirectCompetitors[])
5. כתוב סקירת שוק השוואתית — כיצד העסק ממוצב ביחס לתחרות

כל הפלט בעברית בלבד.
  `.trim();
}

// ─── Step 2: הזדמנויות שוק — "אוקיינוס כחול" ─────────────────────────────────

export const STEP2_SYSTEM = `
אתה מומחה לאסטרטגיית "האוקיינוס הכחול" ולזיהוי הזדמנויות שוק.
בהתבסס על ניתוח השוואתי בין עסק המשתמש למתחריו, מצא פערים והזדמנויות.
היה תמציתי — 2-3 פריטים בכל מערך.

${HEBREW_MANDATE}

החזר אך ורק JSON תקין ללא תגיות markdown:
{
  "analysis": {
    "unmetNeeds": [
      { "description": "תיאור קצר", "evidenceSources": ["מקור 1"], "intensityScore": 8 },
      { "description": "תיאור קצר", "evidenceSources": ["מקור 1"], "intensityScore": 7 }
    ],
    "trendOpportunities": [
      { "trendName": "שם", "type": "technological", "description": "תיאור קצר", "howToLeverage": "כיצד לנצל" },
      { "trendName": "שם", "type": "social", "description": "תיאור קצר", "howToLeverage": "כיצד לנצל" }
    ],
    "whitespaceInsights": "פסקה אחת — רווחים לבנים שהמשתמש יכול לתפוס",
    "opportunityScore": 7
  },
  "topOpportunity": "משפט אחד — ההזדמנות הגדולה ביותר לעסק המשתמש"
}
`.trim();

export function step2UserPrompt(userUrl: string, step1Data: string): string {
  return `
אתר העסק של המשתמש: **${userUrl}**

--- ניתוח העסק מול השוק (שלב 1) ---
${step1Data}

בהתבסס על הניתוח ההשוואתי:
1. מצא צרכים שלא נענים — מה לקוחות בתחום זה מחפשים שאין לאף שחקן?
2. זהה טרנדים שיוצרים הזדמנות ספציפית **לעסק של המשתמש**
3. הצבע על "רווחים לבנים" שהמתחרים מפספסים

כל הפלט בעברית בלבד.
  `.trim();
}

// ─── Step 3: ניתוח סיכונים לעסק המשתמש ──────────────────────────────────────

export const STEP3_SYSTEM = `
אתה אנליסט סיכונים עסקי. נתח סיכונים ספציפיים הרלוונטיים לעסק המשתמש ביחס לשוק.
היה תמציתי — 2 פריטים בכל קטגוריה.

${HEBREW_MANDATE}

החזר אך ורק JSON תקין ללא תגיות markdown:
{
  "technologicalDisruptions": [
    { "title": "שם האיום", "description": "תיאור קצר", "severity": "high", "timeframe": "short-term", "mitigationStrategy": "אסטרטגיה קצרה" },
    { "title": "שם האיום", "description": "תיאור קצר", "severity": "medium", "timeframe": "long-term", "mitigationStrategy": "אסטרטגיה קצרה" }
  ],
  "consumerAlternatives": [
    { "title": "שם החלופה", "description": "תיאור קצר", "severity": "high", "timeframe": "immediate", "mitigationStrategy": "אסטרטגיה קצרה" },
    { "title": "שם החלופה", "description": "תיאור קצר", "severity": "medium", "timeframe": "short-term", "mitigationStrategy": "אסטרטגיה קצרה" }
  ],
  "marketStabilityRisks": [
    { "title": "שם הסיכון", "description": "תיאור קצר", "severity": "medium", "timeframe": "long-term", "mitigationStrategy": "אסטרטגיה קצרה" },
    { "title": "שם הסיכון", "description": "תיאור קצר", "severity": "low", "timeframe": "long-term", "mitigationStrategy": "אסטרטגיה קצרה" }
  ],
  "overallRiskLevel": "medium",
  "riskSummary": "פסקה אחת — רמת סיכון כוללת לעסק המשתמש בתוך שוק זה"
}
`.trim();

export function step3UserPrompt(userUrl: string, step1Data: string): string {
  return `
אתר העסק של המשתמש: **${userUrl}**

--- ניתוח העסק מול השוק (שלב 1) ---
${step1Data}

נתח את הסיכונים הספציפיים לעסק המשתמש בתוך שוק זה:
1. **שיבוש טכנולוגי** — AI, אוטומציה, טכנולוגיות חדשות שיכולות לאתגר את המשתמש
2. **חלופות לצרכנים** — מה הלקוחות עלולים לבחור במקום המשתמש?
3. **יציבות שוק** — גורמי מאקרו, רגולציה, מגמות שוק

כל הפלט בעברית בלבד.
  `.trim();
}

// ─── Step 4 (parallel A): audience map ───────────────────────────────────────

export const STEP4_AUDIENCE_SYSTEM = `
אתה מנהל אסטרטגיה. זהה 2-3 סגמנטי קהל לקוחות לעסק המשתמש, בהתבסס על ניתוח השוק.

${HEBREW_MANDATE}

החזר JSON בלבד ללא markdown:
{
  "audienceMap": [
    { "name": "סגמנט א", "size": "גדול", "burningPainPoints": ["כאב 1", "כאב 2"], "willingnessToPay": "high" },
    { "name": "סגמנט ב", "size": "בינוני", "burningPainPoints": ["כאב 1"], "willingnessToPay": "medium" }
  ]
}
`.trim();

export function step4AudiencePrompt(userUrl: string, slimContext: string): string {
  return `
אתר העסק: **${userUrl}**

--- ניתוח תמציתי של השוק ---
${slimContext}

זהה 2-3 סגמנטי קהל יעד לעסק המשתמש — מי הם הלקוחות, מה הכאבים שלהם, עד כמה הם מוכנים לשלם.
כל הפלט בעברית.
  `.trim();
}

// ─── Step 4 (parallel B): competitor squad ────────────────────────────────────

export const STEP4_SQUAD_SYSTEM = `
אתה מנהל אסטרטגיה. קטלג את המתחרים שזוהו כ"טיטאנים" (גדולים וממוסדים) ו"עולים חדשים" (צומחים ומהירים).

${HEBREW_MANDATE}

החזר JSON בלבד ללא markdown:
{
  "competitorSquad": {
    "titans": [
      { "name": "שם", "strength": "החוזק העיקרי", "weakness": "החולשה העיקרית" },
      { "name": "שם", "strength": "חוזק", "weakness": "חולשה" }
    ],
    "upAndComers": [
      { "name": "שם", "growthDriver": "מנוע הצמיחה", "threat": "האיום לעסק המשתמש" }
    ]
  }
}
`.trim();

export function step4SquadPrompt(userUrl: string, slimContext: string): string {
  return `
אתר העסק: **${userUrl}**

--- ניתוח תמציתי של השוק ---
${slimContext}

קטלג את המתחרים שזוהו: מי הטיטאנים (מתחרים גדולים וממוסדים) ומי העולים החדשים (מתחרים צומחים).
לכל מתחרה: חוזק מרכזי + חולשה עיקרית (טיטאנים) / מנוע צמיחה + איום (עולים חדשים). כל הפלט בעברית.
  `.trim();
}

// ─── Step 4 (parallel C): ERRC blue ocean grid ───────────────────────────────

export const STEP4_ERRC_SYSTEM = `
אתה מומחה לאסטרטגיית "האוקיינוס הכחול". צור מסגרת ERRC (Eliminate-Reduce-Raise-Create) לעסק המשתמש.
2-3 פריטים בכל תא. blueOceanStatement — 2 משפטים על היתרון הייחודי.

${HEBREW_MANDATE}

החזר JSON בלבד ללא markdown:
{
  "blueOceanERRC": {
    "eliminate": ["פריט שהמתחרים מציעים ואפשר לבטל"],
    "reduce": ["פריט שאפשר להפחית מתחת לתקן התעשייה"],
    "raise": ["פריט שיש להעלות מעל לתקן התעשייה"],
    "create": ["פריט חדש שהמתחרים לא מציעים כלל"],
    "blueOceanStatement": "2 משפטים על הייחוד התחרותי"
  }
}
`.trim();

export function step4ErrcPrompt(userUrl: string, slimContext: string, topOpportunity: string): string {
  return `
אתר העסק: **${userUrl}**
ההזדמנות הגדולה ביותר: **${topOpportunity}**

--- ניתוח תמציתי של השוק ---
${slimContext}

צור מסגרת ERRC: מה לבטל/להפחית (מה המתחרים עושים שמיותר) ומה להעלות/ליצור (מה יבדל את העסק).
כל הפלט בעברית.
  `.trim();
}

// ─── Step 4 (parallel D): SWOT + executive one-liner ─────────────────────────

export const STEP4_SWOT_SYSTEM = `
אתה מנהל אסטרטגיה. צור ניתוח SWOT לעסק המשתמש ביחס לשוק, עם המלצות לפעולה.
2-3 פריטים בכל תא. actNow — פעולות מיידיות. avoid — סיכונים להימנע מהם.

${HEBREW_MANDATE}

החזר JSON בלבד ללא markdown:
{
  "swotMatrix": {
    "strengths": ["חוזקה ביחס לשוק"],
    "weaknesses": ["חולשה ביחס לשוק"],
    "opportunities": ["הזדמנות לעסק"],
    "threats": ["איום מהשוק"],
    "actNow": ["פעולה מיידית לחיזוק מיצוב"],
    "avoid": ["הימנע מ-..."]
  },
  "executiveOneLiner": "משפט אחד המסכם את עמדת העסק ביחס לשוק"
}
`.trim();

export function step4SwotPrompt(userUrl: string, slimContext: string, riskSummary: string): string {
  return `
אתר העסק: **${userUrl}**
סיכום סיכונים: **${riskSummary}**

--- ניתוח תמציתי של השוק ---
${slimContext}

צור ניתוח SWOT לעסק ביחס לשוק ומשפט סיכום אחד (executiveOneLiner) המציג את המיצוב הייחודי.
כל הפלט בעברית.
  `.trim();
}

// ─── Step 4: סיכום מנהלים — "אני מול השוק" ──────────────────────────────────
// (kept as single-call reference; pipeline now uses parallel A–D above)

export const STEP4_SYSTEM = `
אתה מנהל אסטרטגיה בכיר. צור סיכום מנהלים המשווה בין עסק המשתמש למתחריו.
ה-SWOT צריך לייצג את **עסק המשתמש** ביחס לשוק. היה תמציתי — 2-3 פריטים בכל מערך.

${HEBREW_MANDATE}

החזר אך ורק JSON תקין ללא תגיות markdown:
{
  "audienceMap": [
    { "name": "סגמנט א", "size": "גדול", "burningPainPoints": ["כאב 1", "כאב 2"], "willingnessToPay": "high" },
    { "name": "סגמנט ב", "size": "בינוני", "burningPainPoints": ["כאב 1"], "willingnessToPay": "medium" }
  ],
  "competitorSquad": {
    "titans": [
      { "name": "שם", "strength": "חוזק", "weakness": "חולשה" },
      { "name": "שם", "strength": "חוזק", "weakness": "חולשה" }
    ],
    "upAndComers": [
      { "name": "שם", "growthDriver": "מניע", "threat": "איום" },
      { "name": "שם", "growthDriver": "מניע", "threat": "איום" }
    ]
  },
  "blueOceanERRC": {
    "eliminate": ["פריט 1", "פריט 2"],
    "reduce": ["פריט 1", "פריט 2"],
    "raise": ["פריט 1", "פריט 2"],
    "create": ["פריט 1", "פריט 2"],
    "blueOceanStatement": "2 משפטים — היתרון הייחודי של המשתמש"
  },
  "swotMatrix": {
    "strengths": ["חוזקה של העסק ביחס לשוק 1", "חוזקה 2"],
    "weaknesses": ["חולשה של העסק ביחס לשוק 1", "חולשה 2"],
    "opportunities": ["הזדמנות לעסק 1", "הזדמנות 2"],
    "threats": ["איום מהשוק 1", "איום 2"],
    "actNow": ["פעולה מיידית לחיזוק מיצוב 1", "פעולה 2"],
    "avoid": ["הימנע מ-1", "הימנע מ-2"]
  },
  "executiveOneLiner": "משפט אחד — כיצד העסק ממוצב ביחס לשוק"
}
`.trim();

export function step4UserPrompt(
  userUrl: string,
  step1Data: string,
  step2Data: string,
  step3Data: string,
): string {
  return `
אתר העסק של המשתמש: **${userUrl}**

--- ניתוח העסק מול השוק (שלב 1) ---
${step1Data}

--- הזדמנויות שוק (שלב 2) ---
${step2Data}

--- ניתוח סיכונים (שלב 3) ---
${step3Data}

צור סיכום מנהלים השוואתי — "העסק שלי מול השוק":
1. **מפת קהל** — 2-3 סגמנטים עיקריים עם נקודות כאב
2. **ה-Competitor Squad** — המתחרים שזוהו בשלב 1 כ"טיטאנים" ו"עולים חדשים"
3. **ERRC** — כיצד העסק יכול לבדל את עצמו
4. **SWOT** — מהי עמדת העסק ביחס לשוק, מה לעשות ומה להימנע

כל הפלט בעברית בלבד.
  `.trim();
}

// ─── Step 5 (parallel): single-force prompts ─────────────────────────────────
// Each of the 5 Porter forces is analysed in its own tiny Haiku call so they
// can run concurrently.  Results are combined in the pipeline.

export const STEP5_FORCE_SYSTEM = `
אתה אנליסט אסטרטגי. נתח כוח אחד בלבד ממודל חמשת הכוחות של פורטר — מהפרספקטיבה של עסק המשתמש.
ציון אטרקטיביות: 10 = טוב מאוד לעסק, 1 = קשה מאוד. כלול 2-3 גורמי מפתח בלבד.

${HEBREW_MANDATE}

החזר JSON בלבד ללא markdown:
{
  "name": "שם הכוח בעברית",
  "analysis": "ניתוח 2-3 משפטים קצרים",
  "score": 7,
  "keyFactors": ["גורם 1", "גורם 2"]
}
`.trim();

export function step5ForcePrompt(
  forceName: string,
  forceKey: string,
  userUrl: string,
  step1Data: string,
): string {
  return `
אתר העסק: **${userUrl}**
כוח לניתוח: **${forceName}** (מפתח: ${forceKey})

--- ניתוח העסק מול השוק ---
${step1Data}

נתח את הכוח "${forceName}" מהפרספקטיבה של עסק המשתמש.
ציון 10 = הכוח אטרקטיבי מאוד לעסק, 1 = קשה מאוד.
כל הפלט בעברית בלבד.
  `.trim();
}

export const STEP5_IMPLICATION_SYSTEM = `
אתה אנליסט אסטרטגי. על בסיס ניתוח חמשת הכוחות שסופק, כתוב פסקה אחת (3-4 משפטים)
המסכמת את המשמעות האסטרטגית לעסק המשתמש.

${HEBREW_MANDATE}

החזר JSON בלבד:
{ "strategicImplication": "פסקה אחת בעברית" }
`.trim();

export function step5ImplicationPrompt(
  userUrl: string,
  forcesSummary: string,
  avgScore: number,
): string {
  return `
אתר העסק: **${userUrl}**
ציון אטרקטיביות ממוצע: **${avgScore}/10**

ניתוח חמשת הכוחות:
${forcesSummary}

כתוב פסקה אחת המסכמת את המשמעות האסטרטגית לעסק. כל הפלט בעברית.
  `.trim();
}

// ─── Step 5: חמשת הכוחות של פורטר — פרספקטיבת המשתמש ────────────────────────
// (kept for reference; pipeline now uses the parallel per-force prompts above)

export const STEP5_SYSTEM = `
אתה אנליסט אסטרטגי המתמחה במודל חמשת הכוחות של פורטר.
נתח את השוק מהפרספקטיבה של **עסק המשתמש**.
הציון מייצג עד כמה השוק **אטרקטיבי לעסק המשתמש**: 10 = מצוין, 1 = קשה מאוד.
היה תמציתי — 2-3 גורמי מפתח לכל כוח.

${HEBREW_MANDATE}

החזר אך ורק JSON תקין ללא תגיות markdown:
{
  "rivalry": {
    "name": "תחרות בין מתחרים קיימים",
    "analysis": "ניתוח קצר מהפרספקטיבה של עסק המשתמש",
    "score": 6,
    "keyFactors": ["גורם 1", "גורם 2"]
  },
  "newEntrants": {
    "name": "איום של נכנסים חדשים",
    "analysis": "ניתוח קצר",
    "score": 7,
    "keyFactors": ["גורם 1", "גורם 2"]
  },
  "supplierPower": {
    "name": "כוח המיקוח של ספקים",
    "analysis": "ניתוח קצר",
    "score": 6,
    "keyFactors": ["גורם 1", "גורם 2"]
  },
  "buyerPower": {
    "name": "כוח המיקוח של קונים",
    "analysis": "ניתוח קצר",
    "score": 5,
    "keyFactors": ["גורם 1", "גורם 2"]
  },
  "substitutes": {
    "name": "איום של תחליפים",
    "analysis": "ניתוח קצר",
    "score": 6,
    "keyFactors": ["גורם 1", "גורם 2"]
  },
  "overallAttractivenessScore": 6,
  "strategicImplication": "פסקה אחת — מה המשמעות האסטרטגית לעסק המשתמש"
}
`.trim();

// ─── Step 7: יצירת תוכן שיווקי אסטרטגי ────────────────────────────────────────

export const STEP7_SYSTEM = `
אתה Copywriter ומומחה שיווק בכיר עם ניסיון של 15 שנה.
תפקידך: לייצר 3 נכסי שיווק מוכנים לשימוש מיידי — קצרים, עוצמתיים, מוכווני תוצאות.
הכתיבה: ישירה, לא buzzwords, מדברת לכאב הלקוח, תוקפת את חולשות המתחרים.

${HEBREW_MANDATE}

החזר אך ורק JSON תקין ללא תגיות markdown:
{
  "adCopy": {
    "headline": "כותרת הפרסומת — מושכת, מפתיעה, עד 30 תווים",
    "subheadline": "תת-כותרת — מחדדת את ההצעה, עד 60 תווים",
    "bodyText": "גוף הפרסומת — 2-3 משפטים שמדברים לכאב הלקוח ולחולשת המתחרה",
    "callToAction": "כפתור — ברור ודחוף, עד 20 תווים",
    "platform": "google"
  },
  "socialPosts": [
    {
      "concept": "הזווית הויראלית — מה הופך את הפוסט הזה לשונה",
      "hook": "שורת הפתיחה — חייבת לעצור גלילה, עד 60 תווים",
      "content": "סקריפט הפוסט/ריל — 3-5 משפטים, ישיר ומעורר פעולה",
      "platform": "instagram",
      "format": "reel"
    },
    {
      "concept": "...",
      "hook": "...",
      "content": "...",
      "platform": "tiktok",
      "format": "reel"
    },
    {
      "concept": "...",
      "hook": "...",
      "content": "...",
      "platform": "facebook",
      "format": "post"
    }
  ],
  "landingPageHeadline": {
    "main": "כותרת ראשית עוצמתית לאתר — עד 60 תווים",
    "sub": "תת-כותרת שמבהירה ומשכנעת — עד 100 תווים",
    "cta": "קריאה לפעולה — עד 25 תווים"
  },
  "strategicAngle": "משפט אחד — הזווית התחרותית המרכזית שהעסק צריך לאמץ בכל תקשורת שיווקית"
}
`.trim();

export function step7UserPrompt(
  userUrl: string,
  step1Data: string,
  step6Data: string,
): string {
  return `
אתר העסק של המשתמש: **${userUrl}**

--- ניתוח העסק מול השוק (שלב 1) ---
${step1Data}

--- ניתוח פערים שיווקי (שלב 6) ---
${step6Data}

בהתבסס על הניתוח השוואתי ופערי השוק — צור 3 נכסי שיווק מוכנים לשימוש:

1. **פרסומת Google/Meta**: תוקפת את חולשת המתחרים הגדולה ביותר שזוהתה.
   - המשתמש מרוויח כשהמתחרה כושל — הפוך זאת לכותרת.

2. **3 פוסטים/ריילז ויראליים**: כל אחד מזווית אחרת, כל אחד מפלטפורמה אחרת.
   - פוסט 1: תקוף נקודת חולשה ספציפית של מתחרה
   - פוסט 2: הצג "לפני ואחרי" (חוויה עם המתחרה vs. עם המשתמש)
   - פוסט 3: תוכן חינוכי שמציב את המשתמש כמומחה

3. **כותרת לדף הנחיתה**: שתגרום לגולש לומר "זה בדיוק מה שחיפשתי".

כל הכתיבה בעברית. קצר, חד, מוכן לשימוש מיידי.
  `.trim();
}

// ─── Step 6 (parallel A): channel gap analysis only ──────────────────────────

export const STEP6_CHANNELS_SYSTEM = `
אתה מומחה שיווק דיגיטלי. נתח את הנוכחות השיווקית של עסק המשתמש מול מתחריו בערוצים הדיגיטליים.
לכל ערוץ קבע: userPresence ו-competitorPresence ("strong"/"moderate"/"weak"/"none"), gapLevel ("high"/"medium"/"low"), insight קצר.

${HEBREW_MANDATE}

החזר JSON בלבד ללא markdown:
{
  "channelGaps": [
    { "channel": "Google Ads", "userPresence": "none", "competitorPresence": "strong", "gapLevel": "high", "insight": "תיאור קצר" },
    { "channel": "SEO אורגני", "userPresence": "moderate", "competitorPresence": "strong", "gapLevel": "medium", "insight": "תיאור קצר" },
    { "channel": "Instagram", "userPresence": "weak", "competitorPresence": "strong", "gapLevel": "high", "insight": "תיאור קצר" },
    { "channel": "TikTok", "userPresence": "none", "competitorPresence": "weak", "gapLevel": "medium", "insight": "תיאור קצר" },
    { "channel": "Email/ניוזלטר", "userPresence": "none", "competitorPresence": "moderate", "gapLevel": "high", "insight": "תיאור קצר" },
    { "channel": "Lead Magnets", "userPresence": "none", "competitorPresence": "strong", "gapLevel": "high", "insight": "תיאור קצר" }
  ]
}
`.trim();

export function step6ChannelsPrompt(userUrl: string, step1Data: string): string {
  return `
אתר העסק של המשתמש: **${userUrl}**

--- ניתוח העסק מול השוק (שלב 1) ---
${step1Data}

בחן את הערוצים: Google Ads, SEO אורגני, Instagram, TikTok, Facebook Ads, LinkedIn, YouTube, Email/ניוזלטר, Lead Magnets, בלוג/תוכן.
לכל ערוץ — קבע רמת נוכחות של המשתמש מול המתחרים ורמת פער. כל הפלט בעברית.
  `.trim();
}

// ─── Step 6 (parallel B): strategic insights only ────────────────────────────

export const STEP6_INSIGHTS_SYSTEM = `
אתה מומחה אסטרטגיית שיווק. על בסיס ניתוח תחרותי — זהה הזדמנויות מיידיות (Low Hanging Fruit),
הפער הגדול ביותר, וההזדמנות המשמעותית ביותר. הצע 3 פעולות מיידיות קצרות.

${HEBREW_MANDATE}

החזר JSON בלבד ללא markdown:
{
  "lowHangingFruits": [
    { "action": "פעולה ספציפית", "channel": "ערוץ", "effort": "low", "impact": "high", "reason": "סיבה קצרה" },
    { "action": "פעולה ספציפית", "channel": "ערוץ", "effort": "medium", "impact": "high", "reason": "סיבה קצרה" },
    { "action": "פעולה ספציפית", "channel": "ערוץ", "effort": "low", "impact": "medium", "reason": "סיבה קצרה" }
  ],
  "biggestGap": "משפט אחד — הפער הגדול ביותר",
  "biggestOpportunity": "משפט אחד — ההזדמנות הגדולה ביותר שאף מתחרה לא מנצל",
  "overallGapScore": 7
}
`.trim();

export function step6InsightsPrompt(userUrl: string, step1Data: string): string {
  return `
אתר העסק של המשתמש: **${userUrl}**

--- ניתוח העסק מול השוק (שלב 1) ---
${step1Data}

בהתבסס על נתוני ה-distributionChannels, marketingHooks, contentAngles של המתחרים לעומת המשתמש —
הצע 3 פעולות מיידיות (Low Hanging Fruit), זהה את הפער הגדול ביותר ואת ההזדמנות הגדולה ביותר.
ציון overallGapScore: 10 = פער ענק, 1 = פער קטן. כל הפלט בעברית.
  `.trim();
}

// ─── Step 7 (parallel A): ad copy + landing page + strategic angle ───────────

export const STEP7_ASSETS_SYSTEM = `
אתה Copywriter ומומחה שיווק בכיר. צור פרסומת ממירה + כותרת לדף נחיתה + זווית תחרותית.
קצר, חד, מוכן לשימוש מיידי. מדבר ישירות לכאב הלקוח ותוקף את חולשות המתחרים.

${HEBREW_MANDATE}

החזר JSON בלבד ללא markdown:
{
  "adCopy": {
    "headline": "כותרת עד 30 תווים",
    "subheadline": "תת-כותרת עד 60 תווים",
    "bodyText": "2-3 משפטים שמדברים לכאב הלקוח",
    "callToAction": "כפתור עד 20 תווים",
    "platform": "google"
  },
  "landingPageHeadline": {
    "main": "כותרת ראשית עד 60 תווים",
    "sub": "תת-כותרת עד 100 תווים",
    "cta": "קריאה לפעולה עד 25 תווים"
  },
  "strategicAngle": "משפט אחד — הזווית התחרותית המרכזית"
}
`.trim();

export function step7AssetsPrompt(userUrl: string, step1Data: string, step6Summary: string): string {
  return `
אתר העסק של המשתמש: **${userUrl}**

--- ניתוח העסק מול השוק (שלב 1) ---
${step1Data}

--- פערים שיווקיים (שלב 6) ---
${step6Summary}

צור פרסומת Google, כותרת דף נחיתה, וזווית תחרותית מרכזית.
תוקף את החולשה הגדולה ביותר של המתחרים. כל הפלט בעברית.
  `.trim();
}

// ─── Step 7 (parallel B/C/D): single social post per platform ────────────────

export const STEP7_SOCIAL_SYSTEM = `
אתה Copywriter מומחה לרשתות חברתיות. צור פוסט/ריל ויראלי אחד לפלטפורמה ספציפית.
Hook חייב לעצור גלילה. Content — 3-5 משפטים ישירים ומעוררי פעולה.

${HEBREW_MANDATE}

החזר JSON בלבד ללא markdown:
{
  "concept": "הזווית הויראלית — מה הופך פוסט זה לשונה",
  "hook": "שורת פתיחה עד 60 תווים",
  "content": "סקריפט 3-5 משפטים",
  "platform": "instagram",
  "format": "reel"
}
`.trim();

export function step7SocialPrompt(
  platform: string,
  format: string,
  angle: string,
  userUrl: string,
  step1Data: string,
): string {
  return `
אתר העסק של המשתמש: **${userUrl}**
פלטפורמה: **${platform}** | פורמט: **${format}**
זווית תוכן: **${angle}**

--- ניתוח העסק מול השוק (שלב 1) ---
${step1Data}

צור פוסט/ריל ויראלי אחד ל-${platform} (${format}) מהזווית: "${angle}".
כל הפלט בעברית. החזר JSON בלבד.
  `.trim();
}

// ─── Step 6: ניתוח פערים שיווקי — Marketing Intelligence & Gap Analysis ────────
// (kept as single-call fallback reference; pipeline now uses parallel A+B above)

export const STEP6_SYSTEM = `
אתה מומחה שיווק דיגיטלי ואסטרטגיית תוכן. תפקידך לנתח את **הפערים השיווקיים**
בין עסק המשתמש לבין מתחריו — ולהמליץ על פעולות מיידיות וממוקדות.

נתח את הערוצים הבאים לכל צד (עסק המשתמש + מתחרים):
Google Ads (PPC), SEO אורגני, Instagram, TikTok, Facebook Ads, LinkedIn, YouTube,
Email/ניוזלטר, Lead Magnets (מגנטי לידים), WhatsApp, בלוג/תוכן.

לכל ערוץ — קבע רמת נוכחות: "strong" / "moderate" / "weak" / "none".
רמת פער (gapLevel): "high" = הזדמנות ענקית, "medium" = פוטנציאל, "low" = מינימלי.

${HEBREW_MANDATE}

החזר אך ורק JSON תקין ללא תגיות markdown:
{
  "channelGaps": [
    {
      "channel": "Google Ads",
      "userPresence": "none",
      "competitorPresence": "strong",
      "gapLevel": "high",
      "insight": "המתחרים מוציאים תקציב משמעותי על גוגל אדס — אתה כמעט נעדר"
    },
    {
      "channel": "SEO אורגני",
      "userPresence": "moderate",
      "competitorPresence": "strong",
      "gapLevel": "medium",
      "insight": "יש לך בסיס SEO, אך המתחרים מובילים בתוצאות חיפוש"
    }
  ],
  "lowHangingFruits": [
    {
      "action": "הפעל קמפיין Google Ads ממוקד על מילות מפתח של הנישה",
      "channel": "Google Ads",
      "effort": "low",
      "impact": "high",
      "reason": "המתחרים הוכיחו שיש ביקוש — אתה מפספס לידים מוכנים לרכישה"
    },
    {
      "action": "פתח חשבון TikTok עסקי ופרסם 3 סרטונים שבועיים",
      "channel": "TikTok",
      "effort": "medium",
      "impact": "high",
      "reason": "שום מתחרה לא פעיל שם — הזדמנות לכבוש קהל צעיר ראשון"
    },
    {
      "action": "צור Lead Magnet (מדריך חינמי / מחשבון / רשימת תיוג) באתר",
      "channel": "Lead Magnets",
      "effort": "medium",
      "impact": "high",
      "reason": "המתחרים מייצרים לידים בטפסים — אתה מאבד מבקרים ללא לכידה"
    }
  ],
  "biggestGap": "משפט אחד — הפער הגדול ביותר בין עסק המשתמש למתחרים בתחום השיווק",
  "biggestOpportunity": "משפט אחד — ההזדמנות השיווקית הגדולה ביותר שאף מתחרה לא מנצל",
  "overallGapScore": 8
}
`.trim();

export function step6UserPrompt(userUrl: string, step1Data: string): string {
  return `
אתר העסק של המשתמש: **${userUrl}**

--- ניתוח העסק מול השוק (שלב 1 — כולל פרופיל המשתמש ופרופילי המתחרים) ---
${step1Data}

משימתך — ניתוח שיווקי השוואתי:
1. **בחן את האתר של המשתמש**: האם יש פיקסלים של פרסום (Google Tag Manager, Meta Pixel)?
   האם יש טפסי לידים? ניוזלטר? בלוג עם תוכן? קישורים לרשתות חברתיות? קופונים? צ'אט חי?
2. **נתח את המתחרים**: בהתבסס על "distributionChannels", "marketingHooks", "contentAngles"
   מהשלב 1 — באילו ערוצים שיווקיים המתחרים חזקים?
3. **זהה פערים**: היכן המתחרים מנצחים שיווקית, אבל המשתמש נעדר או חלש?
4. **הצע 3 פעולות מיידיות** (Low Hanging Fruit) שהמשתמש יכול לבצע בשבועות הקרובים

כתוב את ה-insight של כל ערוץ בעברית — בהיר, ישיר, ממוקד.
כל הפלט בעברית בלבד.
  `.trim();
}

export function step5UserPrompt(
  userUrl: string,
  step1Data: string,
  step2Data: string,
  step3Data: string,
): string {
  return `
אתר העסק של המשתמש: **${userUrl}**

--- ניתוח העסק מול השוק (שלב 1) ---
${step1Data}

--- הזדמנויות שוק (שלב 2) ---
${step2Data}

--- ניתוח סיכונים (שלב 3) ---
${step3Data}

נתח את חמשת הכוחות של פורטר **מהפרספקטיבה של עסק המשתמש**:
1. **תחרות** — עד כמה חזקים המתחרים שזוהו? האם יש בידול?
2. **נכנסים חדשים** — כמה קל לשחקן חדש להתחרות בעסק?
3. **ספקים** — כמה תלוי העסק בספקים חיצוניים?
4. **קונים** — עד כמה הלקוחות יכולים ללחוץ על מחיר?
5. **תחליפים** — מה הסיכון שלקוחות יעברו לפתרון אחר?

לכל כוח: ניתוח 2-3 משפטים + ציון 1-10 (10 = אטרקטיבי לעסק).
כל הפלט בעברית בלבד.
  `.trim();
}
