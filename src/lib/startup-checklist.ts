export interface StartupChecklistItem {
  label: string;
  tone?: "required" | "optional" | "critical" | "rule";
}

export interface StartupChecklistSection {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  items: StartupChecklistItem[];
}

export const startupChecklistSections: StartupChecklistSection[] = [
  {
    id: "legal-structural",
    eyebrow: "1. Legal & Structural",
    title: "So you can actually take money",
    subtitle: "Required before signing the first deal.",
    items: [
      { label: "Choose final company name", tone: "required" },
      { label: "Check domain + state availability", tone: "required" },
      { label: "Form LLC (NJ or wherever you land)", tone: "required" },
      { label: "Operating Agreement (even if just 2 members)", tone: "required" },
      { label: "EIN (free, IRS)", tone: "required" },
      { label: "Register for state taxes (if required)", tone: "required" },
      { label: "Business address (virtual ok)", tone: "required" },
      { label: "Business phone number (not personal)", tone: "required" },
      { label: "Basic liability insurance (recommended once revenue starts)", tone: "required" },
      { label: "Trademark search (do not file yet unless committed)", tone: "optional" },
      { label: "DBA if brand differs from LLC", tone: "optional" },
    ],
  },
  {
    id: "financial-payments",
    eyebrow: "2. Financial & Payments",
    title: "So you can get paid fast",
    subtitle: "Set this before invoices start moving.",
    items: [
      { label: "Business bank account", tone: "required" },
      { label: "Separate debit card", tone: "required" },
      { label: "Stripe or payment processor", tone: "required" },
      { label: "ACH enabled", tone: "required" },
      { label: "Invoicing system (Stripe, QuickBooks, etc.)", tone: "required" },
      { label: "Accounting software (QuickBooks, Xero, or simple spreadsheet)", tone: "required" },
      { label: "Revenue split agreement between both founders in writing", tone: "critical" },
      { label: "Decide profit split, draws, and whether to reinvest the first 90 days", tone: "critical" },
    ],
  },
  {
    id: "brand-credibility",
    eyebrow: "3. Brand & Credibility Assets",
    title: "Minimum viable trust",
    subtitle: "You do not need perfection. You need real.",
    items: [
      { label: "Domain secured", tone: "required" },
      { label: "Simple landing page (who we help + what we do + book call)", tone: "required" },
      { label: "Professional email addresses", tone: "required" },
      { label: "1-page PDF capability deck", tone: "required" },
      { label: "Branded proposal template", tone: "required" },
      { label: "Branded invoice template", tone: "required" },
      { label: "Calendly or booking link", tone: "required" },
      { label: "LinkedIn profiles optimized for the offer", tone: "required" },
      { label: "1 short case example from past experience", tone: "optional" },
      { label: "1 explainer Loom", tone: "optional" },
      { label: "Clear positioning headline", tone: "optional" },
    ],
  },
  {
    id: "offer-clarity",
    eyebrow: "4. Offer Clarity",
    title: "Most people skip this",
    subtitle: "If this is loose, closing gets messy.",
    items: [
      { label: "Exact ICP defined (for example: $1M-$5M home services, owner-led)", tone: "required" },
      { label: "Specific problem statement", tone: "required" },
      { label: "Specific outcome promise", tone: "required" },
      { label: "Defined scope (what you do)", tone: "required" },
      { label: "Defined non-scope (what you do not do)", tone: "required" },
      { label: "Timeline of engagement", tone: "required" },
      { label: "Clear pricing model", tone: "required" },
      { label: "Performance incentive structure", tone: "required" },
      { label: "3-month break clause written clearly", tone: "required" },
    ],
  },
  {
    id: "sales-infrastructure",
    eyebrow: "5. Sales Infrastructure",
    title: "So you can close consistently",
    subtitle: "Call to proposal to contract to invoice should happen within 72 hours.",
    items: [
      { label: "Discovery call script", tone: "required" },
      { label: "Qualification checklist", tone: "required" },
      { label: "Follow-up email template", tone: "required" },
      { label: "Proposal template", tone: "required" },
      { label: "Contract template (scope, payment terms, performance clause, break clause, IP ownership, confidentiality)", tone: "required" },
      { label: "CRM (even basic)", tone: "required" },
      { label: "Objection handling doc", tone: "required" },
      { label: "Pricing confidence: practice saying it out loud", tone: "critical" },
    ],
  },
  {
    id: "delivery-infrastructure",
    eyebrow: "6. Delivery Infrastructure",
    title: "Before you sell implementation",
    subtitle: "Never sell what you cannot immediately execute.",
    items: [
      { label: "Onboarding form", tone: "required" },
      { label: "Access checklist (ads, CRM, email, etc.)", tone: "required" },
      { label: "Shared drive structure", tone: "required" },
      { label: "Internal SOP for first 30 days", tone: "required" },
      { label: "KPI tracking system", tone: "required" },
      { label: "Reporting template", tone: "required" },
      { label: "Communication cadence (weekly call, Slack, email)", tone: "required" },
    ],
  },
  {
    id: "risk-protection",
    eyebrow: "7. Risk & Protection",
    title: "The boring stuff that protects you",
    subtitle: "Money hits before work starts.",
    items: [
      { label: "Limitation of liability clause", tone: "required" },
      { label: "No revenue guarantees unless clearly structured", tone: "required" },
      { label: "Performance compensation defined precisely", tone: "required" },
      { label: "Refund policy defined", tone: "required" },
      { label: "Scope creep clause", tone: "required" },
      { label: "Payment terms defined (Net 7, upfront, retainer before work)", tone: "required" },
      { label: "Rule: money hits before work starts", tone: "rule" },
    ],
  },
  {
    id: "signal-readiness",
    eyebrow: "8. Signal Readiness",
    title: "Quiet close rate boosters",
    subtitle: "You want to sound like you have done this before.",
    items: [
      { label: "Clean LinkedIn presence for both founders", tone: "optional" },
      { label: "Thoughtful content (even 3-5 posts)", tone: "optional" },
      { label: "Company email signature", tone: "optional" },
      { label: "Branded Zoom background", tone: "optional" },
      { label: "Clear positioning sentence memorized", tone: "critical" },
      { label: "Clean personal finances (confidence matters)", tone: "optional" },
      { label: "Consistent narrative between both founders", tone: "critical" },
    ],
  },
];

export function getStartupChecklistCounts() {
  const totalSections = startupChecklistSections.length;
  const totalItems = startupChecklistSections.reduce(
    (sum, section) => sum + section.items.length,
    0,
  );
  const requiredItems = startupChecklistSections.reduce(
    (sum, section) =>
      sum + section.items.filter((item) => item.tone === "required").length,
    0,
  );
  const criticalItems = startupChecklistSections.reduce(
    (sum, section) =>
      sum + section.items.filter((item) => item.tone === "critical" || item.tone === "rule").length,
    0,
  );

  return {
    totalSections,
    totalItems,
    requiredItems,
    criticalItems,
  };
}
