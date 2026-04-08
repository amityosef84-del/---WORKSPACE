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

// ─── Step 4: סיכום מנהלים — "אני מול השוק" ──────────────────────────────────

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

// ─── Step 5: חמשת הכוחות של פורטר — פרספקטיבת המשתמש ────────────────────────

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
