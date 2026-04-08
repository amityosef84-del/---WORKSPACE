// ─── Step 0: Web Scraping ─────────────────────────────────────────────────────

export interface ScrapedContent {
  url: string;
  title?: string;
  description?: string;
  keywords?: string;
  mainText: string;
  headings: string[];
  scrapedAt: number;
  method: "fetch" | "firecrawl";
  error?: string;
}

// ─── Step 1: Competitor Analysis ─────────────────────────────────────────────

export interface CompetitorProfile {
  name: string;
  identityAndNarrative: {
    story: string;
    positioning: string;
    brandVoice: string;
  };
  offer: {
    productsAndServices: string[];
    keyFocusPoints: string[];
    pricingModels: string[];
    priceRange?: string;
  };
  marketingAndTraffic: {
    distributionChannels: string[];
    marketingHooks: string[];
    contentAngles: string[];
  };
  targetAudience: {
    demographics: string;
    socioEconomicStatus: string;
    specificNeeds: string[];
    psychographics: string;
  };
}

export interface Step1CompetitorAnalysis {
  /** The user's own business, analysed from their website */
  userProfile?: CompetitorProfile;
  /** 3-4 identified industry competitors */
  competitors: CompetitorProfile[];
  indirectCompetitors: {
    name: string;
    description: string;
    threatLevel: "low" | "medium" | "high";
  }[];
  marketOverview: string;
}

// ─── Step 2: Blue Ocean / Opportunity Gap ────────────────────────────────────

export interface BlueOceanOpportunity {
  unmetNeeds: {
    description: string;
    evidenceSources: string[];
    intensityScore: number;
  }[];
  trendOpportunities: {
    trendName: string;
    type: "social" | "economic" | "technological" | "regulatory";
    description: string;
    howToLeverage: string;
  }[];
  whitespaceInsights: string;
  opportunityScore: number;
}

export interface Step2BlueOcean {
  analysis: BlueOceanOpportunity;
  topOpportunity: string;
}

// ─── Step 3: Risk & Threat Analysis ─────────────────────────────────────────

export interface RiskItem {
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  timeframe: "immediate" | "short-term" | "long-term";
  mitigationStrategy: string;
}

export interface Step3RiskAnalysis {
  technologicalDisruptions: RiskItem[];
  consumerAlternatives: RiskItem[];
  marketStabilityRisks: RiskItem[];
  overallRiskLevel: "low" | "medium" | "high" | "critical";
  riskSummary: string;
}

// ─── Step 4: Executive Summary ────────────────────────────────────────────────

export interface AudienceSegment {
  name: string;
  size: string;
  burningPainPoints: string[];
  willingnessToPay: "low" | "medium" | "high";
}

export interface CompetitorSquad {
  titans: { name: string; strength: string; weakness: string }[];
  upAndComers: { name: string; growthDriver: string; threat: string }[];
}

export interface ERRCGrid {
  eliminate: string[];
  reduce: string[];
  raise: string[];
  create: string[];
  blueOceanStatement: string;
}

export interface SWOTOpportunityMatrix {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  actNow: string[];
  avoid: string[];
}

export interface Step4ExecutiveSummary {
  audienceMap: AudienceSegment[];
  competitorSquad: CompetitorSquad;
  blueOceanERRC: ERRCGrid;
  swotMatrix: SWOTOpportunityMatrix;
  executiveOneLiner: string;
}

// ─── Step 5: Porter's Five Forces ────────────────────────────────────────────

export interface PorterForce {
  name: string;
  analysis: string;
  score: number;        // 1-10 attractiveness (10 = very favorable)
  keyFactors: string[];
}

export interface Step5PorterAnalysis {
  rivalry: PorterForce;
  newEntrants: PorterForce;
  supplierPower: PorterForce;
  buyerPower: PorterForce;
  substitutes: PorterForce;
  overallAttractivenessScore: number;
  strategicImplication: string;
}

// ─── Research Mode (Selective Research) ──────────────────────────────────────

export type ResearchMode = "full" | "focused";
export type FocusedCategory = "competitors" | "porters" | "risk";

// ─── Pipeline State ───────────────────────────────────────────────────────────

export type StepStatus = "pending" | "running" | "completed" | "error";

export interface PipelineStep {
  id: 0 | 1 | 2 | 3 | 4 | 5;
  nameEn: string;
  nameHe: string;
  status: StepStatus;
  startedAt?: number;
  completedAt?: number;
  error?: string;
  /** true when completed via timeout/error fallback */
  partial?: boolean;
  /** true when this step was intentionally skipped (focused mode) */
  skipped?: boolean;
}

export interface ResearchReport {
  id: string;
  query: {
    competitorUrl: string;
    additionalDetails?: string;
  };
  mode?: ResearchMode;
  focusedCategory?: FocusedCategory;
  createdAt: number;
  steps: [PipelineStep, PipelineStep, PipelineStep, PipelineStep, PipelineStep, PipelineStep];
  step1?: Step1CompetitorAnalysis;
  step2?: Step2BlueOcean;
  step3?: Step3RiskAnalysis;
  step4?: Step4ExecutiveSummary;
  step5?: Step5PorterAnalysis;
}

// ─── SSE Event Types ──────────────────────────────────────────────────────────

export type SSEEventType =
  | "step_start"
  | "step_complete"
  | "step_error"
  | "scrape_warning"
  | "pipeline_complete"
  | "pipeline_error";

export interface SSEEvent {
  type: SSEEventType;
  stepId?: 0 | 1 | 2 | 3 | 4 | 5;
  data?: Step1CompetitorAnalysis | Step2BlueOcean | Step3RiskAnalysis | Step4ExecutiveSummary | Step5PorterAnalysis;
  error?: string;
  report?: ResearchReport;
  partial?: boolean;
  /** true when step was skipped due to focused mode */
  skipped?: boolean;
}

// ─── API Request/Response ─────────────────────────────────────────────────────

export interface ResearchRequest {
  competitorUrl: string;
  additionalDetails?: string;
  mode?: ResearchMode;
  focusedCategory?: FocusedCategory;
}
