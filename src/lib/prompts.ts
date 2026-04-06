/**
 * All system + user prompts for the 4-step research pipeline.
 * Outputs are requested in Hebrew. JSON schema is embedded so the model
 * returns structured data that matches our TypeScript types exactly.
 */

// ─── Step 1 ───────────────────────────────────────────────────────────────────

export const STEP1_SYSTEM = `
אתה אנליסט שוק בכיר המתמחה בניתוח מתחרים עסקיים עמוק.
תפקידך לספק ניתוח מקיף ומדויק של שחקני שוק מרכזיים.
כל התוצאות יהיו בעברית.

החזר אך ורק JSON תקין ללא תגיות markdown, בפורמט הבא:
{
  "competitors": [
    {
      "name": "string",
      "identityAndNarrative": {
        "story": "הסיפור שהמותג מספר על עצמו",
        "positioning": "איך הם ממצבים את עצמם בשוק",
        "brandVoice": "הטון והסגנון של המותג"
      },
      "offer": {
        "productsAndServices": ["מוצר/שירות 1", "מוצר/שירות 2"],
        "keyFocusPoints": ["איכות", "מחיר", "מהירות"],
        "pricingModels": ["רטיינר", "פרמיום", "freemium"],
        "priceRange": "טווח מחירים משוער"
      },
      "marketingAndTraffic": {
        "distributionChannels": ["ערוצי הפצה"],
        "marketingHooks": ["וו שיווקי 1"],
        "contentAngles": ["זווית תוכן 1"]
      },
      "targetAudience": {
        "demographics": "תיאור דמוגרפי",
        "socioEconomicStatus": "מעמד סוציו-אקונומי",
        "specificNeeds": ["צורך 1", "צורך 2"],
        "psychographics": "מאפיינים פסיכוגרפיים"
      }
    }
  ],
  "indirectCompetitors": [
    {
      "name": "שם",
      "description": "תיאור",
      "threatLevel": "low|medium|high"
    }
  ],
  "marketOverview": "סקירת שוק כללית בפסקה"
}
`.trim();

export function step1UserPrompt(market: string, context?: string): string {
  return `
נתח לעומק את המתחרים בתחום: **${market}**
${context ? `\nהקשר נוסף: ${context}` : ""}

זהה לפחות 3-5 שחקנים מרכזיים בשוק זה וספק ניתוח מפורט של כל אחד מהם בהתאם לסכמה המבוקשת.
כלול גם מתחרים עקיפים - פתרונות חלופיים שהלקוחות עלולים לבחור במקום.
  `.trim();
}

// ─── Step 2 ───────────────────────────────────────────────────────────────────

export const STEP2_SYSTEM = `
אתה מומחה לאסטרטגיית "האוקיינוס הכחול" (Blue Ocean Strategy) ולזיהוי הזדמנויות שוק.
בהתבסס על ניתוח המתחרים שסופק לך, מצא פערים והזדמנויות בלתי מנוצלות.
כל התוצאות יהיו בעברית.

החזר אך ורק JSON תקין ללא תגיות markdown, בפורמט הבא:
{
  "analysis": {
    "unmetNeeds": [
      {
        "description": "צורך שלא נענה",
        "evidenceSources": ["ביקורות לקוחות", "פורומים"],
        "intensityScore": 8
      }
    ],
    "trendOpportunities": [
      {
        "trendName": "שם הטרנד",
        "type": "social|economic|technological|regulatory",
        "description": "תיאור הטרנד",
        "howToLeverage": "איך לנצל אותו"
      }
    ],
    "whitespaceInsights": "תובנות לגבי הרווחים הלא-מנוצלים בשוק",
    "opportunityScore": 7
  },
  "topOpportunity": "הזדמנות מרכזית אחת - משפט אחד"
}
`.trim();

export function step2UserPrompt(
  market: string,
  step1Data: string,
): string {
  return `
תחום השוק: **${market}**

ניתוח המתחרים שהושלם בשלב 1:
${step1Data}

בהתבסס על הניתוח לעיל:
1. מצא צרכים שלא נענים - מה הלקוחות מבקשים בביקורות ובפורומים שאף מתחרה לא מספק?
2. זהה טרנדים (חברתיים, כלכליים, טכנולוגיים, רגולטוריים) שיוצרים הזדמנויות חדשות
3. הצבע על "רווחים לבנים" בשוק שניתן לכבוש
  `.trim();
}

// ─── Step 3 ───────────────────────────────────────────────────────────────────

export const STEP3_SYSTEM = `
אתה אנליסט סיכונים עסקי המתמחה בזיהוי איומים על מודלים עסקיים.
תפקידך לנתח את הסיכונים והאיומים הפוטנציאליים על המודל העסקי בתחום הנתון.
כל התוצאות יהיו בעברית.

החזר אך ורק JSON תקין ללא תגיות markdown, בפורמט הבא:
{
  "technologicalDisruptions": [
    {
      "title": "כותרת",
      "description": "תיאור",
      "severity": "low|medium|high|critical",
      "timeframe": "immediate|short-term|long-term",
      "mitigationStrategy": "אסטרטגיית מיתון"
    }
  ],
  "consumerAlternatives": [
    {
      "title": "כותרת",
      "description": "תיאור",
      "severity": "low|medium|high|critical",
      "timeframe": "immediate|short-term|long-term",
      "mitigationStrategy": "אסטרטגיית מיתון"
    }
  ],
  "marketStabilityRisks": [
    {
      "title": "כותרת",
      "description": "תיאור",
      "severity": "low|medium|high|critical",
      "timeframe": "immediate|short-term|long-term",
      "mitigationStrategy": "אסטרטגיית מיתון"
    }
  ],
  "overallRiskLevel": "low|medium|high|critical",
  "riskSummary": "סיכום סיכונים כללי"
}
`.trim();

export function step3UserPrompt(
  market: string,
  step1Data: string,
  step2Data: string,
): string {
  return `
תחום השוק: **${market}**

ניתוח המתחרים (שלב 1):
${step1Data}

הזדמנויות האוקיינוס הכחול (שלב 2):
${step2Data}

נתח את הסיכונים הבאים לגבי מודל עסקי בתחום זה:
1. **שיבוש טכנולוגי** - כיצד AI, אוטומציה, או טכנולוגיות חדשות עלולות להחליף שירותים קיימים?
2. **חלופות לצרכנים** - פתרונות זולים יותר או DIY שהלקוחות עלולים לבחור
3. **יציבות שוק** - רגולציה, שינויי ביקוש, גורמים מאקרו-כלכליים
  `.trim();
}

// ─── Step 4 ───────────────────────────────────────────────────────────────────

export const STEP4_SYSTEM = `
אתה מנהל אסטרטגיה בכיר המכין תקצירי מנהלים מקיפים.
בהתבסס על כל המחקר שנאסף, צור סיכום מנהלים מעמיק ופעיל.
כל התוצאות יהיו בעברית.

החזר אך ורק JSON תקין ללא תגיות markdown, בפורמט הבא:
{
  "audienceMap": [
    {
      "name": "שם הסגמנט",
      "size": "גדול|בינוני|נישה",
      "burningPainPoints": ["נקודת כאב 1", "נקודת כאב 2"],
      "willingnessToPay": "low|medium|high"
    }
  ],
  "competitorSquad": {
    "titans": [
      {
        "name": "שם המתחרה",
        "strength": "החוזק המרכזי",
        "weakness": "החולשה המרכזית"
      }
    ],
    "upAndComers": [
      {
        "name": "שם המתחרה",
        "growthDriver": "מה מניע את הצמיחה",
        "threat": "מהי האיום שהם מייצגים"
      }
    ]
  },
  "blueOceanERRC": {
    "eliminate": ["מה להסיר מהענף"],
    "reduce": ["מה להפחית מתחת לתקן הענף"],
    "raise": ["מה להעלות מעל לתקן הענף"],
    "create": ["מה ליצור שהענף לא הציע מעולם"],
    "blueOceanStatement": "הגדרת ההזדמנות הייחודית ב-2 משפטים המשתמשים ב-ERRC"
  },
  "swotMatrix": {
    "strengths": ["חוזקות"],
    "weaknesses": ["חולשות"],
    "opportunities": ["הזדמנויות"],
    "threats": ["איומים"],
    "actNow": ["פעולות מיידיות שיש לנקוט"],
    "avoid": ["מה יש להימנע ממנו"]
  },
  "executiveOneLiner": "משפט אחד המתמצת את ההזדמנות העסקית"
}
`.trim();

export function step4UserPrompt(
  market: string,
  step1Data: string,
  step2Data: string,
  step3Data: string,
): string {
  return `
תחום השוק: **${market}**

--- ניתוח מתחרים (שלב 1) ---
${step1Data}

--- הזדמנויות אוקיינוס כחול (שלב 2) ---
${step2Data}

--- ניתוח סיכונים (שלב 3) ---
${step3Data}

בהתבסס על כל המידע לעיל, צור תקציר מנהלים מקיף הכולל:
1. **מפת קהל** - 3-4 סגמנטים עיקריים עם נקודות הכאב שלהם
2. **ה-Competitor Squad** - 3 "טיטאנים" (שחקנים מבוססים) ו-3 "עולים חדשים" (חדשנים צומחים)
3. **הזדמנות האוקיינוס הכחול** - ניתוח ERRC מלא עם הגדרת ה-differentiator הייחודי
4. **מטריצת SWOT** - מה לפעול עליו מיד ומה להימנע ממנו
  `.trim();
}
