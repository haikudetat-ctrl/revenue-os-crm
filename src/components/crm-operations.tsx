"use client";

import { useState, type ReactNode } from "react";
import {
  createAccountAction,
  createAutomationRuleAction,
  createCampaignSignalAction,
  createContactAction,
  createDealAction,
  createDiagnosticAction,
  updateAccountAction,
  updateContactAction,
  updateDealStageAction,
} from "@/app/actions";
import { Account, Contact, CrmSnapshot, Deal, PIPELINE_STAGES } from "@/lib/types";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

type ModalState =
  | { type: "account" }
  | { type: "contact" }
  | { type: "deal" }
  | { type: "signal" }
  | { type: "diagnostic" }
  | { type: "automation" }
  | { type: "accountEdit"; accountId: string }
  | { type: "contactEdit"; contactId: string }
  | { type: "dealUpdate"; dealId: string }
  | null;

export function CrmOperations({ snapshot }: { snapshot: CrmSnapshot }) {
  const [activeModal, setActiveModal] = useState<ModalState>(null);
  const hasAccounts = snapshot.accounts.length > 0;
  const hasContacts = snapshot.contacts.length > 0;
  const accountsById = new Map(snapshot.accounts.map((account) => [account.id, account]));
  const contactsById = new Map(snapshot.contacts.map((contact) => [contact.id, contact]));
  const selectedDeal =
    activeModal?.type === "dealUpdate"
      ? snapshot.deals.find((deal) => deal.id === activeModal.dealId) ?? null
      : null;
  const selectedAccount =
    activeModal?.type === "accountEdit"
      ? snapshot.accounts.find((account) => account.id === activeModal.accountId) ?? null
      : null;
  const selectedContact =
    activeModal?.type === "contactEdit"
      ? snapshot.contacts.find((contact) => contact.id === activeModal.contactId) ?? null
      : null;
  const recentAccounts = snapshot.accounts.slice(0, 3);
  const recentContacts = snapshot.contacts.slice(0, 3);

  return (
    <>
      <section
        id="workspace"
        className="grid scroll-mt-32 gap-6 xl:grid-cols-[1.25fr_0.95fr]"
      >
        <div className="glass-card rounded-[2rem] p-6 sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-slate-500">
                Workspace
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Quick capture, not wall-to-wall forms</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-600">
              Launch the form you need, submit it, and return to the operating view. The
              homepage stays focused on signal review instead of data entry.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <ActionLaunchCard
              title="New Account"
              description="Create the math layer for a company."
              status="Always available"
              onOpen={() => setActiveModal({ type: "account" })}
            />
            <ActionLaunchCard
              title="New Contact"
              description="Attach a decision-maker to an account, or create the account inline."
              status={hasAccounts ? "Existing account optional" : "Inline account creation ready"}
              onOpen={() => setActiveModal({ type: "contact" })}
            />
            <ActionLaunchCard
              title="New Deal"
              description="Open a pipeline record, with account and contact created inline if needed."
              status={
                hasAccounts || hasContacts
                  ? "Existing layers optional"
                  : "Full inline setup ready"
              }
              onOpen={() => setActiveModal({ type: "deal" })}
            />
            <ActionLaunchCard
              title="Log Signal"
              description="Capture opens, clicks, replies, and create missing account/contact inline."
              status={
                hasAccounts || hasContacts
                  ? "Existing layers optional"
                  : "Full inline setup ready"
              }
              onOpen={() => setActiveModal({ type: "signal" })}
            />
            <ActionLaunchCard
              title="Log Diagnostic"
              description="Store calculator inputs and create the account inline if it is missing."
              status={hasAccounts ? "Existing account optional" : "Inline account creation ready"}
              onOpen={() => setActiveModal({ type: "diagnostic" })}
            />
            <ActionLaunchCard
              title="Add Automation"
              description="Create routing rules that reduce manual work."
              status="Always available"
              onOpen={() => setActiveModal({ type: "automation" })}
            />
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <section className="glass-card rounded-[2rem] p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-slate-500">
                  Deal Desk
                </p>
                <h2 className="mt-2 text-2xl font-semibold">Live pipeline queue</h2>
              </div>
              <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                {snapshot.deals.length} active
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {snapshot.deals.length === 0 ? (
                <EmptyState message="No deals yet. Create the first deal to start moving pipeline." />
              ) : (
                snapshot.deals.slice(0, 5).map((deal) => (
                  <article
                    key={deal.id}
                    className="rounded-3xl border border-white/70 bg-white/75 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{deal.name}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          {accountsById.get(deal.accountId)?.companyName ?? "Unknown account"} •{" "}
                          {formatCurrency(deal.arrOpportunity)} ARR •{" "}
                          {formatCurrency(deal.weightedRevenue ?? 0)} weighted
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-900 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-white">
                        {deal.stage}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm leading-6 text-slate-600">
                        {contactsById.get(deal.primaryContactId)?.name ?? "Unknown contact"} •{" "}
                        {deal.timeInStageDays} days in stage
                      </p>
                      <button
                        className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
                        onClick={() => setActiveModal({ type: "dealUpdate", dealId: deal.id })}
                        type="button"
                      >
                        Update Deal
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="glass-card rounded-[2rem] p-6">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-slate-500">
              Readiness
            </p>
            <h2 className="mt-2 text-2xl font-semibold">What the system can support right now</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <MetricTile
                label="Accounts"
                value={`${snapshot.accounts.length}`}
                helper="Math layers available"
              />
              <MetricTile
                label="Contacts"
                value={`${snapshot.contacts.length}`}
                helper="Decision roles mapped"
              />
              <MetricTile
                label="Signals"
                value={`${snapshot.campaignSignals.length}`}
                helper="Signal records logged"
              />
              <MetricTile
                label="Rules"
                value={`${snapshot.automationRules.length}`}
                helper="Automation routes active"
              />
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <section className="rounded-3xl border border-white/70 bg-white/75 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-500">
                      Recent Accounts
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Enrich quick-created company records without leaving Workspace.
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700">
                    {snapshot.accounts.length}
                  </span>
                </div>
                <div className="mt-4 space-y-3">
                  {recentAccounts.length === 0 ? (
                    <EmptyState message="No accounts yet. Create one, then edit it here as more context comes in." />
                  ) : (
                    recentAccounts.map((account) => (
                      <RecordQuickEditCard
                        key={account.id}
                        detail={`${account.industryVertical} • ${account.location || "No location yet"}`}
                        title={account.companyName}
                      >
                        <button
                          className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
                          onClick={() =>
                            setActiveModal({ type: "accountEdit", accountId: account.id })
                          }
                          type="button"
                        >
                          Edit Account
                        </button>
                      </RecordQuickEditCard>
                    ))
                  )}
                </div>
              </section>

              <section className="rounded-3xl border border-white/70 bg-white/75 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-500">
                      Recent Contacts
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Fill in authority, sentiment, and role details as they become clear.
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700">
                    {snapshot.contacts.length}
                  </span>
                </div>
                <div className="mt-4 space-y-3">
                  {recentContacts.length === 0 ? (
                    <EmptyState message="No contacts yet. Create one, then refine the record here." />
                  ) : (
                    recentContacts.map((contact) => (
                      <RecordQuickEditCard
                        key={contact.id}
                        detail={`${accountsById.get(contact.accountId)?.companyName ?? "Unknown account"} • ${contact.title || "No title yet"}`}
                        title={contact.name}
                      >
                        <button
                          className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
                          onClick={() =>
                            setActiveModal({ type: "contactEdit", contactId: contact.id })
                          }
                          type="button"
                        >
                          Edit Contact
                        </button>
                      </RecordQuickEditCard>
                    ))
                  )}
                </div>
              </section>
            </div>

            <div className="mt-5 space-y-3">
              {snapshot.automationRules.length === 0 ? (
                <EmptyState message="No automation rules yet. Add one when you are ready to automate routing." />
              ) : (
                snapshot.automationRules.slice(0, 3).map((rule) => (
                  <div
                    key={rule.id}
                    className="rounded-2xl border border-white/70 bg-white/75 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-slate-900">{rule.trigger}</p>
                      <span
                        className={`rounded-full px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.18em] ${
                          rule.status === "Active"
                            ? "bg-emerald-100 text-emerald-900"
                            : "bg-amber-100 text-amber-900"
                        }`}
                      >
                        {rule.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{rule.action}</p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </section>

      <ModalShell
        isOpen={activeModal !== null}
        title={getModalTitle(activeModal, selectedDeal, selectedAccount, selectedContact)}
        subtitle={getModalSubtitle(activeModal)}
        onClose={() => setActiveModal(null)}
      >
        {activeModal?.type === "account" ? <AccountForm /> : null}
        {activeModal?.type === "contact" ? (
          <ContactForm hasAccounts={hasAccounts} snapshot={snapshot} />
        ) : null}
        {activeModal?.type === "deal" ? (
          <DealForm hasAccounts={hasAccounts} hasContacts={hasContacts} snapshot={snapshot} />
        ) : null}
        {activeModal?.type === "signal" ? (
          <SignalForm hasAccounts={hasAccounts} hasContacts={hasContacts} snapshot={snapshot} />
        ) : null}
        {activeModal?.type === "diagnostic" ? (
          <DiagnosticForm hasAccounts={hasAccounts} snapshot={snapshot} />
        ) : null}
        {activeModal?.type === "automation" ? <AutomationRuleForm /> : null}
        {activeModal?.type === "accountEdit" ? (
          selectedAccount ? (
            <AccountEditForm account={selectedAccount} />
          ) : (
            <EmptyState message="That account is no longer available. Refresh and try again." />
          )
        ) : null}
        {activeModal?.type === "contactEdit" ? (
          selectedContact ? (
            <ContactEditForm contact={selectedContact} snapshot={snapshot} />
          ) : (
            <EmptyState message="That contact is no longer available. Refresh and try again." />
          )
        ) : null}
        {activeModal?.type === "dealUpdate" ? (
          selectedDeal ? (
            <DealUpdateForm
              accountsById={accountsById}
              contactsById={contactsById}
              deal={selectedDeal}
            />
          ) : (
            <EmptyState message="That deal is no longer available. Refresh and try again." />
          )
        ) : null}
      </ModalShell>
    </>
  );
}

function getModalTitle(
  activeModal: ModalState,
  selectedDeal: Deal | null,
  selectedAccount: Account | null,
  selectedContact: Contact | null,
) {
  if (!activeModal) {
    return "";
  }

  switch (activeModal.type) {
    case "account":
      return "Create Account";
    case "contact":
      return "Create Contact";
    case "deal":
      return "Create Deal";
    case "signal":
      return "Log Campaign Signal";
    case "diagnostic":
      return "Log Diagnostic";
    case "automation":
      return "Add Automation Rule";
    case "accountEdit":
      return selectedAccount ? `Edit ${selectedAccount.companyName}` : "Edit Account";
    case "contactEdit":
      return selectedContact ? `Edit ${selectedContact.name}` : "Edit Contact";
    case "dealUpdate":
      return selectedDeal ? `Update ${selectedDeal.name}` : "Update Deal";
    default:
      return "";
  }
}

function getModalSubtitle(activeModal: ModalState) {
  if (!activeModal) {
    return "";
  }

  switch (activeModal.type) {
    case "account":
      return "Set the revenue math and context for a company.";
    case "contact":
      return "Add a stakeholder and create the account inline if it does not exist yet.";
    case "deal":
      return "Create the deal now, and create the missing account or contact layers in the same submit.";
    case "signal":
      return "Track signal intensity and create any missing account or contact in the same submit.";
    case "diagnostic":
      return "Store leak math now, and create the account inline if you have not created it yet.";
    case "automation":
      return "Define the trigger and routing behavior.";
    case "accountEdit":
      return "Expand the math layer as you learn more about the account.";
    case "contactEdit":
      return "Fill in decision-role context without opening a separate page.";
    case "dealUpdate":
      return "Move the deal forward without leaving the dashboard.";
    default:
      return "";
  }
}

function AccountForm() {
  return (
    <form action={createAccountAction} className="grid gap-3">
      <ReturnPathField />
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
          <select className={inputClassName} defaultValue="Paid" name="acquisitionModel">
            <option value="Paid">Paid</option>
            <option value="Referral">Referral</option>
            <option value="Organic">Organic</option>
          </select>
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Estimated LTV">
          <input className={inputClassName} min="0" name="estimatedLtv" type="number" />
        </Field>
        <Field label="Lead Volume / Month">
          <input className={inputClassName} min="0" name="estimatedLeadVolume" type="number" />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Conversion Rate %">
          <input
            className={inputClassName}
            min="0"
            name="estimatedConversionRate"
            step="0.1"
            type="number"
          />
        </Field>
        <Field label="Revenue Leak %">
          <input
            className={inputClassName}
            min="0"
            name="estimatedRevenueLeakPercent"
            step="0.1"
            type="number"
          />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Monthly Revenue Leak $">
          <input
            className={inputClassName}
            min="0"
            name="estimatedMonthlyRevenueLeak"
            type="number"
          />
        </Field>
        <Field label="Employee Count">
          <input className={inputClassName} min="0" name="employeeCount" type="number" />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Signal Score">
          <input className={inputClassName} max="100" min="0" name="signalScore" type="number" />
        </Field>
        <Field label="ICP Fit Score">
          <input className={inputClassName} max="100" min="0" name="icpFitScore" type="number" />
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
        <select className={inputClassName} defaultValue="Cold Signal" name="beliefStage">
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
  );
}

function AccountEditForm({ account }: { account: Account }) {
  return (
    <form action={updateAccountAction} className="grid gap-3">
      <ReturnPathField />
      <input name="accountId" type="hidden" value={account.id} />
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
        <p className="font-semibold text-slate-900">{account.companyName}</p>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          {account.industryVertical} • {account.location || "No location yet"}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Company Name">
          <input className={inputClassName} defaultValue={account.companyName} name="companyName" required />
        </Field>
        <Field label="Industry Vertical">
          <input
            className={inputClassName}
            defaultValue={account.industryVertical}
            name="industryVertical"
            required
          />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Revenue Band">
          <input className={inputClassName} defaultValue={account.revenueBand} name="revenueBand" required />
        </Field>
        <Field label="Location">
          <input className={inputClassName} defaultValue={account.location} name="location" required />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Acquisition Model">
          <select className={inputClassName} defaultValue={account.acquisitionModel} name="acquisitionModel">
            <option value="Paid">Paid</option>
            <option value="Referral">Referral</option>
            <option value="Organic">Organic</option>
          </select>
        </Field>
        <Field label="Employee Count">
          <input
            className={inputClassName}
            defaultValue={account.employeeCount}
            min="0"
            name="employeeCount"
            type="number"
          />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Estimated LTV">
          <input
            className={inputClassName}
            defaultValue={account.estimatedLtv}
            min="0"
            name="estimatedLtv"
            type="number"
          />
        </Field>
        <Field label="Lead Volume / Month">
          <input
            className={inputClassName}
            defaultValue={account.estimatedLeadVolume}
            min="0"
            name="estimatedLeadVolume"
            type="number"
          />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Conversion Rate %">
          <input
            className={inputClassName}
            defaultValue={account.estimatedConversionRate}
            min="0"
            name="estimatedConversionRate"
            step="0.1"
            type="number"
          />
        </Field>
        <Field label="Revenue Leak %">
          <input
            className={inputClassName}
            defaultValue={account.estimatedRevenueLeakPercent}
            min="0"
            name="estimatedRevenueLeakPercent"
            step="0.1"
            type="number"
          />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Monthly Revenue Leak $">
          <input
            className={inputClassName}
            defaultValue={account.estimatedMonthlyRevenueLeak}
            min="0"
            name="estimatedMonthlyRevenueLeak"
            type="number"
          />
        </Field>
        <Field label="Signal Score">
          <input
            className={inputClassName}
            defaultValue={account.signalScore}
            max="100"
            min="0"
            name="signalScore"
            type="number"
          />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="ICP Fit Score">
          <input
            className={inputClassName}
            defaultValue={account.icpFitScore}
            max="100"
            min="0"
            name="icpFitScore"
            type="number"
          />
        </Field>
        <Field label="Belief Stage">
          <select className={inputClassName} defaultValue={account.beliefStage} name="beliefStage">
            {PIPELINE_STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Booking Software">
          <input className={inputClassName} defaultValue={account.bookingSoftware} name="bookingSoftware" />
        </Field>
        <Field label="CRM Used">
          <input className={inputClassName} defaultValue={account.crmUsed} name="crmUsed" />
        </Field>
      </div>
      <Field label="Tech Stack (comma separated)">
        <input
          className={inputClassName}
          defaultValue={account.techStack.join(", ")}
          name="techStack"
        />
      </Field>
      <Field label="Ad Channels (comma separated)">
        <input
          className={inputClassName}
          defaultValue={account.adChannelsUsed.join(", ")}
          name="adChannelsUsed"
        />
      </Field>
      <Field label="Owner Persona Type">
        <input className={inputClassName} defaultValue={account.ownerPersonaType} name="ownerPersonaType" />
      </Field>
      <Field label="Friction Summary">
        <textarea
          className={textareaClassName}
          defaultValue={account.frictionSummary}
          name="frictionSummary"
          rows={3}
        />
      </Field>
      <SubmitButton label="Update Account" />
    </form>
  );
}

function ContactForm({
  snapshot,
  hasAccounts,
}: {
  snapshot: CrmSnapshot;
  hasAccounts: boolean;
}) {
  return (
    <form action={createContactAction} className="grid gap-3">
      <ReturnPathField />
      <Field label="Account">
        <select className={inputClassName} name="accountId">
          <option value="">
            {hasAccounts ? "Select existing account (optional)" : "No account yet, create one below"}
          </option>
          {snapshot.accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.companyName}
            </option>
          ))}
        </select>
      </Field>
      <InlineAssistCard
        title="No account yet?"
        description="Leave the account selector empty and fill these four fields. The account will be created automatically before the contact."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Company Name">
            <input className={inputClassName} name="newAccountCompanyName" />
          </Field>
          <Field label="Industry">
            <input className={inputClassName} name="newAccountIndustryVertical" />
          </Field>
          <Field label="Revenue Band">
            <input className={inputClassName} name="newAccountRevenueBand" />
          </Field>
          <Field label="Location">
            <input className={inputClassName} name="newAccountLocation" />
          </Field>
        </div>
      </InlineAssistCard>
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
          <input className={inputClassName} name="email" required type="email" />
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
          <input
            className={inputClassName}
            defaultValue="3"
            max="5"
            min="1"
            name="authorityLevel"
            type="number"
          />
        </Field>
        <Field label="Influence Level (1-5)">
          <input
            className={inputClassName}
            defaultValue="3"
            max="5"
            min="1"
            name="influenceLevel"
            type="number"
          />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Engagement Score">
          <input className={inputClassName} max="100" min="0" name="engagementScore" type="number" />
        </Field>
        <Field label="Response Type">
          <select className={inputClassName} defaultValue="Neutral" name="responseType">
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
      <SubmitButton label="Create Contact" />
    </form>
  );
}

function ContactEditForm({
  contact,
  snapshot,
}: {
  contact: Contact;
  snapshot: CrmSnapshot;
}) {
  return (
    <form action={updateContactAction} className="grid gap-3">
      <ReturnPathField />
      <input name="contactId" type="hidden" value={contact.id} />
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
        <p className="font-semibold text-slate-900">{contact.name}</p>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          {snapshot.accounts.find((account) => account.id === contact.accountId)?.companyName ??
            "Unknown account"}{" "}
          • {contact.title || "No title yet"}
        </p>
      </div>
      <Field label="Account">
        <select className={inputClassName} defaultValue={contact.accountId} name="accountId">
          {snapshot.accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.companyName}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name">
          <input className={inputClassName} defaultValue={contact.name} name="name" required />
        </Field>
        <Field label="Title">
          <input className={inputClassName} defaultValue={contact.title} name="title" />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Email">
          <input className={inputClassName} defaultValue={contact.email} name="email" required type="email" />
        </Field>
        <Field label="Phone">
          <input className={inputClassName} defaultValue={contact.phone} name="phone" />
        </Field>
      </div>
      <Field label="LinkedIn">
        <input className={inputClassName} defaultValue={contact.linkedIn} name="linkedIn" type="url" />
      </Field>
      <Field label="Role in Decision">
        <input className={inputClassName} defaultValue={contact.roleInDecision} name="roleInDecision" />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Authority Level (1-5)">
          <input
            className={inputClassName}
            defaultValue={contact.authorityLevel}
            max="5"
            min="1"
            name="authorityLevel"
            type="number"
          />
        </Field>
        <Field label="Influence Level (1-5)">
          <input
            className={inputClassName}
            defaultValue={contact.influenceLevel}
            max="5"
            min="1"
            name="influenceLevel"
            type="number"
          />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Engagement Score">
          <input
            className={inputClassName}
            defaultValue={contact.engagementScore}
            max="100"
            min="0"
            name="engagementScore"
            type="number"
          />
        </Field>
        <Field label="Response Type">
          <select className={inputClassName} defaultValue={contact.responseType} name="responseType">
            <option value="Positive">Positive</option>
            <option value="Neutral">Neutral</option>
            <option value="Objection">Objection</option>
            <option value="Not Now">Not Now</option>
          </select>
        </Field>
      </div>
      <Field label="Sentiment Tag">
        <input className={inputClassName} defaultValue={contact.sentimentTag} name="sentimentTag" />
      </Field>
      <SubmitButton label="Update Contact" />
    </form>
  );
}

function DealForm({
  snapshot,
  hasAccounts,
  hasContacts,
}: {
  snapshot: CrmSnapshot;
  hasAccounts: boolean;
  hasContacts: boolean;
}) {
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [selectedPrimaryContactId, setSelectedPrimaryContactId] = useState("");
  const [newAccountCompanyName, setNewAccountCompanyName] = useState("");
  const [newContactName, setNewContactName] = useState("");
  const [dealName, setDealName] = useState("");
  const [manualDealName, setManualDealName] = useState(false);

  const filteredContacts = selectedAccountId
    ? snapshot.contacts.filter((contact) => contact.accountId === selectedAccountId)
    : snapshot.contacts;
  const safeSelectedPrimaryContactId = filteredContacts.some(
    (contact) => contact.id === selectedPrimaryContactId,
  )
    ? selectedPrimaryContactId
    : "";
  const suggestedDealName =
    !selectedAccountId &&
    !safeSelectedPrimaryContactId &&
    newAccountCompanyName &&
    newContactName
      ? `${newAccountCompanyName} + ${newContactName}`
      : "";
  const displayDealName = manualDealName ? dealName : suggestedDealName;

  return (
    <form action={createDealAction} className="grid gap-3">
      <ReturnPathField />
      <Field label="Account">
        <select
          className={inputClassName}
          name="accountId"
          onChange={(event) => setSelectedAccountId(event.target.value)}
          value={selectedAccountId}
        >
          <option value="">
            {hasAccounts ? "Select existing account (optional)" : "No account yet, create one below"}
          </option>
          {snapshot.accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.companyName}
            </option>
          ))}
        </select>
      </Field>
      <InlineAssistCard
        title="Need to create the account?"
        description="If you leave the account selector blank, these four fields become the new account."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Company Name">
            <input
              className={inputClassName}
              name="newAccountCompanyName"
              onChange={(event) => setNewAccountCompanyName(event.target.value)}
              value={newAccountCompanyName}
            />
          </Field>
          <Field label="Industry">
            <input className={inputClassName} name="newAccountIndustryVertical" />
          </Field>
          <Field label="Revenue Band">
            <input className={inputClassName} name="newAccountRevenueBand" />
          </Field>
          <Field label="Location">
            <input className={inputClassName} name="newAccountLocation" />
          </Field>
        </div>
      </InlineAssistCard>
      <Field label="Primary Contact">
        <select
          className={inputClassName}
          name="primaryContactId"
          onChange={(event) => setSelectedPrimaryContactId(event.target.value)}
          value={safeSelectedPrimaryContactId}
        >
          <option value="">
            {hasContacts
              ? selectedAccountId
                ? filteredContacts.length > 0
                  ? "Select contact for this account (optional)"
                  : "No contacts on this account, create one below"
                : "Select existing contact (optional)"
              : "No contact yet, create one below"}
          </option>
          {filteredContacts.map((contact) => (
            <option key={contact.id} value={contact.id}>
              {contact.name}
            </option>
          ))}
        </select>
      </Field>
      <InlineAssistCard
        title="Need to create the contact?"
        description="If you leave the contact selector blank, add the minimum contact info here and the deal will create it automatically."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Contact Name">
            <input
              className={inputClassName}
              name="newContactName"
              onChange={(event) => setNewContactName(event.target.value)}
              value={newContactName}
            />
          </Field>
          <Field label="Contact Email">
            <input className={inputClassName} name="newContactEmail" type="email" />
          </Field>
          <Field label="Title">
            <input className={inputClassName} name="newContactTitle" />
          </Field>
          <Field label="Phone">
            <input className={inputClassName} name="newContactPhone" />
          </Field>
        </div>
      </InlineAssistCard>
      <Field label="Deal Name">
        <input
          className={inputClassName}
          name="name"
          onChange={(event) => {
            const nextValue = event.target.value;
            if (suggestedDealName && nextValue === suggestedDealName) {
              setManualDealName(false);
              setDealName("");
              return;
            }

            if (!suggestedDealName && nextValue === "") {
              setManualDealName(false);
              setDealName("");
              return;
            }

            setDealName(nextValue);
            setManualDealName(true);
          }}
          required
          value={displayDealName}
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Stage">
          <select className={inputClassName} defaultValue="Cold Signal" name="stage">
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
          <input className={inputClassName} min="0" name="arrOpportunity" type="number" />
        </Field>
        <Field label="Estimated Leak">
          <input className={inputClassName} min="0" name="estimatedLeak" type="number" />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Pain Score">
          <input
            className={inputClassName}
            defaultValue="50"
            max="100"
            min="0"
            name="painScore"
            type="number"
          />
        </Field>
        <Field label="Engagement Score">
          <input className={inputClassName} max="100" min="0" name="engagementScore" type="number" />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="ICP Fit">
          <input className={inputClassName} max="100" min="0" name="icpFitScore" type="number" />
        </Field>
        <Field label="Authority">
          <input
            className={inputClassName}
            defaultValue="3"
            max="5"
            min="1"
            name="authorityLevel"
            type="number"
          />
        </Field>
        <Field label="Time in Stage">
          <input className={inputClassName} min="0" name="timeInStageDays" type="number" />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Campaign Source">
          <input className={inputClassName} name="source" />
        </Field>
        <Field label="Outbound Cost">
          <input className={inputClassName} min="0" name="outboundCost" type="number" />
        </Field>
      </div>
      <Field label="Next Action">
        <textarea className={textareaClassName} name="nextAction" rows={3} />
      </Field>
      <SubmitButton label="Create Deal" />
    </form>
  );
}

function SignalForm({
  snapshot,
  hasAccounts,
  hasContacts,
}: {
  snapshot: CrmSnapshot;
  hasAccounts: boolean;
  hasContacts: boolean;
}) {
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [selectedContactId, setSelectedContactId] = useState("");
  const filteredContacts = selectedAccountId
    ? snapshot.contacts.filter((contact) => contact.accountId === selectedAccountId)
    : snapshot.contacts;
  const safeSelectedContactId = filteredContacts.some((contact) => contact.id === selectedContactId)
    ? selectedContactId
    : "";

  return (
    <form action={createCampaignSignalAction} className="grid gap-3">
      <ReturnPathField />
      <Field label="Account">
        <select
          className={inputClassName}
          name="accountId"
          onChange={(event) => setSelectedAccountId(event.target.value)}
          value={selectedAccountId}
        >
          <option value="">
            {hasAccounts ? "Select existing account (optional)" : "No account yet, create one below"}
          </option>
          {snapshot.accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.companyName}
            </option>
          ))}
        </select>
      </Field>
      <InlineAssistCard
        title="Need to create the account?"
        description="Leave the selector blank and fill these fields. The account will be created before the signal is logged."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Company Name">
            <input className={inputClassName} name="newAccountCompanyName" />
          </Field>
          <Field label="Industry">
            <input className={inputClassName} name="newAccountIndustryVertical" />
          </Field>
          <Field label="Revenue Band">
            <input className={inputClassName} name="newAccountRevenueBand" />
          </Field>
          <Field label="Location">
            <input className={inputClassName} name="newAccountLocation" />
          </Field>
        </div>
      </InlineAssistCard>
      <Field label="Contact">
        <select
          className={inputClassName}
          name="contactId"
          onChange={(event) => setSelectedContactId(event.target.value)}
          value={safeSelectedContactId}
        >
          <option value="">
            {hasContacts
              ? selectedAccountId
                ? filteredContacts.length > 0
                  ? "Select contact for this account (optional)"
                  : "No contacts on this account, create one below"
                : "Select existing contact (optional)"
              : "No contact yet, create one below"}
          </option>
          {filteredContacts.map((contact) => (
            <option key={contact.id} value={contact.id}>
              {contact.name}
            </option>
          ))}
        </select>
      </Field>
      <InlineAssistCard
        title="Need to create the contact?"
        description="Leave the selector blank and add the minimum contact details here."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Contact Name">
            <input className={inputClassName} name="newContactName" />
          </Field>
          <Field label="Contact Email">
            <input className={inputClassName} name="newContactEmail" type="email" />
          </Field>
          <Field label="Title">
            <input className={inputClassName} name="newContactTitle" />
          </Field>
          <Field label="Phone">
            <input className={inputClassName} name="newContactPhone" />
          </Field>
        </div>
      </InlineAssistCard>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Campaign Name">
          <input className={inputClassName} name="campaignName" required />
        </Field>
        <Field label="Email Step">
          <input
            className={inputClassName}
            defaultValue="1"
            min="1"
            name="emailStep"
            type="number"
          />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Reply Sentiment">
          <input className={inputClassName} name="replySentiment" />
        </Field>
        <Field label="AI Classification">
          <select className={inputClassName} defaultValue="Interested" name="aiClassification">
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
        <input className={inputClassName} min="0" name="timeToFirstResponseHours" type="number" />
      </Field>
      <SubmitButton label="Log Signal" />
    </form>
  );
}

function DiagnosticForm({
  snapshot,
  hasAccounts,
}: {
  snapshot: CrmSnapshot;
  hasAccounts: boolean;
}) {
  const [selectedAccountId, setSelectedAccountId] = useState("");

  return (
    <form action={createDiagnosticAction} className="grid gap-3">
      <ReturnPathField />
      <Field label="Account">
        <select
          className={inputClassName}
          name="accountId"
          onChange={(event) => setSelectedAccountId(event.target.value)}
          value={selectedAccountId}
        >
          <option value="">
            {hasAccounts ? "Select existing account (optional)" : "No account yet, create one below"}
          </option>
          {snapshot.accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.companyName}
            </option>
          ))}
        </select>
      </Field>
      <InlineAssistCard
        title="Need to create the account?"
        description="Leave the selector blank and fill these fields. The account will be created before the diagnostic is saved."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Company Name">
            <input className={inputClassName} name="newAccountCompanyName" />
          </Field>
          <Field label="Industry">
            <input className={inputClassName} name="newAccountIndustryVertical" />
          </Field>
          <Field label="Revenue Band">
            <input className={inputClassName} name="newAccountRevenueBand" />
          </Field>
          <Field label="Location">
            <input className={inputClassName} name="newAccountLocation" />
          </Field>
        </div>
      </InlineAssistCard>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Calculated Leak">
          <input className={inputClassName} min="0" name="calculatedLeak" type="number" />
        </Field>
        <Field label="Pain Level (1-10)">
          <input
            className={inputClassName}
            defaultValue="5"
            max="10"
            min="1"
            name="selfReportedPainLevel"
            type="number"
          />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Monthly Leads">
          <input className={inputClassName} min="0" name="monthlyLeads" type="number" />
        </Field>
        <Field label="Conversion Rate %">
          <input className={inputClassName} min="0" name="conversionRate" step="0.1" type="number" />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Time on Page (sec)">
          <input className={inputClassName} min="0" name="timeOnPageSeconds" type="number" />
        </Field>
        <Field label="Scroll Depth %">
          <input
            className={inputClassName}
            max="100"
            min="0"
            name="scrollDepthPercent"
            type="number"
          />
        </Field>
      </div>
      <Field label="Desired Outcome">
        <textarea className={textareaClassName} name="desiredOutcome" required rows={2} />
      </Field>
      <Field label="Calculator Notes">
        <input className={inputClassName} name="calculatorNotes" />
      </Field>
      <label className={checkboxClassName}>
        <input name="booked" type="checkbox" />
        <span>Booked call during diagnostic</span>
      </label>
      <SubmitButton label="Log Diagnostic" />
    </form>
  );
}

function AutomationRuleForm() {
  return (
    <form action={createAutomationRuleAction} className="grid gap-3">
      <ReturnPathField />
      <Field label="Trigger">
        <input className={inputClassName} name="triggerName" required />
      </Field>
      <Field label="Action">
        <textarea className={textareaClassName} name="actionName" required rows={3} />
      </Field>
      <Field label="Status">
        <select className={inputClassName} defaultValue="Active" name="status">
          <option value="Active">Active</option>
          <option value="Draft">Draft</option>
        </select>
      </Field>
      <SubmitButton label="Add Rule" />
    </form>
  );
}

function DealUpdateForm({
  deal,
  accountsById,
  contactsById,
}: {
  deal: Deal;
  accountsById: Map<string, CrmSnapshot["accounts"][number]>;
  contactsById: Map<string, CrmSnapshot["contacts"][number]>;
}) {
  return (
    <form action={updateDealStageAction} className="grid gap-3">
      <ReturnPathField />
      <input name="dealId" type="hidden" value={deal.id} />
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
        <p className="font-semibold text-slate-900">{deal.name}</p>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          {accountsById.get(deal.accountId)?.companyName ?? "Unknown account"} •{" "}
          {formatCurrency(deal.arrOpportunity)} ARR • {formatCurrency(deal.weightedRevenue ?? 0)}{" "}
          weighted
        </p>
      </div>
      <Field label="Stage">
        <select className={inputClassName} defaultValue={deal.stage} name="stage">
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
            defaultValue={deal.timeInStageDays}
            min="0"
            name="timeInStageDays"
            type="number"
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
          defaultValue={deal.nextAction}
          name="nextAction"
          rows={3}
        />
      </Field>
      <SubmitButton label="Update Deal" />
    </form>
  );
}

function ActionLaunchCard(props: {
  title: string;
  description: string;
  status: string;
  disabled?: boolean;
  onOpen: () => void;
}) {
  return (
    <article className="rounded-3xl border border-white/70 bg-white/75 p-5">
      <p className="text-lg font-semibold text-slate-900">{props.title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{props.description}</p>
      <div className="mt-4 flex items-center justify-between gap-3">
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
            props.disabled ? "bg-amber-100 text-amber-900" : "bg-teal-100 text-teal-900"
          }`}
        >
          {props.status}
        </span>
        <button
          className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={props.disabled}
          onClick={props.onOpen}
          type="button"
        >
          Open Form
        </button>
      </div>
    </article>
  );
}

function RecordQuickEditCard(props: {
  title: string;
  detail: string;
  children: ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-slate-900">{props.title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">{props.detail}</p>
        </div>
        {props.children}
      </div>
    </article>
  );
}

function ModalShell(props: {
  isOpen: boolean;
  title: string;
  subtitle: string;
  children: ReactNode;
  onClose: () => void;
}) {
  if (!props.isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/70 bg-[#fffaf4] shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-slate-500">Input</p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-900">{props.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{props.subtitle}</p>
          </div>
          <button
            aria-label="Close modal"
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900"
            onClick={props.onClose}
            type="button"
          >
            ×
          </button>
        </div>
        <div className="max-h-[calc(100vh-11rem)] overflow-y-auto px-6 py-5">{props.children}</div>
      </div>
    </div>
  );
}

function MetricTile(props: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-500">
        {props.label}
      </p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{props.value}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{props.helper}</p>
    </div>
  );
}

function InlineAssistCard(props: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-4">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-500">
        {props.title}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{props.description}</p>
      <div className="mt-4">{props.children}</div>
    </div>
  );
}

function ReturnPathField() {
  return <input name="redirectTo" type="hidden" value="/workspace" />;
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
