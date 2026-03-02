import {
  Account,
  AutomationRule,
  CampaignPerformance,
  CampaignSignal,
  Contact,
  CrmSnapshot,
  DashboardMetric,
  Deal,
  DiagnosticData,
  LedgerEntry,
  PIPELINE_STAGES,
  StagePerformance,
  VerticalModule,
} from "@/lib/types";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function calculateProbabilityScore(deal: Deal) {
  const rawScore =
    deal.icpFitScore *
    (deal.engagementScore / 100) *
    (deal.painScore / 100) *
    (deal.authorityLevel / 5);

  return clamp(Math.round(rawScore), 0, 100);
}

export function enrichDeals(deals: Deal[]) {
  return deals.map((deal) => {
    const probabilityScore = calculateProbabilityScore(deal);

    return {
      ...deal,
      probabilityScore,
      weightedRevenue: Math.round((deal.arrOpportunity * probabilityScore) / 100),
    };
  });
}

export function buildCrmSnapshot(input: {
  origin: "mock" | "supabase";
  accounts: Account[];
  contacts: Contact[];
  campaignSignals: CampaignSignal[];
  diagnostics: DiagnosticData[];
  deals: Deal[];
  automationRules: AutomationRule[];
  verticalModules: VerticalModule[];
  ledgerEntries?: LedgerEntry[];
}): CrmSnapshot {
  const deals = enrichDeals(input.deals);
  const emailsSent = input.campaignSignals.length;
  const repliedCount = input.campaignSignals.filter((signal) => signal.replied).length;
  const positiveReplies = input.campaignSignals.filter(
    (signal) =>
      signal.aiClassification === "Interested" ||
      signal.aiClassification === "Send Info",
  ).length;
  const engagedSignals = input.campaignSignals.filter(
    (signal) => signal.clicked || signal.replied,
  ).length;
  const diagnosticCount = input.diagnostics.length;
  const bookedCalls = deals.filter((deal) =>
    PIPELINE_STAGES.indexOf(deal.stage) >= PIPELINE_STAGES.indexOf("Problem Acknowledged"),
  ).length;
  const closedDeals = deals.filter((deal) => deal.stage === "Closed - Installed");
  const weightedRevenue = deals.reduce(
    (sum, deal) => sum + (deal.weightedRevenue ?? 0),
    0,
  );
  const monthlyRecurringRevenue = closedDeals.reduce(
    (sum, deal) => sum + deal.arrOpportunity / 12,
    0,
  );
  const averageLeak = input.diagnostics.length
    ? input.diagnostics.reduce((sum, item) => sum + item.calculatedLeak, 0) /
      input.diagnostics.length
    : 0;
  const outboundCost = deals.reduce((sum, deal) => sum + deal.outboundCost, 0);
  const replyRate = emailsSent ? (repliedCount / emailsSent) * 100 : 0;
  const positiveReplyRate = emailsSent ? (positiveReplies / emailsSent) * 100 : 0;
  const diagnosticCompletionRate = engagedSignals
    ? (diagnosticCount / engagedSignals) * 100
    : 0;
  const bookedRate = engagedSignals ? (bookedCalls / engagedSignals) * 100 : 0;
  const closeRate = deals.length ? (closedDeals.length / deals.length) * 100 : 0;
  const costPerBookedCall = bookedCalls ? outboundCost / bookedCalls : 0;
  const revenuePerThousandEmails = emailsSent
    ? (monthlyRecurringRevenue / emailsSent) * 1000
    : 0;
  const averageTimeToClose = closedDeals.length
    ? closedDeals.reduce((sum, deal) => sum + deal.timeInStageDays, 0) / closedDeals.length
    : 0;

  const dashboardMetrics: DashboardMetric[] = [
    {
      label: "Emails Sent / Day",
      value: `${Math.round(emailsSent / 7)}`,
      helper: "Rolling 7-day outbound cadence",
    },
    {
      label: "Reply Rate",
      value: formatPercent(replyRate),
      helper: `${positiveReplies} high-signal replies`,
    },
    {
      label: "Positive Reply Rate",
      value: formatPercent(positiveReplyRate),
      helper: "Interested + send info",
    },
    {
      label: "Diagnostic Completion",
      value: formatPercent(diagnosticCompletionRate),
      helper: `${diagnosticCount} calculators completed`,
    },
    {
      label: "Booked Rate",
      value: formatPercent(bookedRate),
      helper: `${bookedCalls} deals reached booked-call stage`,
    },
    {
      label: "Close Rate",
      value: formatPercent(closeRate),
      helper: `${closedDeals.length} closed-installed accounts`,
    },
    {
      label: "Cost / Booked Call",
      value: formatCurrency(costPerBookedCall),
      helper: "Blended outbound spend model",
    },
    {
      label: "MRR Added",
      value: formatCurrency(monthlyRecurringRevenue),
      helper: "Closed-installed monthly recurring value",
    },
    {
      label: "Time to Close",
      value: `${averageTimeToClose.toFixed(1)} days`,
      helper: "Average for won deals",
    },
    {
      label: "Average Leak Identified",
      value: formatCurrency(averageLeak),
      helper: "Mean revenue leak from diagnostics",
    },
    {
      label: "Revenue / 1,000 Emails",
      value: formatCurrency(revenuePerThousandEmails),
      helper: "Primary outbound control lever",
    },
    {
      label: "Weighted Pipeline",
      value: formatCurrency(weightedRevenue),
      helper: "Probability-adjusted revenue forecast",
    },
  ];

  const stagePerformance: StagePerformance[] = PIPELINE_STAGES.map((stage, index) => {
    const currentStageDeals = deals.filter((deal) => deal.stage === stage);
    const reachedCount = deals.filter(
      (deal) => PIPELINE_STAGES.indexOf(deal.stage) >= index,
    ).length;
    const nextReachedCount =
      index === PIPELINE_STAGES.length - 1
        ? reachedCount
        : deals.filter(
            (deal) => PIPELINE_STAGES.indexOf(deal.stage) >= index + 1,
          ).length;
    const avgTimeInStageDays = currentStageDeals.length
      ? currentStageDeals.reduce((sum, deal) => sum + deal.timeInStageDays, 0) /
        currentStageDeals.length
      : 0;
    const revenueLeakage = deals
      .filter((deal) => PIPELINE_STAGES.indexOf(deal.stage) >= index)
      .reduce((sum, deal) => sum + deal.estimatedLeak, 0);

    return {
      stage,
      dealCount: currentStageDeals.length,
      reachedCount,
      avgTimeInStageDays,
      conversionRate: reachedCount ? (nextReachedCount / reachedCount) * 100 : 0,
      revenueLeakage,
    };
  });

  const campaignPerformance = Object.values(
    input.campaignSignals.reduce<Record<string, CampaignPerformance>>((acc, signal) => {
      const existing = acc[signal.campaignName] ?? {
        campaignName: signal.campaignName,
        emailsSent: 0,
        replyRate: 0,
        bookedRate: 0,
        mrrAdded: 0,
        revenuePerThousandEmails: 0,
      };

      existing.emailsSent += 1;
      existing.replyRate += signal.replied ? 1 : 0;
      acc[signal.campaignName] = existing;

      return acc;
    }, {}),
  )
    .map((campaign) => {
      const dealMatches = deals.filter((deal) => deal.source === campaign.campaignName);
      const bookedFromCampaign = dealMatches.filter(
        (deal) =>
          PIPELINE_STAGES.indexOf(deal.stage) >=
          PIPELINE_STAGES.indexOf("Problem Acknowledged"),
      ).length;
      const closedFromCampaign = dealMatches.filter(
        (deal) => deal.stage === "Closed - Installed",
      );
      const mrrAdded = closedFromCampaign.reduce(
        (sum, deal) => sum + deal.arrOpportunity / 12,
        0,
      );
      const replyRateValue = campaign.emailsSent
        ? (campaign.replyRate / campaign.emailsSent) * 100
        : 0;
      const bookedRateValue = campaign.emailsSent
        ? (bookedFromCampaign / campaign.emailsSent) * 100
        : 0;

      return {
        ...campaign,
        replyRate: replyRateValue,
        bookedRate: bookedRateValue,
        mrrAdded,
        revenuePerThousandEmails: campaign.emailsSent
          ? (mrrAdded / campaign.emailsSent) * 1000
          : 0,
      };
    })
    .sort((a, b) => b.revenuePerThousandEmails - a.revenuePerThousandEmails);

  return {
    ...input,
    syncStatus: input.origin === "supabase" ? "connected" : "fallback",
    syncMessage:
      input.origin === "supabase"
        ? "Live Supabase reads succeeded."
        : "Using bundled seeded data because no live Supabase connection is active.",
    deals,
    ledgerEntries: input.ledgerEntries ?? [],
    dashboardMetrics,
    stagePerformance,
    campaignPerformance,
    weightedRevenue,
    generatedAt: new Date().toISOString(),
  };
}

const accounts: Account[] = [
  {
    id: "acct_1",
    companyName: "Luma Med Spa",
    industryVertical: "Med Spa",
    revenueBand: "$1M-$3M",
    employeeCount: 18,
    location: "Scottsdale, AZ",
    techStack: ["Meta Ads", "Zapier", "HubSpot"],
    adChannelsUsed: ["Meta", "Google Search"],
    bookingSoftware: "Mindbody",
    crmUsed: "HubSpot",
    acquisitionModel: "Paid",
    estimatedLtv: 3600,
    estimatedLeadVolume: 420,
    estimatedConversionRate: 18,
    estimatedRevenueLeakPercent: 11,
    estimatedMonthlyRevenueLeak: 28400,
    signalScore: 92,
    icpFitScore: 95,
    ownerPersonaType: "Visionary Operator",
    frictionSummary: "Lead handoff lag and no-show leakage after consult booking.",
    beliefStage: "Friction Confirmed",
    verticalMetrics: {
      "No-show rate": "16%",
      "Rebooking %": "41%",
      "Avg procedure value": "$410",
      "LTV per treatment": "$1,920",
    },
  },
  {
    id: "acct_2",
    companyName: "Harbor PI Group",
    industryVertical: "PI Law",
    revenueBand: "$5M-$10M",
    employeeCount: 42,
    location: "Tampa, FL",
    techStack: ["CallRail", "Clio", "Zapier"],
    adChannelsUsed: ["Google Search", "LSA"],
    bookingSoftware: "Calendly",
    crmUsed: "Clio Grow",
    acquisitionModel: "Paid",
    estimatedLtv: 14500,
    estimatedLeadVolume: 310,
    estimatedConversionRate: 26,
    estimatedRevenueLeakPercent: 9,
    estimatedMonthlyRevenueLeak: 63300,
    signalScore: 84,
    icpFitScore: 88,
    ownerPersonaType: "Rainmaker Managing Partner",
    frictionSummary: "Case intake is slow and signed-rate drops after first follow-up.",
    beliefStage: "Architecture Proposed",
    verticalMetrics: {
      "Intake speed": "19 min",
      "Case acceptance rate": "34%",
      "Avg case value": "$28,000",
      "Signed rate": "22%",
    },
  },
  {
    id: "acct_3",
    companyName: "Northline Portfolio Ops",
    industryVertical: "Private Equity",
    revenueBand: "$25M+",
    employeeCount: 65,
    location: "New York, NY",
    techStack: ["Salesforce", "Snowflake", "Looker"],
    adChannelsUsed: ["Referral"],
    bookingSoftware: "None",
    crmUsed: "Salesforce",
    acquisitionModel: "Referral",
    estimatedLtv: 88000,
    estimatedLeadVolume: 45,
    estimatedConversionRate: 14,
    estimatedRevenueLeakPercent: 7,
    estimatedMonthlyRevenueLeak: 91500,
    signalScore: 76,
    icpFitScore: 82,
    ownerPersonaType: "Portfolio Value Architect",
    frictionSummary: "Inconsistent KPI normalization across portfolio companies.",
    beliefStage: "Math Exposure",
    verticalMetrics: {
      "Portfolio KPI normalization": "61%",
      "Cross-asset benchmarking": "Quarterly",
    },
  },
  {
    id: "acct_4",
    companyName: "Aster Dental Collective",
    industryVertical: "Multi-Location Dental",
    revenueBand: "$3M-$5M",
    employeeCount: 27,
    location: "Austin, TX",
    techStack: ["GoHighLevel", "Google Ads", "Make"],
    adChannelsUsed: ["Google Search", "Referral"],
    bookingSoftware: "NexHealth",
    crmUsed: "GoHighLevel",
    acquisitionModel: "Organic",
    estimatedLtv: 5200,
    estimatedLeadVolume: 280,
    estimatedConversionRate: 22,
    estimatedRevenueLeakPercent: 12,
    estimatedMonthlyRevenueLeak: 21900,
    signalScore: 68,
    icpFitScore: 73,
    ownerPersonaType: "Growth Operator",
    frictionSummary: "Manual reminders create booking drag and delayed reactivation.",
    beliefStage: "Engaged Signal",
  },
];

const contacts: Contact[] = [
  {
    id: "ct_1",
    accountId: "acct_1",
    name: "Ariana Moss",
    title: "Founder",
    linkedIn: "https://www.linkedin.com/in/ariana-moss",
    email: "ariana@lumamedspa.com",
    phone: "(480) 555-0112",
    roleInDecision: "Economic buyer",
    authorityLevel: 5,
    influenceLevel: 5,
    engagementScore: 90,
    sentimentTag: "Urgent",
    responseType: "Positive",
  },
  {
    id: "ct_2",
    accountId: "acct_2",
    name: "Marcus Hale",
    title: "Managing Partner",
    linkedIn: "https://www.linkedin.com/in/marcus-hale",
    email: "marcus@harborpi.com",
    phone: "(813) 555-0188",
    roleInDecision: "Final approver",
    authorityLevel: 5,
    influenceLevel: 4,
    engagementScore: 82,
    sentimentTag: "Analytical",
    responseType: "Positive",
  },
  {
    id: "ct_3",
    accountId: "acct_3",
    name: "Jillian Sato",
    title: "Operating Partner",
    linkedIn: "https://www.linkedin.com/in/jillian-sato",
    email: "jillian@northlinepe.com",
    phone: "(212) 555-0170",
    roleInDecision: "Champion",
    authorityLevel: 4,
    influenceLevel: 5,
    engagementScore: 66,
    sentimentTag: "Curious",
    responseType: "Neutral",
  },
  {
    id: "ct_4",
    accountId: "acct_4",
    name: "Noah Ellis",
    title: "COO",
    linkedIn: "https://www.linkedin.com/in/noah-ellis",
    email: "noah@asterdental.com",
    phone: "(512) 555-0119",
    roleInDecision: "Operational evaluator",
    authorityLevel: 4,
    influenceLevel: 4,
    engagementScore: 58,
    sentimentTag: "Interested",
    responseType: "Not Now",
  },
];

const campaignSignals: CampaignSignal[] = [
  {
    id: "sig_1",
    accountId: "acct_1",
    contactId: "ct_1",
    campaignName: "Leak Audit Sprint",
    emailStep: 1,
    opened: true,
    clicked: true,
    replied: true,
    replySentiment: "Positive",
    aiClassification: "Interested",
    timeToFirstResponseHours: 4,
    sentAt: "2026-02-23T13:00:00.000Z",
  },
  {
    id: "sig_2",
    accountId: "acct_1",
    contactId: "ct_1",
    campaignName: "Leak Audit Sprint",
    emailStep: 2,
    opened: true,
    clicked: true,
    replied: false,
    replySentiment: "Neutral",
    aiClassification: "Send Info",
    timeToFirstResponseHours: null,
    sentAt: "2026-02-24T13:00:00.000Z",
  },
  {
    id: "sig_3",
    accountId: "acct_2",
    contactId: "ct_2",
    campaignName: "Case Velocity Diagnostic",
    emailStep: 1,
    opened: true,
    clicked: false,
    replied: true,
    replySentiment: "Positive",
    aiClassification: "Interested",
    timeToFirstResponseHours: 7,
    sentAt: "2026-02-20T15:00:00.000Z",
  },
  {
    id: "sig_4",
    accountId: "acct_2",
    contactId: "ct_2",
    campaignName: "Case Velocity Diagnostic",
    emailStep: 3,
    opened: true,
    clicked: true,
    replied: false,
    replySentiment: "Neutral",
    aiClassification: "Send Info",
    timeToFirstResponseHours: null,
    sentAt: "2026-02-22T15:00:00.000Z",
  },
  {
    id: "sig_5",
    accountId: "acct_3",
    contactId: "ct_3",
    campaignName: "Portfolio Benchmark Trigger",
    emailStep: 1,
    opened: true,
    clicked: true,
    replied: false,
    replySentiment: "Neutral",
    aiClassification: "Referral",
    timeToFirstResponseHours: null,
    sentAt: "2026-02-25T17:00:00.000Z",
  },
  {
    id: "sig_6",
    accountId: "acct_4",
    contactId: "ct_4",
    campaignName: "Recall Recovery Sequence",
    emailStep: 4,
    opened: true,
    clicked: false,
    replied: true,
    replySentiment: "Timing",
    aiClassification: "Timing Objection",
    timeToFirstResponseHours: 38,
    sentAt: "2026-02-27T12:00:00.000Z",
  },
  {
    id: "sig_7",
    accountId: "acct_4",
    contactId: "ct_4",
    campaignName: "Recall Recovery Sequence",
    emailStep: 5,
    opened: false,
    clicked: false,
    replied: false,
    replySentiment: "Neutral",
    aiClassification: "Wrong Person",
    timeToFirstResponseHours: null,
    sentAt: "2026-02-28T12:00:00.000Z",
  },
];

const diagnostics: DiagnosticData[] = [
  {
    id: "diag_1",
    accountId: "acct_1",
    calculatorInputs: {
      monthlyLeads: 420,
      conversionRate: 18,
      showRate: 84,
    },
    calculatedLeak: 28400,
    selfReportedPainLevel: 9,
    desiredOutcome: "Reduce no-shows and improve follow-up compliance",
    bookingTimestamp: "2026-02-25T18:30:00.000Z",
    timeOnPageSeconds: 426,
    scrollDepthPercent: 96,
  },
  {
    id: "diag_2",
    accountId: "acct_2",
    calculatorInputs: {
      monthlyInquiries: 310,
      caseAcceptanceRate: 34,
      signedRate: 22,
    },
    calculatedLeak: 63300,
    selfReportedPainLevel: 8,
    desiredOutcome: "Shorten intake speed and increase signed cases",
    bookingTimestamp: "2026-02-24T19:00:00.000Z",
    timeOnPageSeconds: 512,
    scrollDepthPercent: 91,
  },
  {
    id: "diag_3",
    accountId: "acct_3",
    calculatorInputs: {
      portfolioCompanies: 12,
      normalizedKpis: 61,
      operatingReviewsPerQuarter: 1,
    },
    calculatedLeak: 91500,
    selfReportedPainLevel: 7,
    desiredOutcome: "Normalize KPI views across all assets",
    bookingTimestamp: null,
    timeOnPageSeconds: 380,
    scrollDepthPercent: 88,
  },
];

const deals: Deal[] = [
  {
    id: "deal_1",
    accountId: "acct_1",
    primaryContactId: "ct_1",
    name: "Luma Med Spa Revenue Recovery",
    stage: "Friction Confirmed",
    arrOpportunity: 144000,
    estimatedLeak: 28400,
    painScore: 92,
    authorityLevel: 5,
    engagementScore: 90,
    icpFitScore: 95,
    timeInStageDays: 6,
    nextAction: "Map reminder + no-show recovery system",
    ownerName: "Mia Torres",
    source: "Leak Audit Sprint",
    outboundCost: 1600,
  },
  {
    id: "deal_2",
    accountId: "acct_2",
    primaryContactId: "ct_2",
    name: "Harbor PI Intake Architecture",
    stage: "Architecture Proposed",
    arrOpportunity: 228000,
    estimatedLeak: 63300,
    painScore: 88,
    authorityLevel: 5,
    engagementScore: 82,
    icpFitScore: 88,
    timeInStageDays: 9,
    nextAction: "Pattern interrupt follow-up if silent for 7 days",
    ownerName: "Dante Ruiz",
    source: "Case Velocity Diagnostic",
    outboundCost: 2100,
  },
  {
    id: "deal_3",
    accountId: "acct_3",
    primaryContactId: "ct_3",
    name: "Northline Portfolio Normalization OS",
    stage: "Math Exposure",
    arrOpportunity: 312000,
    estimatedLeak: 91500,
    painScore: 74,
    authorityLevel: 4,
    engagementScore: 66,
    icpFitScore: 82,
    timeInStageDays: 4,
    nextAction: "Drive benchmark walkthrough with operating committee",
    ownerName: "Sofia Patel",
    source: "Portfolio Benchmark Trigger",
    outboundCost: 2600,
  },
  {
    id: "deal_4",
    accountId: "acct_4",
    primaryContactId: "ct_4",
    name: "Aster Recall Recovery Engine",
    stage: "Engaged Signal",
    arrOpportunity: 96000,
    estimatedLeak: 21900,
    painScore: 61,
    authorityLevel: 4,
    engagementScore: 58,
    icpFitScore: 73,
    timeInStageDays: 11,
    nextAction: "Move to dormant campaign if no reply after step 4",
    ownerName: "Mia Torres",
    source: "Recall Recovery Sequence",
    outboundCost: 1100,
  },
  {
    id: "deal_5",
    accountId: "acct_2",
    primaryContactId: "ct_2",
    name: "Harbor PI Signed-Rate Expansion",
    stage: "Closed - Installed",
    arrOpportunity: 180000,
    estimatedLeak: 41000,
    painScore: 86,
    authorityLevel: 5,
    engagementScore: 84,
    icpFitScore: 90,
    timeInStageDays: 28,
    nextAction: "Track first 30-day MRR realization",
    ownerName: "Dante Ruiz",
    source: "Case Velocity Diagnostic",
    outboundCost: 2500,
  },
];

const automationRules: AutomationRule[] = [
  {
    id: "auto_1",
    trigger: "Reply Sentiment = Interested",
    action: "Create deal, assign owner, send calendar link",
    status: "Active",
  },
  {
    id: "auto_2",
    trigger: "Diagnostic Leak > $20k",
    action: "Flag as high value and send Slack alert",
    status: "Active",
  },
  {
    id: "auto_3",
    trigger: "No reply after step 4",
    action: "Move account into dormant campaign",
    status: "Active",
  },
  {
    id: "auto_4",
    trigger: "Proposal sent + no response for 7 days",
    action: "Send pattern interrupt follow-up",
    status: "Active",
  },
];

const verticalModules: VerticalModule[] = [
  {
    id: "vert_1",
    vertical: "Med Spa",
    summary: "Optimize no-show recovery and treatment rebooking economics.",
    metrics: [
      "No-show rate",
      "Rebooking %",
      "Avg procedure value",
      "LTV per treatment",
    ],
  },
  {
    id: "vert_2",
    vertical: "PI Law",
    summary: "Compress intake delay and increase signed-rate velocity.",
    metrics: [
      "Intake speed",
      "Case acceptance rate",
      "Avg case value",
      "Signed rate",
    ],
  },
  {
    id: "vert_3",
    vertical: "Private Equity",
    summary: "Normalize operator data for cross-asset value creation.",
    metrics: ["Portfolio KPI normalization", "Cross-asset benchmarking"],
  },
];

const ledgerEntries: LedgerEntry[] = [
  {
    id: "led_1",
    entryType: "Expense",
    occurredOn: "2026-02-26",
    ownerName: "Chris",
    description: "Vercel and domain renewals",
    notes: "Annual infrastructure billing",
    amount: 184,
  },
  {
    id: "led_2",
    entryType: "Expense",
    occurredOn: "2026-02-27",
    ownerName: "Partner",
    description: "Prospect list purchase",
    notes: "Apollo export credits",
    amount: 320,
  },
  {
    id: "led_3",
    entryType: "Revenue",
    occurredOn: "2026-03-01",
    ownerName: "Chris",
    description: "Setup fee collected",
    notes: "Initial implementation payment",
    amount: 2500,
  },
];

export const mockCrmSnapshot = buildCrmSnapshot({
  origin: "mock",
  accounts,
  contacts,
  campaignSignals,
  diagnostics,
  deals,
  automationRules,
  verticalModules,
  ledgerEntries,
});
