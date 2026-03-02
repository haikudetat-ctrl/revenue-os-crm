"use client";

import { useState, type ReactNode } from "react";
import {
  updateAccountAction,
  updateContactAction,
  updateDealAction,
} from "@/app/actions";
import {
  Account,
  Contact,
  CrmSnapshot,
  Deal,
  PIPELINE_STAGES,
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

type AccountModalState =
  | { type: "view"; accountId: string }
  | { type: "edit"; accountId: string }
  | null;

type ContactModalState =
  | { type: "view"; contactId: string }
  | { type: "edit"; contactId: string }
  | null;

type DealModalState =
  | { type: "view"; dealId: string }
  | { type: "edit"; dealId: string }
  | null;

export function AccountsDirectory({ snapshot }: { snapshot: CrmSnapshot }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("leak");
  const [activeModal, setActiveModal] = useState<AccountModalState>(null);

  const filteredAccounts = snapshot.accounts.filter((account) => {
    const haystack = [
      account.companyName,
      account.industryVertical,
      account.location,
      account.ownerPersonaType,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(searchTerm.trim().toLowerCase());
  });

  const accounts = [...filteredAccounts].sort((left, right) => {
    if (sortBy === "name") {
      return left.companyName.localeCompare(right.companyName);
    }

    if (sortBy === "signal") {
      return right.signalScore - left.signalScore;
    }

    if (sortBy === "icp") {
      return right.icpFitScore - left.icpFitScore;
    }

    return right.estimatedMonthlyRevenueLeak - left.estimatedMonthlyRevenueLeak;
  });

  const selectedAccount =
    activeModal?.accountId
      ? snapshot.accounts.find((account) => account.id === activeModal.accountId) ?? null
      : null;

  return (
    <>
      <section className="glass-card rounded-[2rem] p-6 sm:p-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-slate-500">
              Account Directory
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Search and sort the math layer</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              Every account record can be inspected or edited in place. Use this page to
              review leak exposure, operating context, and fit without leaving the route.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className={inputClassName}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search company, industry, location..."
              value={searchTerm}
            />
            <select
              className={inputClassName}
              onChange={(event) => setSortBy(event.target.value)}
              value={sortBy}
            >
              <option value="leak">Sort: Highest Leak</option>
              <option value="signal">Sort: Highest Signal</option>
              <option value="icp">Sort: Highest ICP</option>
              <option value="name">Sort: A-Z</option>
            </select>
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          {accounts.length === 0 ? (
            <DirectoryEmptyState message="No accounts match this search yet." />
          ) : (
            accounts.map((account) => (
              <article
                key={account.id}
                className="rounded-3xl border border-white/70 bg-white/75 p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xl font-semibold text-slate-900">{account.companyName}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {account.industryVertical} • {account.location} •{" "}
                      {account.acquisitionModel} acquisition
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      className={secondaryButtonClassName}
                      onClick={() => setActiveModal({ type: "view", accountId: account.id })}
                      type="button"
                    >
                      View
                    </button>
                    <button
                      className={primaryButtonClassName}
                      onClick={() => setActiveModal({ type: "edit", accountId: account.id })}
                      type="button"
                    >
                      Edit
                    </button>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <MetricChip label="Leak / Month" value={formatCurrency(account.estimatedMonthlyRevenueLeak)} />
                  <MetricChip label="Signal" value={`${account.signalScore}/100`} />
                  <MetricChip label="ICP Fit" value={`${account.icpFitScore}/100`} />
                  <MetricChip label="LTV" value={formatCurrency(account.estimatedLtv)} />
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <InlinePanel
                    label="Friction"
                    value={account.frictionSummary || "No friction recorded yet."}
                  />
                  <InlinePanel
                    label="System Context"
                    value={`${account.techStack.join(", ") || "No tech stack"} • ${account.bookingSoftware || "No booking software"} • ${account.crmUsed || "No CRM noted"}`}
                  />
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <RecordModal
        isOpen={activeModal !== null}
        onClose={() => setActiveModal(null)}
        subtitle={
          activeModal?.type === "edit"
            ? "Edit the account record without leaving the page."
            : "Inspect the account math and context in one place."
        }
        title={
          activeModal?.type === "edit"
            ? `Edit ${selectedAccount?.companyName ?? "Account"}`
            : selectedAccount?.companyName ?? "Account"
        }
      >
        {activeModal?.type === "view" && selectedAccount ? (
          <AccountViewPanel account={selectedAccount} />
        ) : null}
        {activeModal?.type === "edit" && selectedAccount ? (
          <AccountEditPanel account={selectedAccount} redirectTo="/accounts" />
        ) : null}
      </RecordModal>
    </>
  );
}

export function ContactsDirectory({ snapshot }: { snapshot: CrmSnapshot }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("engagement");
  const [responseFilter, setResponseFilter] = useState("all");
  const [activeModal, setActiveModal] = useState<ContactModalState>(null);
  const accountsById = new Map(snapshot.accounts.map((account) => [account.id, account]));

  const filteredContacts = snapshot.contacts.filter((contact) => {
    const haystack = [
      contact.name,
      contact.title,
      contact.email,
      contact.roleInDecision,
      accountsById.get(contact.accountId)?.companyName ?? "",
    ]
      .join(" ")
      .toLowerCase();
    const matchesSearch = haystack.includes(searchTerm.trim().toLowerCase());
    const matchesResponse =
      responseFilter === "all" ? true : contact.responseType === responseFilter;

    return matchesSearch && matchesResponse;
  });

  const contacts = [...filteredContacts].sort((left, right) => {
    if (sortBy === "name") {
      return left.name.localeCompare(right.name);
    }

    if (sortBy === "authority") {
      return right.authorityLevel - left.authorityLevel;
    }

    if (sortBy === "influence") {
      return right.influenceLevel - left.influenceLevel;
    }

    return right.engagementScore - left.engagementScore;
  });

  const selectedContact =
    activeModal?.contactId
      ? snapshot.contacts.find((contact) => contact.id === activeModal.contactId) ?? null
      : null;

  return (
    <>
      <section className="glass-card rounded-[2rem] p-6 sm:p-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-slate-500">
              Contact Directory
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Search and sort decision-makers</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              Use this route for role, authority, influence, and response handling. Every
              contact can be opened or edited in a pop-out panel.
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <input
              className={inputClassName}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search name, title, company..."
              value={searchTerm}
            />
            <select
              className={inputClassName}
              onChange={(event) => setResponseFilter(event.target.value)}
              value={responseFilter}
            >
              <option value="all">All Responses</option>
              <option value="Positive">Positive</option>
              <option value="Neutral">Neutral</option>
              <option value="Objection">Objection</option>
              <option value="Not Now">Not Now</option>
            </select>
            <select
              className={inputClassName}
              onChange={(event) => setSortBy(event.target.value)}
              value={sortBy}
            >
              <option value="engagement">Sort: Highest Engagement</option>
              <option value="authority">Sort: Highest Authority</option>
              <option value="influence">Sort: Highest Influence</option>
              <option value="name">Sort: A-Z</option>
            </select>
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          {contacts.length === 0 ? (
            <DirectoryEmptyState message="No contacts match this filter yet." />
          ) : (
            contacts.map((contact) => (
              <article
                key={contact.id}
                className="rounded-3xl border border-white/70 bg-white/75 p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xl font-semibold text-slate-900">{contact.name}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {contact.title || "No title"} •{" "}
                      {accountsById.get(contact.accountId)?.companyName ?? "Unknown account"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      className={secondaryButtonClassName}
                      onClick={() => setActiveModal({ type: "view", contactId: contact.id })}
                      type="button"
                    >
                      View
                    </button>
                    <button
                      className={primaryButtonClassName}
                      onClick={() => setActiveModal({ type: "edit", contactId: contact.id })}
                      type="button"
                    >
                      Edit
                    </button>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <MetricChip label="Authority" value={`${contact.authorityLevel}/5`} />
                  <MetricChip label="Influence" value={`${contact.influenceLevel}/5`} />
                  <MetricChip label="Engagement" value={`${contact.engagementScore}/100`} />
                  <MetricChip label="Response" value={contact.responseType} />
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <InlinePanel
                    label="Role In Decision"
                    value={contact.roleInDecision || "No role captured yet."}
                  />
                  <InlinePanel
                    label="Sentiment"
                    value={contact.sentimentTag || "No sentiment tag yet."}
                  />
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <RecordModal
        isOpen={activeModal !== null}
        onClose={() => setActiveModal(null)}
        subtitle={
          activeModal?.type === "edit"
            ? "Edit the contact in place."
            : "Inspect the contact record without leaving the page."
        }
        title={
          activeModal?.type === "edit"
            ? `Edit ${selectedContact?.name ?? "Contact"}`
            : selectedContact?.name ?? "Contact"
        }
      >
        {activeModal?.type === "view" && selectedContact ? (
          <ContactViewPanel
            accountName={accountsById.get(selectedContact.accountId)?.companyName ?? "Unknown account"}
            contact={selectedContact}
          />
        ) : null}
        {activeModal?.type === "edit" && selectedContact ? (
          <ContactEditPanel
            contact={selectedContact}
            redirectTo="/contacts"
            snapshot={snapshot}
          />
        ) : null}
      </RecordModal>
    </>
  );
}

export function DealsDirectory({ snapshot }: { snapshot: CrmSnapshot }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [sortBy, setSortBy] = useState("weighted");
  const [viewMode, setViewMode] = useState<"list" | "pipeline">("list");
  const [activeModal, setActiveModal] = useState<DealModalState>(null);
  const accountsById = new Map(snapshot.accounts.map((account) => [account.id, account]));
  const contactsById = new Map(snapshot.contacts.map((contact) => [contact.id, contact]));
  const ownerOptions = [...new Set(snapshot.deals.map((deal) => deal.ownerName).filter(Boolean))];

  const filteredDeals = snapshot.deals.filter((deal) => {
    const haystack = [
      deal.name,
      deal.ownerName,
      deal.source,
      deal.nextAction,
      accountsById.get(deal.accountId)?.companyName ?? "",
      contactsById.get(deal.primaryContactId)?.name ?? "",
    ]
      .join(" ")
      .toLowerCase();
    const matchesSearch = haystack.includes(searchTerm.trim().toLowerCase());
    const matchesStage = stageFilter === "all" ? true : deal.stage === stageFilter;
    const matchesOwner = ownerFilter === "all" ? true : deal.ownerName === ownerFilter;

    return matchesSearch && matchesStage && matchesOwner;
  });

  const deals = [...filteredDeals].sort((left, right) => {
    if (sortBy === "name") {
      return left.name.localeCompare(right.name);
    }

    if (sortBy === "probability") {
      return (right.probabilityScore ?? 0) - (left.probabilityScore ?? 0);
    }

    if (sortBy === "stage") {
      return PIPELINE_STAGES.indexOf(left.stage) - PIPELINE_STAGES.indexOf(right.stage);
    }

    return (right.weightedRevenue ?? 0) - (left.weightedRevenue ?? 0);
  });

  const selectedDeal =
    activeModal?.dealId
      ? snapshot.deals.find((deal) => deal.id === activeModal.dealId) ?? null
      : null;

  return (
    <>
      <section className="glass-card rounded-[2rem] p-6 sm:p-8">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-slate-500">
                Deal Console
              </p>
              <h2 className="mt-2 text-2xl font-semibold">List view or pipeline view</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                Use filters to isolate the exact slice you want, then switch between a
                sortable list and a belief-progression pipeline board.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                className={viewMode === "list" ? primaryButtonClassName : secondaryButtonClassName}
                onClick={() => setViewMode("list")}
                type="button"
              >
                List View
              </button>
              <button
                className={viewMode === "pipeline" ? primaryButtonClassName : secondaryButtonClassName}
                onClick={() => setViewMode("pipeline")}
                type="button"
              >
                Pipeline View
              </button>
            </div>
          </div>

          <div className="grid gap-3 xl:grid-cols-4">
            <input
              className={inputClassName}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search deal, company, contact..."
              value={searchTerm}
            />
            <select
              className={inputClassName}
              onChange={(event) => setStageFilter(event.target.value)}
              value={stageFilter}
            >
              <option value="all">All Stages</option>
              {PIPELINE_STAGES.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
            <select
              className={inputClassName}
              onChange={(event) => setOwnerFilter(event.target.value)}
              value={ownerFilter}
            >
              <option value="all">All Owners</option>
              {ownerOptions.map((owner) => (
                <option key={owner} value={owner}>
                  {owner}
                </option>
              ))}
            </select>
            <select
              className={inputClassName}
              onChange={(event) => setSortBy(event.target.value)}
              value={sortBy}
            >
              <option value="weighted">Sort: Highest Weighted Revenue</option>
              <option value="probability">Sort: Highest Probability</option>
              <option value="stage">Sort: Pipeline Stage</option>
              <option value="name">Sort: A-Z</option>
            </select>
          </div>
        </div>

        {viewMode === "list" ? (
          <div className="mt-6 grid gap-4">
            {deals.length === 0 ? (
              <DirectoryEmptyState message="No deals match this filter yet." />
            ) : (
              deals.map((deal) => (
                <article
                  key={deal.id}
                  className="rounded-3xl border border-white/70 bg-white/75 p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-xl font-semibold text-slate-900">{deal.name}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {accountsById.get(deal.accountId)?.companyName ?? "Unknown account"} •{" "}
                        {contactsById.get(deal.primaryContactId)?.name ?? "Unknown contact"} •{" "}
                        {deal.stage}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        className={secondaryButtonClassName}
                        onClick={() => setActiveModal({ type: "view", dealId: deal.id })}
                        type="button"
                      >
                        View
                      </button>
                      <button
                        className={primaryButtonClassName}
                        onClick={() => setActiveModal({ type: "edit", dealId: deal.id })}
                        type="button"
                      >
                        Edit
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <MetricChip label="ARR" value={formatCurrency(deal.arrOpportunity)} />
                    <MetricChip label="Weighted" value={formatCurrency(deal.weightedRevenue ?? 0)} />
                    <MetricChip label="Probability" value={`${deal.probabilityScore ?? 0}%`} />
                    <MetricChip label="Leak" value={formatCurrency(deal.estimatedLeak)} />
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <InlinePanel
                      label="Next Action"
                      value={deal.nextAction || "No next action queued."}
                    />
                    <InlinePanel
                      label="Ownership"
                      value={`${deal.ownerName || "No owner"} • ${deal.timeInStageDays} days in stage • ${deal.source || "No source"}`}
                    />
                  </div>
                </article>
              ))
            )}
          </div>
        ) : (
          <div className="mt-6 grid gap-4 xl:grid-cols-3 2xl:grid-cols-4">
            {PIPELINE_STAGES.map((stage) => {
              const stageDeals = deals.filter((deal) => deal.stage === stage);

              return (
                <section
                  key={stage}
                  className="rounded-3xl border border-white/70 bg-white/70 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900">{stage}</p>
                    <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                      {stageDeals.length}
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    {stageDeals.length === 0 ? (
                      <DirectoryEmptyState message="No deals in this stage." />
                    ) : (
                      stageDeals.map((deal) => (
                        <article
                          key={deal.id}
                          className="rounded-2xl border border-slate-200 bg-white p-4"
                        >
                          <p className="font-semibold text-slate-900">{deal.name}</p>
                          <p className="mt-1 text-sm leading-6 text-slate-600">
                            {accountsById.get(deal.accountId)?.companyName ?? "Unknown account"}
                          </p>
                          <div className="mt-3 grid gap-2">
                            <MetricChip
                              label="Weighted"
                              value={formatCurrency(deal.weightedRevenue ?? 0)}
                            />
                            <MetricChip
                              label="Probability"
                              value={`${deal.probabilityScore ?? 0}%`}
                            />
                          </div>
                          <div className="mt-3 flex gap-2">
                            <button
                              className={secondaryButtonClassName}
                              onClick={() => setActiveModal({ type: "view", dealId: deal.id })}
                              type="button"
                            >
                              View
                            </button>
                            <button
                              className={primaryButtonClassName}
                              onClick={() => setActiveModal({ type: "edit", dealId: deal.id })}
                              type="button"
                            >
                              Edit
                            </button>
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </section>

      <RecordModal
        isOpen={activeModal !== null}
        onClose={() => setActiveModal(null)}
        subtitle={
          activeModal?.type === "edit"
            ? "Edit the deal in place."
            : "Inspect the deal record without leaving the page."
        }
        title={
          activeModal?.type === "edit"
            ? `Edit ${selectedDeal?.name ?? "Deal"}`
            : selectedDeal?.name ?? "Deal"
        }
      >
        {activeModal?.type === "view" && selectedDeal ? (
          <DealViewPanel
            accountName={accountsById.get(selectedDeal.accountId)?.companyName ?? "Unknown account"}
            contactName={contactsById.get(selectedDeal.primaryContactId)?.name ?? "Unknown contact"}
            deal={selectedDeal}
          />
        ) : null}
        {activeModal?.type === "edit" && selectedDeal ? (
          <DealEditPanel
            deal={selectedDeal}
            redirectTo="/deals"
            snapshot={snapshot}
          />
        ) : null}
      </RecordModal>
    </>
  );
}

function AccountViewPanel({ account }: { account: Account }) {
  return (
    <div className="grid gap-4">
      <DetailGrid>
        <DetailItem label="Company Name" value={account.companyName} />
        <DetailItem label="Industry" value={account.industryVertical} />
        <DetailItem label="Revenue Band" value={account.revenueBand} />
        <DetailItem label="Location" value={account.location} />
        <DetailItem label="Acquisition" value={account.acquisitionModel} />
        <DetailItem label="Belief Stage" value={account.beliefStage} />
        <DetailItem label="Estimated LTV" value={formatCurrency(account.estimatedLtv)} />
        <DetailItem
          label="Monthly Revenue Leak"
          value={formatCurrency(account.estimatedMonthlyRevenueLeak)}
        />
        <DetailItem label="Signal Score" value={`${account.signalScore}/100`} />
        <DetailItem label="ICP Fit" value={`${account.icpFitScore}/100`} />
        <DetailItem label="Lead Volume" value={`${account.estimatedLeadVolume}`} />
        <DetailItem
          label="Conversion Rate"
          value={formatPercent(account.estimatedConversionRate)}
        />
      </DetailGrid>
      <InlinePanel
        label="Tech Stack"
        value={account.techStack.join(", ") || "No tech stack recorded."}
      />
      <InlinePanel
        label="Ad Channels"
        value={account.adChannelsUsed.join(", ") || "No ad channels recorded."}
      />
      <InlinePanel
        label="Friction Summary"
        value={account.frictionSummary || "No friction captured yet."}
      />
    </div>
  );
}

function ContactViewPanel({
  contact,
  accountName,
}: {
  contact: Contact;
  accountName: string;
}) {
  return (
    <div className="grid gap-4">
      <DetailGrid>
        <DetailItem label="Name" value={contact.name} />
        <DetailItem label="Account" value={accountName} />
        <DetailItem label="Title" value={contact.title || "No title"} />
        <DetailItem label="Email" value={contact.email} />
        <DetailItem label="Phone" value={contact.phone || "No phone"} />
        <DetailItem label="LinkedIn" value={contact.linkedIn || "No LinkedIn"} />
        <DetailItem label="Authority" value={`${contact.authorityLevel}/5`} />
        <DetailItem label="Influence" value={`${contact.influenceLevel}/5`} />
        <DetailItem label="Engagement" value={`${contact.engagementScore}/100`} />
        <DetailItem label="Response" value={contact.responseType} />
      </DetailGrid>
      <InlinePanel
        label="Role In Decision"
        value={contact.roleInDecision || "No role captured yet."}
      />
      <InlinePanel
        label="Sentiment"
        value={contact.sentimentTag || "No sentiment tag yet."}
      />
    </div>
  );
}

function DealViewPanel({
  deal,
  accountName,
  contactName,
}: {
  deal: Deal;
  accountName: string;
  contactName: string;
}) {
  return (
    <div className="grid gap-4">
      <DetailGrid>
        <DetailItem label="Deal Name" value={deal.name} />
        <DetailItem label="Account" value={accountName} />
        <DetailItem label="Primary Contact" value={contactName} />
        <DetailItem label="Stage" value={deal.stage} />
        <DetailItem label="ARR Opportunity" value={formatCurrency(deal.arrOpportunity)} />
        <DetailItem label="Estimated Leak" value={formatCurrency(deal.estimatedLeak)} />
        <DetailItem label="Weighted Revenue" value={formatCurrency(deal.weightedRevenue ?? 0)} />
        <DetailItem label="Probability" value={`${deal.probabilityScore ?? 0}%`} />
        <DetailItem label="Pain Score" value={`${deal.painScore}/100`} />
        <DetailItem label="Engagement" value={`${deal.engagementScore}/100`} />
        <DetailItem label="ICP Fit" value={`${deal.icpFitScore}/100`} />
        <DetailItem label="Authority" value={`${deal.authorityLevel}/5`} />
      </DetailGrid>
      <InlinePanel
        label="Ownership"
        value={`${deal.ownerName || "No owner"} • ${deal.timeInStageDays} days in stage • ${deal.source || "No source"}`}
      />
      <InlinePanel
        label="Next Action"
        value={deal.nextAction || "No next action queued."}
      />
    </div>
  );
}

function AccountEditPanel({
  account,
  redirectTo,
}: {
  account: Account;
  redirectTo: string;
}) {
  return (
    <form action={updateAccountAction} className="grid gap-3">
      <input name="redirectTo" type="hidden" value={redirectTo} />
      <input name="accountId" type="hidden" value={account.id} />
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
        <Field label="Estimated LTV">
          <input className={inputClassName} defaultValue={account.estimatedLtv} name="estimatedLtv" type="number" />
        </Field>
        <Field label="Lead Volume / Month">
          <input
            className={inputClassName}
            defaultValue={account.estimatedLeadVolume}
            name="estimatedLeadVolume"
            type="number"
          />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Employee Count">
          <input
            className={inputClassName}
            defaultValue={account.employeeCount}
            name="employeeCount"
            type="number"
          />
        </Field>
        <Field label="Conversion Rate %">
          <input
            className={inputClassName}
            defaultValue={account.estimatedConversionRate}
            name="estimatedConversionRate"
            step="0.1"
            type="number"
          />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Revenue Leak %">
          <input
            className={inputClassName}
            defaultValue={account.estimatedRevenueLeakPercent}
            name="estimatedRevenueLeakPercent"
            step="0.1"
            type="number"
          />
        </Field>
        <Field label="Monthly Revenue Leak $">
          <input
            className={inputClassName}
            defaultValue={account.estimatedMonthlyRevenueLeak}
            name="estimatedMonthlyRevenueLeak"
            type="number"
          />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Signal Score">
          <input className={inputClassName} defaultValue={account.signalScore} name="signalScore" type="number" />
        </Field>
        <Field label="ICP Fit Score">
          <input className={inputClassName} defaultValue={account.icpFitScore} name="icpFitScore" type="number" />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Booking Software">
          <input
            className={inputClassName}
            defaultValue={account.bookingSoftware}
            name="bookingSoftware"
          />
        </Field>
        <Field label="CRM Used">
          <input className={inputClassName} defaultValue={account.crmUsed} name="crmUsed" />
        </Field>
      </div>
      <Field label="Tech Stack (comma separated)">
        <input className={inputClassName} defaultValue={account.techStack.join(", ")} name="techStack" />
      </Field>
      <Field label="Ad Channels (comma separated)">
        <input
          className={inputClassName}
          defaultValue={account.adChannelsUsed.join(", ")}
          name="adChannelsUsed"
        />
      </Field>
      <Field label="Owner Persona Type">
        <input
          className={inputClassName}
          defaultValue={account.ownerPersonaType}
          name="ownerPersonaType"
        />
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

function ContactEditPanel({
  contact,
  snapshot,
  redirectTo,
}: {
  contact: Contact;
  snapshot: CrmSnapshot;
  redirectTo: string;
}) {
  return (
    <form action={updateContactAction} className="grid gap-3">
      <input name="redirectTo" type="hidden" value={redirectTo} />
      <input name="contactId" type="hidden" value={contact.id} />
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
        <Field label="Authority">
          <input
            className={inputClassName}
            defaultValue={contact.authorityLevel}
            name="authorityLevel"
            type="number"
          />
        </Field>
        <Field label="Influence">
          <input
            className={inputClassName}
            defaultValue={contact.influenceLevel}
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

function DealEditPanel({
  deal,
  snapshot,
  redirectTo,
}: {
  deal: Deal;
  snapshot: CrmSnapshot;
  redirectTo: string;
}) {
  const [selectedAccountId, setSelectedAccountId] = useState(deal.accountId);
  const [selectedContactId, setSelectedContactId] = useState(deal.primaryContactId);
  const filteredContacts = snapshot.contacts.filter((contact) => contact.accountId === selectedAccountId);
  const safeSelectedContactId = filteredContacts.some((contact) => contact.id === selectedContactId)
    ? selectedContactId
    : "";

  return (
    <form action={updateDealAction} className="grid gap-3">
      <input name="redirectTo" type="hidden" value={redirectTo} />
      <input name="dealId" type="hidden" value={deal.id} />
      <Field label="Deal Name">
        <input className={inputClassName} defaultValue={deal.name} name="name" required />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Account">
          <select
            className={inputClassName}
            name="accountId"
            onChange={(event) => setSelectedAccountId(event.target.value)}
            value={selectedAccountId}
          >
            {snapshot.accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.companyName}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Primary Contact">
          <select
            className={inputClassName}
            name="primaryContactId"
            onChange={(event) => setSelectedContactId(event.target.value)}
            value={safeSelectedContactId}
          >
            <option value="">Select a contact</option>
            {filteredContacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Stage">
          <select className={inputClassName} defaultValue={deal.stage} name="stage">
            {PIPELINE_STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Owner">
          <input className={inputClassName} defaultValue={deal.ownerName} name="ownerName" />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="ARR Opportunity">
          <input className={inputClassName} defaultValue={deal.arrOpportunity} name="arrOpportunity" type="number" />
        </Field>
        <Field label="Estimated Leak">
          <input className={inputClassName} defaultValue={deal.estimatedLeak} name="estimatedLeak" type="number" />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Pain Score">
          <input className={inputClassName} defaultValue={deal.painScore} name="painScore" type="number" />
        </Field>
        <Field label="Engagement">
          <input
            className={inputClassName}
            defaultValue={deal.engagementScore}
            name="engagementScore"
            type="number"
          />
        </Field>
        <Field label="ICP Fit">
          <input className={inputClassName} defaultValue={deal.icpFitScore} name="icpFitScore" type="number" />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Authority">
          <input
            className={inputClassName}
            defaultValue={deal.authorityLevel}
            name="authorityLevel"
            type="number"
          />
        </Field>
        <Field label="Time in Stage">
          <input
            className={inputClassName}
            defaultValue={deal.timeInStageDays}
            name="timeInStageDays"
            type="number"
          />
        </Field>
        <Field label="Outbound Cost">
          <input className={inputClassName} defaultValue={deal.outboundCost} name="outboundCost" type="number" />
        </Field>
      </div>
      <Field label="Source">
        <input className={inputClassName} defaultValue={deal.source} name="source" />
      </Field>
      <Field label="Next Action">
        <textarea className={textareaClassName} defaultValue={deal.nextAction} name="nextAction" rows={3} />
      </Field>
      <SubmitButton label="Update Deal" disabled={!safeSelectedContactId} />
    </form>
  );
}

function RecordModal(props: {
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
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-slate-500">
              Record
            </p>
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

function DetailGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{children}</div>;
}

function DetailItem(props: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-500">
        {props.label}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{props.value}</p>
    </div>
  );
}

function InlinePanel(props: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-500">
        {props.label}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{props.value}</p>
    </div>
  );
}

function MetricChip(props: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-500">
        {props.label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{props.value}</p>
    </div>
  );
}

function DirectoryEmptyState(props: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
      {props.message}
    </div>
  );
}

function Field(props: {
  label: string;
  children: ReactNode;
}) {
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
      className="inline-flex items-center justify-center rounded-2xl border border-[rgba(33,42,52,0.12)] bg-[linear-gradient(135deg,var(--indigo),var(--teal))] px-4 py-2.5 text-sm font-semibold text-[#f5efe4] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-[rgba(33,42,52,0.18)] disabled:text-[rgba(245,239,228,0.72)]"
      disabled={props.disabled}
      type="submit"
    >
      {props.label}
    </button>
  );
}

const inputClassName =
  "w-full rounded-2xl border border-[rgba(33,42,52,0.12)] bg-[rgba(255,255,255,0.58)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--teal)]";

const textareaClassName =
  "w-full rounded-2xl border border-[rgba(33,42,52,0.12)] bg-[rgba(255,255,255,0.58)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--teal)]";

const primaryButtonClassName =
  "inline-flex items-center justify-center rounded-2xl border border-[rgba(33,42,52,0.12)] bg-[linear-gradient(135deg,var(--indigo),var(--teal))] px-4 py-2 text-sm font-semibold text-[#f5efe4] transition-opacity hover:opacity-90";

const secondaryButtonClassName =
  "inline-flex items-center justify-center rounded-2xl border border-[rgba(33,42,52,0.12)] bg-[rgba(255,255,255,0.48)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition-colors hover:border-[rgba(33,42,52,0.18)] hover:bg-[rgba(255,255,255,0.66)]";
