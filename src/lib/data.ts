import { buildCrmSnapshot, mockCrmSnapshot } from "@/lib/mock-data";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase";
import {
  Account,
  AutomationRule,
  CampaignSignal,
  Contact,
  Deal,
  DiagnosticData,
  VerticalModule,
} from "@/lib/types";

function camelizeRecord<T extends Record<string, unknown>>(record: T) {
  return Object.entries(record).reduce<Record<string, unknown>>((acc, [key, value]) => {
    const camelKey = key.replace(/_([a-z])/g, (_, char: string) => char.toUpperCase());
    acc[camelKey] = value;
    return acc;
  }, {}) as T;
}

export async function getCrmSnapshot() {
  if (!isSupabaseConfigured()) {
    return mockCrmSnapshot;
  }

  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return mockCrmSnapshot;
  }

  try {
    const [
      accountsResult,
      contactsResult,
      campaignSignalsResult,
      diagnosticsResult,
      dealsResult,
      automationRulesResult,
      verticalModulesResult,
    ] = await Promise.all([
      supabase.from("accounts").select("*").order("signal_score", { ascending: false }),
      supabase.from("contacts").select("*"),
      supabase.from("campaign_signals").select("*"),
      supabase.from("diagnostics").select("*"),
      supabase.from("deals").select("*"),
      supabase.from("automation_rules").select("*"),
      supabase.from("vertical_modules").select("*"),
    ]);

    const results = [
      accountsResult,
      contactsResult,
      campaignSignalsResult,
      diagnosticsResult,
      dealsResult,
      automationRulesResult,
      verticalModulesResult,
    ];

    if (results.some((result) => result.error)) {
      return mockCrmSnapshot;
    }

    const accounts = (accountsResult.data ?? []).map((row) => {
      const item = camelizeRecord(row);

      return {
        ...item,
        techStack: item.techStack ?? [],
        adChannelsUsed: item.adChannelsUsed ?? [],
        frictionSummary: item.frictionSummary ?? "No friction captured yet.",
        beliefStage: item.beliefStage ?? "Cold Signal",
        verticalMetrics: item.verticalMetrics ?? {},
      } as Account;
    });
    const contacts = (contactsResult.data ?? []).map((row) => camelizeRecord(row) as Contact);
    const campaignSignals = (campaignSignalsResult.data ?? []).map(
      (row) => camelizeRecord(row) as CampaignSignal,
    );
    const diagnostics = (diagnosticsResult.data ?? []).map(
      (row) => camelizeRecord(row) as DiagnosticData,
    );
    const deals = (dealsResult.data ?? []).map((row) => camelizeRecord(row) as Deal);
    const automationRules = (automationRulesResult.data ?? []).map((row) => {
      const item = camelizeRecord(row);

      return {
        id: String(item.id),
        trigger: String(item.triggerName ?? ""),
        action: String(item.actionName ?? ""),
        status: item.status === "Draft" ? "Draft" : "Active",
      } as AutomationRule;
    });
    const verticalModules = (verticalModulesResult.data ?? []).map(
      (row) => camelizeRecord(row) as VerticalModule,
    );

    return buildCrmSnapshot({
      origin: "supabase",
      accounts: accounts.length ? accounts : mockCrmSnapshot.accounts,
      contacts: contacts.length ? contacts : mockCrmSnapshot.contacts,
      campaignSignals: campaignSignals.length
        ? campaignSignals
        : mockCrmSnapshot.campaignSignals,
      diagnostics: diagnostics.length ? diagnostics : mockCrmSnapshot.diagnostics,
      deals: deals.length ? deals : mockCrmSnapshot.deals,
      automationRules: automationRules.length
        ? automationRules
        : mockCrmSnapshot.automationRules,
      verticalModules: verticalModules.length
        ? verticalModules
        : mockCrmSnapshot.verticalModules,
    });
  } catch {
    return mockCrmSnapshot;
  }
}
