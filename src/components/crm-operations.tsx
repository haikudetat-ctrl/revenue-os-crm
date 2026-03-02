import type { ReactNode } from "react";
import {
  createAccountAction,
  createAutomationRuleAction,
  createCampaignSignalAction,
  createContactAction,
  createDealAction,
  createDiagnosticAction,
  updateDealStageAction,
} from "@/app/actions";
import { CrmSnapshot, PIPELINE_STAGES } from "@/lib/types";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function CrmOperations({ snapshot }: { snapshot: CrmSnapshot }) {
  const hasAccounts = snapshot.accounts.length > 0;
  const hasContacts = snapshot.contacts.length > 0;
  const accountsById = new Map(snapshot.accounts.map((account) => [account.id, account]));
  const contactsById = new Map(snapshot.contacts.map((contact) => [contact.id, contact]));

  return (
    <section className="grid gap-6 xl:grid-cols-[1.25fr_1fr]">
      <div className="glass-card rounded-[2rem] p-6 sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-slate-500">
              Operating Console
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Capture and move live pipeline data</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-600">
            This is the functional layer: write into Supabase, move deals forward, and log
            the signals and diagnostics that change probability.
          </p>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <FormCard
            title="New Account"
            subtitle="Create a company record with the math layer attached."
          >
            <form action={createAccountAction} className="grid gap-3">
              <Field label="Company Name">
                <input className={inputClassName} name="companyName" required />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Industry Vertical">
                  <input className={inputClassName} name="industryVertical" required />
                </Field>
                <Field label="Revenue Band">
                  <input className={inputClassName} name="revenueBand" required />
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Location">
                  <input className={inputClassName} name="location" required />
                </Field>
                <Field label="Acquisition Model">
                  <select className={inputClassName} name="acquisitionModel" defaultValue="Paid">
                    <option value="Paid">Paid</option>
                    <option value="Referral">Referral</option>
                    <option value="Organic">Organic</option>
                  </select>
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Estimated LTV">
                  <input className={inputClassName} name="estimatedLtv" type="number" min="0" />
                </Field>
                <Field label="Lead Volume / Month">
                  <input
                    className={inputClassName}
                    name="estimatedLeadVolume"
                    type="number"
                    min="0"
                  />
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Conversion Rate %">
                  <input
                    className={inputClassName}
                    name="estimatedConversionRate"
                    type="number"
                    min="0"
                    step="0.1"
                  />
                </Field>
                <Field label="Revenue Leak %">
                  <input
                    className={inputClassName}
                    name="estimatedRevenueLeakPercent"
                    type="number"
                    min="0"
                    step="0.1"
                  />
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Monthly Revenue Leak $">
                  <input
                    className={inputClassName}
                    name="estimatedMonthlyRevenueLeak"
                    type="number"
                    min="0"
                  />
                </Field>
                <Field label="Employee Count">
                  <input className={inputClassName} name="employeeCount" type="number" min="0" />
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Signal Score">
                  <input className={inputClassName} name="signalScore" type="number" min="0" max="100" />
                </Field>
                <Field label="ICP Fit Score">
                  <input className={inputClassName} name="icpFitScore" type="number" min="0" max="100" />
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Booking Software">
                  <input className={inputClassName} name="bookingSoftware" />
                </Field>
                <Field label="CRM Used">
                  <input className={inputClassName} name="crmUsed" />
                </Field>
              </div>
              <Field label="Tech Stack (comma separated)">
                <input className={inputClassName} name="techStack" />
              </Field>
              <Field label="Ad Channels (comma separated)">
                <input className={inputClassName} name="adChannelsUsed" />
              </Field>
              <Field label="Owner Persona Type">
                <input className={inputClassName} name="ownerPersonaType" />
              </Field>
              <Field label="Belief Stage">
                <select className={inputClassName} name="beliefStage" defaultValue="Cold Signal">
                  {PIPELINE_STAGES.map((stage) => (
                    <option key={stage} value={stage}>
                      {stage}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Friction Summary">
                <textarea className={textareaClassName} name="frictionSummary" rows={3} />
              </Field>
              <SubmitButton label="Create Account" />
            </form>
          </FormCard>

          <FormCard
            title="New Contact"
            subtitle="Attach a decision-maker or influencer to an account."
          >
            <form action={createContactAction} className="grid gap-3">
              <Field label="Account">
                <select className={inputClassName} name="accountId" required disabled={!hasAccounts}>
                  <option value="">
                    {hasAccounts ? "Select account" : "Create an account first"}
                  </option>
                  {snapshot.accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.companyName}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Name">
                  <input className={inputClassName} name="name" required />
                </Field>
                <Field label="Title">
                  <input className={inputClassName} name="title" />
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Email">
                  <input className={inputClassName} name="email" type="email" required />
                </Field>
                <Field label="Phone">
                  <input className={inputClassName} name="phone" />
                </Field>
              </div>
              <Field label="LinkedIn">
                <input className={inputClassName} name="linkedIn" type="url" />
              </Field>
              <Field label="Role in Decision">
                <input className={inputClassName} name="roleInDecision" />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Authority Level (1-5)">
                  <input className={inputClassName} name="authorityLevel" type="number" min="1" max="5" defaultValue="3" />
                </Field>
                <Field label="Influence Level (1-5)">
                  <input className={inputClassName} name="influenceLevel" type="number" min="1" max="5" defaultValue="3" />
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Engagement Score">
                  <input className={inputClassName} name="engagementScore" type="number" min="0" max="100" />
                </Field>
                <Field label="Response Type">
                  <select className={inputClassName} name="responseType" defaultValue="Neutral">
                    <option value="Positive">Positive</option>
                    <option value="Neutral">Neutral</option>
                    <option value="Objection">Objection</option>
                    <option value="Not Now">Not Now</option>
                  </select>
                </Field>
              </div>
              <Field label="Sentiment Tag">
                <input className={inputClassName} name="sentimentTag" />
              </Field>
              <SubmitButton label="Create Contact" disabled={!hasAccounts} />
            </form>
          </FormCard>

          <FormCard
            title="New Deal"
            subtitle="Create a pipeline record with explicit revenue math."
          >
            <form action={createDealAction} className="grid gap-3">
              <Field label="Account">
                <select className={inputClassName} name="accountId" required disabled={!hasAccounts}>
                  <option value="">
                    {hasAccounts ? "Select account" : "Create an account first"}
                  </option>
                  {snapshot.accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.companyName}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Primary Contact">
                <select className={inputClassName} name="primaryContactId" required disabled={!hasContacts}>
                  <option value="">
                    {hasContacts ? "Select contact" : "Create a contact first"}
                  </option>
                  {snapshot.contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.name} ({accountsById.get(contact.accountId)?.companyName ?? "Unknown"})
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Deal Name">
                <input className={inputClassName} name="name" required />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Stage">
                  <select className={inputClassName} name="stage" defaultValue="Cold Signal">
                    {PIPELINE_STAGES.map((stage) => (
                      <option key={stage} value={stage}>
                        {stage}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Owner">
                  <input className={inputClassName} name="ownerName" />
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="ARR Opportunity">
                  <input className={inputClassName} name="arrOpportunity" type="number" min="0" />
                </Field>
                <Field label="Estimated Leak">
                  <input className={inputClassName} name="estimatedLeak" type="number" min="0" />
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Pain Score">
                  <input className={inputClassName} name="painScore" type="number" min="0" max="100" defaultValue="50" />
                </Field>
                <Field label="Engagement Score">
                  <input className={inputClassName} name="engagementScore" type="number" min="0" max="100" />
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="ICP Fit">
                  <input className={inputClassName} name="icpFitScore" type="number" min="0" max="100" />
                </Field>
                <Field label="Authority">
                  <input className={inputClassName} name="authorityLevel" type="number" min="1" max="5" defaultValue="3" />
                </Field>
                <Field label="Time in Stage">
                  <input className={inputClassName} name="timeInStageDays" type="number" min="0" />
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Campaign Source">
                  <input className={inputClassName} name="source" />
                </Field>
                <Field label="Outbound Cost">
                  <input className={inputClassName} name="outboundCost" type="number" min="0" />
                </Field>
              </div>
              <Field label="Next Action">
                <textarea className={textareaClassName} name="nextAction" rows={3} />
              </Field>
              <SubmitButton label="Create Deal" disabled={!hasAccounts || !hasContacts} />
            </form>
          </FormCard>

          <FormCard
            title="Signal and Diagnostic Capture"
            subtitle="Log new outbound signal and the diagnostic math that follows."
          >
            <div className="grid gap-5">
              <form action={createCampaignSignalAction} className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">
                  Campaign Signal
                </p>
                <Field label="Account">
                  <select className={inputClassName} name="accountId" required disabled={!hasAccounts}>
                    <option value="">
                      {hasAccounts ? "Select account" : "Create an account first"}
                    </option>
                    {snapshot.accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.companyName}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Contact">
                  <select className={inputClassName} name="contactId" required disabled={!hasContacts}>
                    <option value="">
                      {hasContacts ? "Select contact" : "Create a contact first"}
                    </option>
                    {snapshot.contacts.map((contact) => (
                      <option key={contact.id} value={contact.id}>
                        {contact.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Campaign Name">
                    <input className={inputClassName} name="campaignName" required />
                  </Field>
                  <Field label="Email Step">
                    <input className={inputClassName} name="emailStep" type="number" min="1" defaultValue="1" />
                  </Field>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Reply Sentiment">
                    <input className={inputClassName} name="replySentiment" />
                  </Field>
                  <Field label="AI Classification">
                    <select className={inputClassName} name="aiClassification" defaultValue="Interested">
                      <option value="Interested">Interested</option>
                      <option value="Send Info">Send Info</option>
                      <option value="Budget Objection">Budget Objection</option>
                      <option value="Timing Objection">Timing Objection</option>
                      <option value="Referral">Referral</option>
                      <option value="Wrong Person">Wrong Person</option>
                      <option value="Hostile">Hostile</option>
                    </select>
                  </Field>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className={checkboxClassName}>
                    <input name="opened" type="checkbox" />
                    <span>Opened</span>
                  </label>
                  <label className={checkboxClassName}>
                    <input name="clicked" type="checkbox" />
                    <span>Clicked</span>
                  </label>
                  <label className={checkboxClassName}>
                    <input name="replied" type="checkbox" />
                    <span>Replied</span>
                  </label>
                </div>
                <Field label="Time to First Response (hours)">
                  <input className={inputClassName} name="timeToFirstResponseHours" type="number" min="0" />
                </Field>
                <SubmitButton label="Log Signal" disabled={!hasAccounts || !hasContacts} />
              </form>

              <form action={createDiagnosticAction} className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">
                  Diagnostic Capture
                </p>
                <Field label="Account">
                  <select className={inputClassName} name="accountId" required disabled={!hasAccounts}>
                    <option value="">
                      {hasAccounts ? "Select account" : "Create an account first"}
                    </option>
                    {snapshot.accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.companyName}
                      </option>
                    ))}
                  </select>
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Calculated Leak">
                    <input className={inputClassName} name="calculatedLeak" type="number" min="0" />
                  </Field>
                  <Field label="Pain Level (1-10)">
                    <input className={inputClassName} name="selfReportedPainLevel" type="number" min="1" max="10" defaultValue="5" />
                  </Field>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Monthly Leads">
                    <input className={inputClassName} name="monthlyLeads" type="number" min="0" />
                  </Field>
                  <Field label="Conversion Rate %">
                    <input className={inputClassName} name="conversionRate" type="number" min="0" step="0.1" />
                  </Field>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Time on Page (sec)">
                    <input className={inputClassName} name="timeOnPageSeconds" type="number" min="0" />
                  </Field>
                  <Field label="Scroll Depth %">
                    <input className={inputClassName} name="scrollDepthPercent" type="number" min="0" max="100" />
                  </Field>
                </div>
                <Field label="Desired Outcome">
                  <textarea className={textareaClassName} name="desiredOutcome" rows={2} required />
                </Field>
                <Field label="Calculator Notes">
                  <input className={inputClassName} name="calculatorNotes" />
                </Field>
                <label className={checkboxClassName}>
                  <input name="booked" type="checkbox" />
                  <span>Booked call during diagnostic</span>
                </label>
                <SubmitButton label="Log Diagnostic" disabled={!hasAccounts} />
              </form>
            </div>
          </FormCard>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="glass-card rounded-[2rem] p-6">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-slate-500">
            Live Deal Desk
          </p>
          <h2 className="mt-2 text-2xl font-semibold">Update stage and next action</h2>
          <div className="mt-5 space-y-4">
            {snapshot.deals.length === 0 ? (
              <EmptyState message="No deals yet. Create the first deal to start moving pipeline." />
            ) : (
              snapshot.deals.map((deal) => (
                <form
                  key={deal.id}
                  action={updateDealStageAction}
                  className="rounded-3xl border border-white/70 bg-white/75 p-4"
                >
                  <input name="dealId" type="hidden" value={deal.id} />
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{deal.name}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {accountsById.get(deal.accountId)?.companyName ?? "Unknown account"} •{" "}
                        {formatCurrency(deal.arrOpportunity)} ARR •{" "}
                        {formatCurrency(deal.weightedRevenue ?? 0)} weighted
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-900 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-white">
                      {deal.stage}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3">
                    <Field label="Stage">
                      <select className={inputClassName} name="stage" defaultValue={deal.stage}>
                        {PIPELINE_STAGES.map((stage) => (
                          <option key={stage} value={stage}>
                            {stage}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Time in Stage (days)">
                        <input
                          className={inputClassName}
                          name="timeInStageDays"
                          type="number"
                          min="0"
                          defaultValue={deal.timeInStageDays}
                        />
                      </Field>
                      <Field label="Primary Contact">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                          {contactsById.get(deal.primaryContactId)?.name ?? "Unknown contact"}
                        </div>
                      </Field>
                    </div>
                    <Field label="Next Action">
                      <textarea
                        className={textareaClassName}
                        name="nextAction"
                        rows={2}
                        defaultValue={deal.nextAction}
                      />
                    </Field>
                  </div>
                  <div className="mt-4">
                    <SubmitButton label="Update Deal" />
                  </div>
                </form>
              ))
            )}
          </div>
        </div>

        <div className="glass-card rounded-[2rem] p-6">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-slate-500">
            Automation Builder
          </p>
          <h2 className="mt-2 text-2xl font-semibold">Add routing rules</h2>
          <form action={createAutomationRuleAction} className="mt-5 grid gap-3">
            <Field label="Trigger">
              <input className={inputClassName} name="triggerName" required />
            </Field>
            <Field label="Action">
              <textarea className={textareaClassName} name="actionName" rows={3} required />
            </Field>
            <Field label="Status">
              <select className={inputClassName} name="status" defaultValue="Active">
                <option value="Active">Active</option>
                <option value="Draft">Draft</option>
              </select>
            </Field>
            <SubmitButton label="Add Rule" />
          </form>
        </div>
      </div>
    </section>
  );
}

function FormCard(props: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/70 bg-white/75 p-5">
      <p className="text-lg font-semibold text-slate-900">{props.title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-600">{props.subtitle}</p>
      <div className="mt-4">{props.children}</div>
    </section>
  );
}

function Field(props: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-500">
        {props.label}
      </span>
      {props.children}
    </label>
  );
}

function SubmitButton(props: { label: string; disabled?: boolean }) {
  return (
    <button
      className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      disabled={props.disabled}
      type="submit"
    >
      {props.label}
    </button>
  );
}

function EmptyState(props: { message: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm leading-6 text-slate-600">
      {props.message}
    </div>
  );
}

const inputClassName =
  "w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-teal-600";

const textareaClassName =
  "w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-teal-600";

const checkboxClassName =
  "flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700";
