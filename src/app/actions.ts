"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase";
import { PIPELINE_STAGES } from "@/lib/types";

type NoticeStatus = "success" | "error";

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

function getRequiredSupabaseClient() {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase is not configured on the server.");
  }

  return supabase;
}

function finish(status: NoticeStatus, message: string) {
  revalidatePath("/");
  redirect(`/?status=${status}&message=${encodeURIComponent(message)}`);
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
  try {
    const supabase = getRequiredSupabaseClient();

    const companyName = String(formData.get("companyName") ?? "").trim();
    const industryVertical = String(formData.get("industryVertical") ?? "").trim();
    const revenueBand = String(formData.get("revenueBand") ?? "").trim();
    const location = String(formData.get("location") ?? "").trim();

    if (!companyName || !industryVertical || !revenueBand || !location) {
      finish("error", "Company name, industry, revenue band, and location are required.");
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
      finish("error", `Account create failed: ${error.message}`);
    }

    finish("success", `${companyName} was added to accounts.`);
  } catch (error) {
    if (isRedirectSignal(error)) {
      throw error;
    }

    const message = error instanceof Error ? error.message : "Unknown account error.";
    finish("error", `Account create failed: ${message}`);
  }
}

export async function createContactAction(formData: FormData) {
  try {
    const supabase = getRequiredSupabaseClient();

    const accountId = String(formData.get("accountId") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();

    if (!accountId || !name || !email) {
      finish("error", "Account, contact name, and email are required.");
    }

    const payload = {
      account_id: accountId,
      name,
      title: String(formData.get("title") ?? "").trim(),
      linkedin: String(formData.get("linkedIn") ?? "").trim(),
      email,
      phone: String(formData.get("phone") ?? "").trim(),
      role_in_decision: String(formData.get("roleInDecision") ?? "").trim(),
      authority_level: parseInteger(formData.get("authorityLevel"), 3),
      influence_level: parseInteger(formData.get("influenceLevel"), 3),
      engagement_score: parseInteger(formData.get("engagementScore")),
      sentiment_tag: String(formData.get("sentimentTag") ?? "").trim(),
      response_type: String(formData.get("responseType") ?? "Neutral"),
    };

    const { error } = await supabase.from("contacts").insert(payload);

    if (error) {
      finish("error", `Contact create failed: ${error.message}`);
    }

    finish("success", `${name} was added as a contact.`);
  } catch (error) {
    if (isRedirectSignal(error)) {
      throw error;
    }

    const message = error instanceof Error ? error.message : "Unknown contact error.";
    finish("error", `Contact create failed: ${message}`);
  }
}

export async function createDealAction(formData: FormData) {
  try {
    const supabase = getRequiredSupabaseClient();

    const accountId = String(formData.get("accountId") ?? "").trim();
    const primaryContactId = String(formData.get("primaryContactId") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim();

    if (!accountId || !primaryContactId || !name) {
      finish("error", "Account, primary contact, and deal name are required.");
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
      owner_name: String(formData.get("ownerName") ?? "").trim(),
      source: String(formData.get("source") ?? "").trim(),
      outbound_cost: parseNumber(formData.get("outboundCost")),
      closed_at: stage === "Closed - Installed" ? new Date().toISOString() : null,
    };

    const { data, error } = await supabase
      .from("deals")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      finish("error", `Deal create failed: ${error.message}`);
    }

    if (data?.id) {
      await supabase.from("deal_stage_events").insert({
        deal_id: data.id,
        stage,
      });
    }

    finish("success", `${name} was added to the pipeline.`);
  } catch (error) {
    if (isRedirectSignal(error)) {
      throw error;
    }

    const message = error instanceof Error ? error.message : "Unknown deal error.";
    finish("error", `Deal create failed: ${message}`);
  }
}

export async function updateDealStageAction(formData: FormData) {
  try {
    const supabase = getRequiredSupabaseClient();

    const dealId = String(formData.get("dealId") ?? "").trim();
    const stage = parseStage(formData.get("stage"));

    if (!dealId) {
      finish("error", "Deal id is required.");
    }

    const payload = {
      stage,
      next_action: String(formData.get("nextAction") ?? "").trim(),
      time_in_stage_days: parseInteger(formData.get("timeInStageDays")),
      closed_at: stage === "Closed - Installed" ? new Date().toISOString() : null,
    };

    const { error } = await supabase.from("deals").update(payload).eq("id", dealId);

    if (error) {
      finish("error", `Deal update failed: ${error.message}`);
    }

    await supabase.from("deal_stage_events").insert({
      deal_id: dealId,
      stage,
    });

    finish("success", "Deal stage updated.");
  } catch (error) {
    if (isRedirectSignal(error)) {
      throw error;
    }

    const message = error instanceof Error ? error.message : "Unknown stage update error.";
    finish("error", `Deal update failed: ${message}`);
  }
}

export async function createCampaignSignalAction(formData: FormData) {
  try {
    const supabase = getRequiredSupabaseClient();

    const accountId = String(formData.get("accountId") ?? "").trim();
    const contactId = String(formData.get("contactId") ?? "").trim();
    const campaignName = String(formData.get("campaignName") ?? "").trim();

    if (!accountId || !contactId || !campaignName) {
      finish("error", "Account, contact, and campaign name are required.");
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
      finish("error", `Signal capture failed: ${error.message}`);
    }

    finish("success", `${campaignName} signal captured.`);
  } catch (error) {
    if (isRedirectSignal(error)) {
      throw error;
    }

    const message = error instanceof Error ? error.message : "Unknown signal error.";
    finish("error", `Signal capture failed: ${message}`);
  }
}

export async function createDiagnosticAction(formData: FormData) {
  try {
    const supabase = getRequiredSupabaseClient();

    const accountId = String(formData.get("accountId") ?? "").trim();
    const desiredOutcome = String(formData.get("desiredOutcome") ?? "").trim();

    if (!accountId || !desiredOutcome) {
      finish("error", "Account and desired outcome are required.");
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
      finish("error", `Diagnostic capture failed: ${error.message}`);
    }

    finish("success", "Diagnostic data captured.");
  } catch (error) {
    if (isRedirectSignal(error)) {
      throw error;
    }

    const message = error instanceof Error ? error.message : "Unknown diagnostic error.";
    finish("error", `Diagnostic capture failed: ${message}`);
  }
}

export async function createAutomationRuleAction(formData: FormData) {
  try {
    const supabase = getRequiredSupabaseClient();

    const triggerName = String(formData.get("triggerName") ?? "").trim();
    const actionName = String(formData.get("actionName") ?? "").trim();

    if (!triggerName || !actionName) {
      finish("error", "Trigger and action are required.");
    }

    const payload = {
      trigger_name: triggerName,
      action_name: actionName,
      status: String(formData.get("status") ?? "Active"),
    };

    const { error } = await supabase.from("automation_rules").insert(payload);

    if (error) {
      finish("error", `Automation create failed: ${error.message}`);
    }

    finish("success", "Automation rule added.");
  } catch (error) {
    if (isRedirectSignal(error)) {
      throw error;
    }

    const message = error instanceof Error ? error.message : "Unknown automation error.";
    finish("error", `Automation create failed: ${message}`);
  }
}
