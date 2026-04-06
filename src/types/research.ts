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
    keyFocusPoints: string[]; // quality, price, speed, etc.
    pricingModels: string[]; // retainer, freemium, one-time, etc.
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
    evidenceSources: string[]; // reviews, forums, etc.
    intensityScore: number; // 1-10
  }[];
  trendOpportunities: {
    trendName: string;
    type: "social" | "economic" | "technological" | "regulatory";
    description: string;
    howToLeverage: string;
  }[];
  whitespaceInsights: string;
  opportunityScore: number; // 1-10, overall market opportunity
}

export interface Step2BlueOcean {
  analysis: BlueOceanOpportunity;
  topOpportunity: string; // one-liner summary
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
  size: string; // e.g. "large", "niche"
  burningPainPoints: string[];
  willingnessToPay: "low" | "medium" | "high";
}

export interface CompetitorSquad {
  titans: {
    name: string;
    strength: string;
    weakness: string;
  }[];
  upAndComers: {
    name: string;
    growthDriver: string;
    threat: string;
  }[];
}

export interface ERRCGrid {
  eliminate: string[];
  reduce: string[];
  raise: string[];
  create: string[];
  blueOceanStatement: string; // 2-sentence synthesis
}

export interface SWOTOpportunityMatrix {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  actNow: string[]; // immediate actions
  avoid: string[]; // things to avoid
}

export interface Step4ExecutiveSummary {
  audienceMap: AudienceSegment[];
  competitorSquad: CompetitorSquad;
  blueOceanERRC: ERRCGrid;
  swotMatrix: SWOTOpportunityMatrix;
  executiveOneLiner: string;
}

// ─── Pipeline State ───────────────────────────────────────────────────────────

export type StepStatus = "pending" | "running" | "completed" | "error";

export interface PipelineStep {
  id: 1 | 2 | 3 | 4;
  nameEn: string;
  nameHe: string;
  status: StepStatus;
  startedAt?: number;
  completedAt?: number;
  error?: string;
}

export interface ResearchReport {
  id: string;
  query: {
    marketOrCompetitor: string;
    additionalContext?: string;
  };
  createdAt: number;
  steps: [PipelineStep, PipelineStep, PipelineStep, PipelineStep];
  step1?: Step1CompetitorAnalysis;
  step2?: Step2BlueOcean;
  step3?: Step3RiskAnalysis;
  step4?: Step4ExecutiveSummary;
}

// ─── SSE Event Types ──────────────────────────────────────────────────────────

export type SSEEventType =
  | "step_start"
  | "step_complete"
  | "step_error"
  | "pipeline_complete"
  | "pipeline_error";

export interface SSEEvent {
  type: SSEEventType;
  stepId?: 1 | 2 | 3 | 4;
  data?: Step1CompetitorAnalysis | Step2BlueOcean | Step3RiskAnalysis | Step4ExecutiveSummary;
  error?: string;
  report?: ResearchReport;
}

// ─── API Request/Response ─────────────────────────────────────────────────────

export interface ResearchRequest {
  marketOrCompetitor: string;
  additionalContext?: string;
}
