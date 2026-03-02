import { buildCrmSnapshot, mockCrmSnapshot } from "@/lib/mock-data";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase";
import {
  Account,
  AutomationRule,
  CampaignSignal,
  Contact,
  CrmSnapshot,
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

function fallbackSnapshot(syncMessage: string): CrmSnapshot {
  return {
    ...mockCrmSnapshot,
    syncStatus: "fallback",
    syncMessage,
  };
}

export async function getCrmSnapshot(): Promise<CrmSnapshot> {
  if (!isSupabaseConfigured()) {
    return fallbackSnapshot(
      "Supabase environment variables are missing. Add NEXT_PUBLIC_SUPABASE_URL and a valid key in Vercel.",
    );
  }

  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return fallbackSnapshot(
      "Supabase client could not be initialized. Verify the URL and API key values.",
    );
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

    const firstError = results.find((result) => result.error)?.error;

    if (firstError) {
      return fallbackSnapshot(`Supabase query failed: ${firstError.message}`);
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
      accounts,
      contacts,
      campaignSignals,
      diagnostics,
      deals,
      automationRules,
      verticalModules,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error while loading Supabase data.";

    return fallbackSnapshot(`Supabase request threw: ${message}`);
  }
}
