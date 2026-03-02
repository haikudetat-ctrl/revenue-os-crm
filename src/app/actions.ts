"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/lib/auth";
import { CRM_APP_PATHS } from "@/lib/crm-nav";
import { resolveReturnPath } from "@/lib/crm-page";
import { getSupabaseServerClient } from "@/lib/supabase";
import { PIPELINE_STAGES } from "@/lib/types";

type NoticeStatus = "success" | "error";
type SupabaseClient = NonNullable<ReturnType<typeof getSupabaseServerClient>>;

function parseNumber(value: FormDataEntryValue | null, fallback = 0) {
  if (typeof value !== "string" || value.trim() === "") {
    return fallback;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseInteger(value: FormDataEntryValue | null, fallback = 0) {
  return Math.round(parseNumber(value, fallback));
}

function parseList(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseStage(value: FormDataEntryValue | null) {
  if (typeof value === "string" && PIPELINE_STAGES.includes(value as (typeof PIPELINE_STAGES)[number])) {
    return value;
  }

  return "Cold Signal";
}

function parseLedgerEntryType(value: FormDataEntryValue | null) {
  return value === "Revenue" ? "Revenue" : "Expense";
}

function parseDateString(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") {
    return new Date().toISOString().slice(0, 10);
  }

  return value;
}

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function createQuickAccount(
  supabase: SupabaseClient,
  values: {
    companyName: string;
    industryVertical: string;
    revenueBand: string;
    location: string;
  },
) {
  const { data, error } = await supabase
    .from("accounts")
    .insert({
      company_name: values.companyName,
      industry_vertical: values.industryVertical,
      revenue_band: values.revenueBand,
      location: values.location,
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    throw new Error(error?.message ?? "Unable to create inline account.");
  }

  return String(data.id);
}

async function resolveAccountId(
  supabase: SupabaseClient,
  formData: FormData,
  options?: { allowContactFallback?: boolean },
) {
  const selectedAccountId = readText(formData, "accountId");

  if (selectedAccountId) {
    return selectedAccountId;
  }

  if (options?.allowContactFallback) {
    const selectedContactId = readText(formData, "primaryContactId");

    if (selectedContactId) {
      const { data, error } = await supabase
        .from("contacts")
        .select("account_id")
        .eq("id", selectedContactId)
        .maybeSingle();

      if (error) {
        throw new Error(`Unable to resolve contact account: ${error.message}`);
      }

      if (data?.account_id) {
        return String(data.account_id);
      }
    }
  }

  const companyName = readText(formData, "newAccountCompanyName");
  const industryVertical = readText(formData, "newAccountIndustryVertical");
  const revenueBand = readText(formData, "newAccountRevenueBand");
  const location = readText(formData, "newAccountLocation");

  if (!companyName || !industryVertical || !revenueBand || !location) {
    throw new Error(
      "Select an existing account or fill company name, industry, revenue band, and location to create one inline.",
    );
  }

  return createQuickAccount(supabase, {
    companyName,
    industryVertical,
    revenueBand,
    location,
  });
}

async function createQuickContact(
  supabase: SupabaseClient,
  accountId: string,
  values: {
    name: string;
    email: string;
    title: string;
    phone: string;
  },
) {
  const { data, error } = await supabase
    .from("contacts")
    .insert({
      account_id: accountId,
      name: values.name,
      email: values.email,
      title: values.title,
      phone: values.phone,
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    throw new Error(error?.message ?? "Unable to create inline contact.");
  }

  return String(data.id);
}

async function getRequiredSupabaseClient() {
  await requireAuthenticatedUser();

  const supabase = getSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase is not configured on the server.");
  }

  return supabase;
}

function finish(redirectPath: string, status: NoticeStatus, message: string) {
  CRM_APP_PATHS.forEach((path) => revalidatePath(path));
  redirect(`${redirectPath}?status=${status}&message=${encodeURIComponent(message)}`);
}

function isRedirectSignal(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

export async function createAccountAction(formData: FormData) {
  const redirectPath = resolveReturnPath(formData.get("redirectTo"));

  try {
    const supabase = await getRequiredSupabaseClient();

    const companyName = String(formData.get("companyName") ?? "").trim();
    const industryVertical = String(formData.get("industryVertical") ?? "").trim();
    const revenueBand = String(formData.get("revenueBand") ?? "").trim();
    const location = String(formData.get("location") ?? "").trim();

    if (!companyName || !industryVertical || !revenueBand || !location) {
      finish(redirectPath, "error", "Company name, industry, revenue band, and location are required.");
    }

    const payload = {
      company_name: companyName,
      industry_vertical: industryVertical,
      revenue_band: revenueBand,
      employee_count: parseInteger(formData.get("employeeCount")),
      location,
      tech_stack: parseList(formData.get("techStack")),
      ad_channels_used: parseList(formData.get("adChannelsUsed")),
      booking_software: String(formData.get("bookingSoftware") ?? "").trim(),
      crm_used: String(formData.get("crmUsed") ?? "").trim(),
      acquisition_model: String(formData.get("acquisitionModel") ?? "Organic"),
      estimated_ltv: parseNumber(formData.get("estimatedLtv")),
      estimated_lead_volume: parseInteger(formData.get("estimatedLeadVolume")),
      estimated_conversion_rate: parseNumber(formData.get("estimatedConversionRate")),
      estimated_revenue_leak_percent: parseNumber(formData.get("estimatedRevenueLeakPercent")),
      estimated_monthly_revenue_leak: parseNumber(formData.get("estimatedMonthlyRevenueLeak")),
      signal_score: parseInteger(formData.get("signalScore")),
      icp_fit_score: parseInteger(formData.get("icpFitScore")),
      owner_persona_type: String(formData.get("ownerPersonaType") ?? "").trim(),
      friction_summary: String(formData.get("frictionSummary") ?? "").trim(),
      belief_stage: parseStage(formData.get("beliefStage")),
      vertical_metrics: {},
    };

    const { error } = await supabase.from("accounts").insert(payload);

    if (error) {
      finish(redirectPath, "error", `Account create failed: ${error.message}`);
    }

    finish(redirectPath, "success", `${companyName} was added to accounts.`);
  } catch (error) {
    if (isRedirectSignal(error)) {
      throw error;
    }

    const message = error instanceof Error ? error.message : "Unknown account error.";
    finish(redirectPath, "error", `Account create failed: ${message}`);
  }
}

export async function updateAccountAction(formData: FormData) {
  const redirectPath = resolveReturnPath(formData.get("redirectTo"));

  try {
    const supabase = await getRequiredSupabaseClient();
    const accountId = readText(formData, "accountId");
    const companyName = readText(formData, "companyName");
    const industryVertical = readText(formData, "industryVertical");
    const revenueBand = readText(formData, "revenueBand");
    const location = readText(formData, "location");

    if (!accountId) {
      finish(redirectPath, "error", "Account id is required.");
    }

    if (!companyName || !industryVertical || !revenueBand || !location) {
      finish(redirectPath, "error", "Company name, industry, revenue band, and location are required.");
    }

    const payload = {
      company_name: companyName,
      industry_vertical: industryVertical,
      revenue_band: revenueBand,
      employee_count: parseInteger(formData.get("employeeCount")),
      location,
      tech_stack: parseList(formData.get("techStack")),
      ad_channels_used: parseList(formData.get("adChannelsUsed")),
      booking_software: readText(formData, "bookingSoftware"),
      crm_used: readText(formData, "crmUsed"),
      acquisition_model: String(formData.get("acquisitionModel") ?? "Organic"),
      estimated_ltv: parseNumber(formData.get("estimatedLtv")),
      estimated_lead_volume: parseInteger(formData.get("estimatedLeadVolume")),
      estimated_conversion_rate: parseNumber(formData.get("estimatedConversionRate")),
      estimated_revenue_leak_percent: parseNumber(formData.get("estimatedRevenueLeakPercent")),
      estimated_monthly_revenue_leak: parseNumber(formData.get("estimatedMonthlyRevenueLeak")),
      signal_score: parseInteger(formData.get("signalScore")),
      icp_fit_score: parseInteger(formData.get("icpFitScore")),
      owner_persona_type: readText(formData, "ownerPersonaType"),
      friction_summary: readText(formData, "frictionSummary"),
      belief_stage: parseStage(formData.get("beliefStage")),
    };

    const { error } = await supabase.from("accounts").update(payload).eq("id", accountId);

    if (error) {
      finish(redirectPath, "error", `Account update failed: ${error.message}`);
    }

    finish(redirectPath, "success", `${companyName} was updated.`);
  } catch (error) {
    if (isRedirectSignal(error)) {
      throw error;
    }

    const message = error instanceof Error ? error.message : "Unknown account update error.";
    finish(redirectPath, "error", `Account update failed: ${message}`);
  }
}

export async function createContactAction(formData: FormData) {
  const redirectPath = resolveReturnPath(formData.get("redirectTo"));

  try {
    const supabase = await getRequiredSupabaseClient();

    const accountId = await resolveAccountId(supabase, formData);
    const name = readText(formData, "name");
    const email = readText(formData, "email");

    if (!name || !email) {
      finish(redirectPath, "error", "Contact name and email are required.");
    }

    const payload = {
      account_id: accountId,
      name,
      title: readText(formData, "title"),
      linkedin: readText(formData, "linkedIn"),
      email,
      phone: readText(formData, "phone"),
      role_in_decision: readText(formData, "roleInDecision"),
      authority_level: parseInteger(formData.get("authorityLevel"), 3),
      influence_level: parseInteger(formData.get("influenceLevel"), 3),
      engagement_score: parseInteger(formData.get("engagementScore")),
      sentiment_tag: readText(formData, "sentimentTag"),
      response_type: String(formData.get("responseType") ?? "Neutral"),
    };

    const { error } = await supabase.from("contacts").insert(payload);

    if (error) {
      finish(redirectPath, "error", `Contact create failed: ${error.message}`);
    }

    finish(redirectPath, "success", `${name} was added as a contact.`);
  } catch (error) {
    if (isRedirectSignal(error)) {
      throw error;
    }

    const message = error instanceof Error ? error.message : "Unknown contact error.";
    finish(redirectPath, "error", `Contact create failed: ${message}`);
  }
}

export async function updateContactAction(formData: FormData) {
  const redirectPath = resolveReturnPath(formData.get("redirectTo"));

  try {
    const supabase = await getRequiredSupabaseClient();
    const contactId = readText(formData, "contactId");
    const accountId = readText(formData, "accountId");
    const name = readText(formData, "name");
    const email = readText(formData, "email");

    if (!contactId || !accountId) {
      finish(redirectPath, "error", "Contact id and account are required.");
    }

    if (!name || !email) {
      finish(redirectPath, "error", "Contact name and email are required.");
    }

    const payload = {
      account_id: accountId,
      name,
      title: readText(formData, "title"),
      linkedin: readText(formData, "linkedIn"),
      email,
      phone: readText(formData, "phone"),
      role_in_decision: readText(formData, "roleInDecision"),
      authority_level: parseInteger(formData.get("authorityLevel"), 3),
      influence_level: parseInteger(formData.get("influenceLevel"), 3),
      engagement_score: parseInteger(formData.get("engagementScore")),
      sentiment_tag: readText(formData, "sentimentTag"),
      response_type: String(formData.get("responseType") ?? "Neutral"),
    };

    const { error } = await supabase.from("contacts").update(payload).eq("id", contactId);

    if (error) {
      finish(redirectPath, "error", `Contact update failed: ${error.message}`);
    }

    finish(redirectPath, "success", `${name} was updated.`);
  } catch (error) {
    if (isRedirectSignal(error)) {
      throw error;
    }

    const message = error instanceof Error ? error.message : "Unknown contact update error.";
    finish(redirectPath, "error", `Contact update failed: ${message}`);
  }
}

export async function createDealAction(formData: FormData) {
  const redirectPath = resolveReturnPath(formData.get("redirectTo"));

  try {
    const supabase = await getRequiredSupabaseClient();

    const name = readText(formData, "name");

    if (!name) {
      finish(redirectPath, "error", "Deal name is required.");
    }

    const accountId = await resolveAccountId(supabase, formData, {
      allowContactFallback: true,
    });
    const selectedPrimaryContactId = readText(formData, "primaryContactId");
    let primaryContactId = selectedPrimaryContactId;

    if (selectedPrimaryContactId) {
      const { data, error } = await supabase
        .from("contacts")
        .select("account_id")
        .eq("id", selectedPrimaryContactId)
        .maybeSingle();

      if (error) {
        finish(redirectPath, "error", `Deal create failed: ${error.message}`);
      }

      if (data?.account_id && String(data.account_id) !== accountId) {
        finish(
          redirectPath,
          "error",
          "The selected contact belongs to a different account. Choose a matching account or leave the contact blank and create one inline.",
        );
      }
    } else {
      const newContactName = readText(formData, "newContactName");
      const newContactEmail = readText(formData, "newContactEmail");

      if (!newContactName || !newContactEmail) {
        finish(
          redirectPath,
          "error",
          "Select an existing contact or fill a new contact name and email to create one inline.",
        );
      }

      primaryContactId = await createQuickContact(supabase, accountId, {
        name: newContactName,
        email: newContactEmail,
        title: readText(formData, "newContactTitle"),
        phone: readText(formData, "newContactPhone"),
      });
    }

    const stage = parseStage(formData.get("stage"));
    const payload = {
      account_id: accountId,
      primary_contact_id: primaryContactId,
      name,
      stage,
      arr_opportunity: parseNumber(formData.get("arrOpportunity")),
      estimated_leak: parseNumber(formData.get("estimatedLeak")),
      pain_score: parseInteger(formData.get("painScore"), 50),
      authority_level: parseInteger(formData.get("authorityLevel"), 3),
      engagement_score: parseInteger(formData.get("engagementScore")),
      icp_fit_score: parseInteger(formData.get("icpFitScore")),
      time_in_stage_days: parseInteger(formData.get("timeInStageDays")),
      next_action: String(formData.get("nextAction") ?? "").trim(),
      owner_name: readText(formData, "ownerName"),
      source: readText(formData, "source"),
      outbound_cost: parseNumber(formData.get("outboundCost")),
      closed_at: stage === "Closed - Installed" ? new Date().toISOString() : null,
    };

    const { data, error } = await supabase
      .from("deals")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      finish(redirectPath, "error", `Deal create failed: ${error.message}`);
    }

    if (data?.id) {
      await supabase.from("deal_stage_events").insert({
        deal_id: data.id,
        stage,
      });
    }

    finish(redirectPath, "success", `${name} was added to the pipeline.`);
  } catch (error) {
    if (isRedirectSignal(error)) {
      throw error;
    }

    const message = error instanceof Error ? error.message : "Unknown deal error.";
    finish(redirectPath, "error", `Deal create failed: ${message}`);
  }
}

export async function updateDealAction(formData: FormData) {
  const redirectPath = resolveReturnPath(formData.get("redirectTo"));

  try {
    const supabase = await getRequiredSupabaseClient();
    const dealId = readText(formData, "dealId");
    const name = readText(formData, "name");
    const accountId = readText(formData, "accountId");
    const primaryContactId = readText(formData, "primaryContactId");

    if (!dealId) {
      finish(redirectPath, "error", "Deal id is required.");
    }

    if (!name || !accountId || !primaryContactId) {
      finish(redirectPath, "error", "Deal name, account, and primary contact are required.");
    }

    const { data, error: contactError } = await supabase
      .from("contacts")
      .select("account_id")
      .eq("id", primaryContactId)
      .maybeSingle();

    if (contactError) {
      finish(redirectPath, "error", `Deal update failed: ${contactError.message}`);
    }

    if (!data?.account_id || String(data.account_id) !== accountId) {
      finish(
        redirectPath,
        "error",
        "The selected contact belongs to a different account. Choose a matching contact.",
      );
    }

    const stage = parseStage(formData.get("stage"));
    const payload = {
      account_id: accountId,
      primary_contact_id: primaryContactId,
      name,
      stage,
      arr_opportunity: parseNumber(formData.get("arrOpportunity")),
      estimated_leak: parseNumber(formData.get("estimatedLeak")),
      pain_score: parseInteger(formData.get("painScore"), 50),
      authority_level: parseInteger(formData.get("authorityLevel"), 3),
      engagement_score: parseInteger(formData.get("engagementScore")),
      icp_fit_score: parseInteger(formData.get("icpFitScore")),
      time_in_stage_days: parseInteger(formData.get("timeInStageDays")),
      next_action: readText(formData, "nextAction"),
      owner_name: readText(formData, "ownerName"),
      source: readText(formData, "source"),
      outbound_cost: parseNumber(formData.get("outboundCost")),
      closed_at: stage === "Closed - Installed" ? new Date().toISOString() : null,
    };

    const { error } = await supabase.from("deals").update(payload).eq("id", dealId);

    if (error) {
      finish(redirectPath, "error", `Deal update failed: ${error.message}`);
    }

    await supabase.from("deal_stage_events").insert({
      deal_id: dealId,
      stage,
    });

    finish(redirectPath, "success", `${name} was updated.`);
  } catch (error) {
    if (isRedirectSignal(error)) {
      throw error;
    }

    const message = error instanceof Error ? error.message : "Unknown deal update error.";
    finish(redirectPath, "error", `Deal update failed: ${message}`);
  }
}

export async function updateDealStageAction(formData: FormData) {
  const redirectPath = resolveReturnPath(formData.get("redirectTo"));

  try {
    const supabase = await getRequiredSupabaseClient();

    const dealId = String(formData.get("dealId") ?? "").trim();
    const stage = parseStage(formData.get("stage"));

    if (!dealId) {
      finish(redirectPath, "error", "Deal id is required.");
    }

    const payload = {
      stage,
      next_action: String(formData.get("nextAction") ?? "").trim(),
      time_in_stage_days: parseInteger(formData.get("timeInStageDays")),
      closed_at: stage === "Closed - Installed" ? new Date().toISOString() : null,
    };

    const { error } = await supabase.from("deals").update(payload).eq("id", dealId);

    if (error) {
      finish(redirectPath, "error", `Deal update failed: ${error.message}`);
    }

    await supabase.from("deal_stage_events").insert({
      deal_id: dealId,
      stage,
    });

    finish(redirectPath, "success", "Deal stage updated.");
  } catch (error) {
    if (isRedirectSignal(error)) {
      throw error;
    }

    const message = error instanceof Error ? error.message : "Unknown stage update error.";
    finish(redirectPath, "error", `Deal update failed: ${message}`);
  }
}

export async function createCampaignSignalAction(formData: FormData) {
  const redirectPath = resolveReturnPath(formData.get("redirectTo"));

  try {
    const supabase = await getRequiredSupabaseClient();

    const campaignName = readText(formData, "campaignName");

    if (!campaignName) {
      finish(redirectPath, "error", "Campaign name is required.");
    }

    const accountId = await resolveAccountId(supabase, formData, {
      allowContactFallback: true,
    });
    const selectedContactId = readText(formData, "contactId");
    let contactId = selectedContactId;

    if (selectedContactId) {
      const { data, error } = await supabase
        .from("contacts")
        .select("account_id")
        .eq("id", selectedContactId)
        .maybeSingle();

      if (error) {
        finish(redirectPath, "error", `Signal capture failed: ${error.message}`);
      }

      if (data?.account_id && String(data.account_id) !== accountId) {
        finish(
          redirectPath,
          "error",
          "The selected contact belongs to a different account. Pick a matching account or create the contact inline.",
        );
      }
    } else {
      const newContactName = readText(formData, "newContactName");
      const newContactEmail = readText(formData, "newContactEmail");

      if (!newContactName || !newContactEmail) {
        finish(
          redirectPath,
          "error",
          "Select an existing contact or fill a new contact name and email to create one inline.",
        );
      }

      contactId = await createQuickContact(supabase, accountId, {
        name: newContactName,
        email: newContactEmail,
        title: readText(formData, "newContactTitle"),
        phone: readText(formData, "newContactPhone"),
      });
    }

    const payload = {
      account_id: accountId,
      contact_id: contactId,
      campaign_name: campaignName,
      email_step: parseInteger(formData.get("emailStep"), 1),
      opened: formData.get("opened") === "on",
      clicked: formData.get("clicked") === "on",
      replied: formData.get("replied") === "on",
      reply_sentiment: String(formData.get("replySentiment") ?? "").trim(),
      ai_classification: String(formData.get("aiClassification") ?? "Send Info"),
      time_to_first_response_hours: parseInteger(formData.get("timeToFirstResponseHours"), 0) || null,
    };

    const { error } = await supabase.from("campaign_signals").insert(payload);

    if (error) {
      finish(redirectPath, "error", `Signal capture failed: ${error.message}`);
    }

    finish(redirectPath, "success", `${campaignName} signal captured.`);
  } catch (error) {
    if (isRedirectSignal(error)) {
      throw error;
    }

    const message = error instanceof Error ? error.message : "Unknown signal error.";
    finish(redirectPath, "error", `Signal capture failed: ${message}`);
  }
}

export async function createDiagnosticAction(formData: FormData) {
  const redirectPath = resolveReturnPath(formData.get("redirectTo"));

  try {
    const supabase = await getRequiredSupabaseClient();

    const accountId = await resolveAccountId(supabase, formData);
    const desiredOutcome = readText(formData, "desiredOutcome");

    if (!desiredOutcome) {
      finish(redirectPath, "error", "Desired outcome is required.");
    }

    const calculatorInputs = {
      monthlyLeads: parseInteger(formData.get("monthlyLeads")),
      conversionRate: parseNumber(formData.get("conversionRate")),
      notes: String(formData.get("calculatorNotes") ?? "").trim(),
    };

    const payload = {
      account_id: accountId,
      calculator_inputs: calculatorInputs,
      calculated_leak: parseNumber(formData.get("calculatedLeak")),
      self_reported_pain_level: parseInteger(formData.get("selfReportedPainLevel"), 5),
      desired_outcome: desiredOutcome,
      booking_timestamp: formData.get("booked") === "on" ? new Date().toISOString() : null,
      time_on_page_seconds: parseInteger(formData.get("timeOnPageSeconds")),
      scroll_depth_percent: parseInteger(formData.get("scrollDepthPercent")),
    };

    const { error } = await supabase.from("diagnostics").insert(payload);

    if (error) {
      finish(redirectPath, "error", `Diagnostic capture failed: ${error.message}`);
    }

    finish(redirectPath, "success", "Diagnostic data captured.");
  } catch (error) {
    if (isRedirectSignal(error)) {
      throw error;
    }

    const message = error instanceof Error ? error.message : "Unknown diagnostic error.";
    finish(redirectPath, "error", `Diagnostic capture failed: ${message}`);
  }
}

export async function createAutomationRuleAction(formData: FormData) {
  const redirectPath = resolveReturnPath(formData.get("redirectTo"));

  try {
    const supabase = await getRequiredSupabaseClient();

    const triggerName = String(formData.get("triggerName") ?? "").trim();
    const actionName = String(formData.get("actionName") ?? "").trim();

    if (!triggerName || !actionName) {
      finish(redirectPath, "error", "Trigger and action are required.");
    }

    const payload = {
      trigger_name: triggerName,
      action_name: actionName,
      status: String(formData.get("status") ?? "Active"),
    };

    const { error } = await supabase.from("automation_rules").insert(payload);

    if (error) {
      finish(redirectPath, "error", `Automation create failed: ${error.message}`);
    }

    finish(redirectPath, "success", "Automation rule added.");
  } catch (error) {
    if (isRedirectSignal(error)) {
      throw error;
    }

    const message = error instanceof Error ? error.message : "Unknown automation error.";
    finish(redirectPath, "error", `Automation create failed: ${message}`);
  }
}

export async function createLedgerEntryAction(formData: FormData) {
  const redirectPath = resolveReturnPath(formData.get("redirectTo"));

  try {
    const supabase = await getRequiredSupabaseClient();

    const description = String(formData.get("description") ?? "").trim();
    const ownerName = String(formData.get("ownerName") ?? "").trim();
    const amount = parseNumber(formData.get("amount"));

    if (!description || !ownerName || amount <= 0) {
      finish(redirectPath, "error", "Description, owner name, and a positive amount are required.");
    }

    const payload = {
      entry_type: parseLedgerEntryType(formData.get("entryType")),
      occurred_on: parseDateString(formData.get("occurredOn")),
      owner_name: ownerName,
      description,
      notes: String(formData.get("notes") ?? "").trim(),
      amount,
    };

    const { error } = await supabase.from("ledger_entries").insert(payload);

    if (error) {
      finish(redirectPath, "error", `Ledger entry failed: ${error.message}`);
    }

    finish(redirectPath, "success", `${payload.entry_type} entry added to the ledger.`);
  } catch (error) {
    if (isRedirectSignal(error)) {
      throw error;
    }

    const message = error instanceof Error ? error.message : "Unknown ledger error.";
    finish(redirectPath, "error", `Ledger entry failed: ${message}`);
  }
}
