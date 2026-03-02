export const PIPELINE_STAGES = [
  "Cold Signal",
  "Engaged Signal",
  "Math Exposure",
  "Problem Acknowledged",
  "Friction Confirmed",
  "Architecture Proposed",
  "Closed - Installed",
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export type ResponseType =
  | "Positive"
  | "Neutral"
  | "Objection"
  | "Not Now";

export type ReplyClassification =
  | "Interested"
  | "Send Info"
  | "Budget Objection"
  | "Timing Objection"
  | "Referral"
  | "Wrong Person"
  | "Hostile";

export type LedgerEntryType = "Expense" | "Revenue";

export interface Account {
  id: string;
  companyName: string;
  industryVertical: string;
  revenueBand: string;
  employeeCount: number;
  location: string;
  techStack: string[];
  adChannelsUsed: string[];
  bookingSoftware: string;
  crmUsed: string;
  acquisitionModel: "Paid" | "Referral" | "Organic";
  estimatedLtv: number;
  estimatedLeadVolume: number;
  estimatedConversionRate: number;
  estimatedRevenueLeakPercent: number;
  estimatedMonthlyRevenueLeak: number;
  signalScore: number;
  icpFitScore: number;
  ownerPersonaType: string;
  frictionSummary: string;
  beliefStage: PipelineStage;
  verticalMetrics?: Record<string, string | number>;
}

export interface Contact {
  id: string;
  accountId: string;
  name: string;
  title: string;
  linkedIn: string;
  email: string;
  phone: string;
  roleInDecision: string;
  authorityLevel: number;
  influenceLevel: number;
  engagementScore: number;
  sentimentTag: string;
  responseType: ResponseType;
}

export interface CampaignSignal {
  id: string;
  accountId: string;
  contactId: string;
  campaignName: string;
  emailStep: number;
  opened: boolean;
  clicked: boolean;
  replied: boolean;
  replySentiment: string;
  aiClassification: ReplyClassification;
  timeToFirstResponseHours: number | null;
  sentAt: string;
}

export interface DiagnosticData {
  id: string;
  accountId: string;
  calculatorInputs: Record<string, number | string>;
  calculatedLeak: number;
  selfReportedPainLevel: number;
  desiredOutcome: string;
  bookingTimestamp: string | null;
  timeOnPageSeconds: number;
  scrollDepthPercent: number;
}

export interface Deal {
  id: string;
  accountId: string;
  primaryContactId: string;
  name: string;
  stage: PipelineStage;
  arrOpportunity: number;
  estimatedLeak: number;
  painScore: number;
  authorityLevel: number;
  engagementScore: number;
  icpFitScore: number;
  probabilityScore?: number;
  weightedRevenue?: number;
  timeInStageDays: number;
  nextAction: string;
  ownerName: string;
  source: string;
  outboundCost: number;
}

export interface AutomationRule {
  id: string;
  trigger: string;
  action: string;
  status: "Active" | "Draft";
}

export interface VerticalModule {
  id: string;
  vertical: string;
  summary: string;
  metrics: string[];
}

export interface LedgerEntry {
  id: string;
  entryType: LedgerEntryType;
  occurredOn: string;
  ownerName: string;
  description: string;
  notes: string;
  amount: number;
  createdAt?: string;
}

export interface DashboardMetric {
  label: string;
  value: string;
  helper: string;
}

export interface StagePerformance {
  stage: PipelineStage;
  dealCount: number;
  reachedCount: number;
  avgTimeInStageDays: number;
  conversionRate: number;
  revenueLeakage: number;
}

export interface CampaignPerformance {
  campaignName: string;
  emailsSent: number;
  replyRate: number;
  bookedRate: number;
  mrrAdded: number;
  revenuePerThousandEmails: number;
}

export interface CrmSnapshot {
  origin: "mock" | "supabase";
  syncStatus: "connected" | "fallback";
  syncMessage: string;
  accounts: Account[];
  contacts: Contact[];
  campaignSignals: CampaignSignal[];
  diagnostics: DiagnosticData[];
  deals: Deal[];
  automationRules: AutomationRule[];
  verticalModules: VerticalModule[];
  ledgerEntries: LedgerEntry[];
  dashboardMetrics: DashboardMetric[];
  stagePerformance: StagePerformance[];
  campaignPerformance: CampaignPerformance[];
  weightedRevenue: number;
  generatedAt: string;
}

export interface FlashMessage {
  status: "success" | "error";
  message: string;
}
