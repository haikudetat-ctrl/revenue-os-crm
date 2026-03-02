import type { ReactNode } from "react";
import { createLedgerEntryAction } from "@/app/actions";
import { CrmOperations } from "@/components/crm-operations";
import {
  AccountsDirectory,
  ContactsDirectory,
  DealsDirectory,
} from "@/components/crm-records";
import { CrmSnapshot, FlashMessage } from "@/lib/types";

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

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateString));
}

function getStageTone(index: number) {
  const tones = [
    "bg-white/70 text-slate-700",
    "bg-teal-100 text-teal-900",
    "bg-cyan-100 text-cyan-900",
    "bg-amber-100 text-amber-900",
    "bg-orange-100 text-orange-900",
    "bg-slate-200 text-slate-900",
    "bg-emerald-200 text-emerald-900",
  ];

  return tones[index] ?? tones[0];
}

export function CrmOverviewPage(props: {
  snapshot: CrmSnapshot;
  flashMessage?: FlashMessage | null;
}) {
  const highestLeakAccount = [...props.snapshot.accounts].sort(
    (a, b) => b.estimatedMonthlyRevenueLeak - a.estimatedMonthlyRevenueLeak,
  )[0];
  const strongestDeals = [...props.snapshot.deals]
    .sort((a, b) => (b.probabilityScore ?? 0) - (a.probabilityScore ?? 0))
    .slice(0, 3);
  const stagePreview = props.snapshot.stagePerformance.slice(0, 4);
  const topAccounts = [...props.snapshot.accounts]
    .sort((a, b) => b.estimatedMonthlyRevenueLeak - a.estimatedMonthlyRevenueLeak)
    .slice(0, 3);

  return (
    <>
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="glass-card rounded-[2rem] p-6 sm:p-8">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-teal-800">
            Overview
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            A cleaner control surface for revenue decisions.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
            Each route now serves a single operating job: review, capture, pipeline
            movement, account math, or revenue tracking. The overview stays lean and points
            you to the next decision.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <QuestionChip label="Signal origin" />
            <QuestionChip label="Prospect math" />
            <QuestionChip label="Friction" />
            <QuestionChip label="Belief stage" />
            <QuestionChip label="Weighted revenue" />
          </div>

          {props.flashMessage ? <FlashNotice flashMessage={props.flashMessage} /> : null}
        </div>

        <div className="glass-card rounded-[2rem] p-6">
          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <InsightCard
              eyebrow="Forecast"
              helper="Probability-weighted pipeline"
              value={formatCurrency(props.snapshot.weightedRevenue)}
            />
            <InsightCard
              eyebrow="Highest Leak"
              helper={highestLeakAccount?.companyName ?? "No data"}
              value={formatCurrency(highestLeakAccount?.estimatedMonthlyRevenueLeak ?? 0)}
            />
            <InsightCard
              eyebrow="Data Source"
              helper={`Updated ${formatDate(props.snapshot.generatedAt)}`}
              value={props.snapshot.origin === "supabase" ? "Supabase" : "Seeded Demo"}
            />
          </div>

          <div
            className={`mt-4 rounded-3xl px-4 py-4 text-sm leading-6 ${
              props.snapshot.syncStatus === "connected"
                ? "bg-emerald-100 text-emerald-950"
                : "bg-amber-100 text-amber-950"
            }`}
          >
            <span className="font-mono text-[11px] uppercase tracking-[0.2em]">
              {props.snapshot.syncStatus === "connected" ? "Sync Healthy" : "Fallback Reason"}
            </span>
            <p className="mt-2">{props.snapshot.syncMessage}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {props.snapshot.dashboardMetrics.slice(0, 8).map((metric) => (
          <article
            key={metric.label}
            className="glass-card rounded-3xl p-5 transition-transform duration-300 hover:-translate-y-1"
          >
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate-500">
              {metric.label}
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{metric.value}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{metric.helper}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="glass-card rounded-[2rem] p-6">
          <SectionHeader
            copy="The stage board moved to its own page. This preview shows where momentum is currently concentrated."
            eyebrow="Pipeline Snapshot"
            title="Belief progression at a glance"
          />

          <div className="mt-5 space-y-3">
            {stagePreview.map((stage, index) => (
              <article
                key={stage.stage}
                className="rounded-3xl border border-white/60 bg-white/75 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${getStageTone(
                      index,
                    )}`}
                  >
                    {stage.stage}
                  </span>
                  <span className="font-mono text-xs text-slate-500">{stage.dealCount} active</span>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <MetricMini
                    helper="Reached"
                    label="Deals"
                    value={`${stage.reachedCount}`}
                  />
                  <MetricMini
                    helper="Conversion"
                    label="Flow"
                    value={formatPercent(stage.conversionRate)}
                  />
                  <MetricMini
                    helper="Avg time"
                    label="Days"
                    value={`${stage.avgTimeInStageDays.toFixed(1)}`}
                  />
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-[2rem] p-6">
          <SectionHeader
            copy="These are the deals with the strongest current weighted revenue signal."
            eyebrow="Priority Deals"
            title="Where operator attention should go"
          />

          <div className="mt-5 space-y-3">
            {strongestDeals.length === 0 ? (
              <EmptySection message="No deals yet. Create the first deal in Workspace." />
            ) : (
              strongestDeals.map((deal) => (
                <div
                  key={deal.id}
                  className="rounded-2xl border border-white/70 bg-white/75 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900">{deal.name}</p>
                    <p className="font-mono text-sm text-teal-800">
                      {deal.probabilityScore}% / {formatCurrency(deal.weightedRevenue ?? 0)}
                    </p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {deal.stage} • {deal.ownerName || "No owner"} • {deal.nextAction}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="glass-card rounded-[2rem] p-6">
          <SectionHeader
            copy="The accounts page now owns full math-layer review. This preview highlights the biggest revenue pressure."
            eyebrow="Account Pressure"
            title="Largest leak exposure"
          />

          <div className="mt-5 space-y-3">
            {topAccounts.length === 0 ? (
              <EmptySection message="No accounts yet. Add one in Workspace." />
            ) : (
              topAccounts.map((account) => (
                <div
                  key={account.id}
                  className="rounded-2xl border border-white/70 bg-white/75 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900">{account.companyName}</p>
                    <p className="font-mono text-sm text-slate-900">
                      {formatCurrency(account.estimatedMonthlyRevenueLeak)}
                    </p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {account.industryVertical} • {account.location} • {account.beliefStage}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </>
  );
}

export function CrmWorkspacePage(props: {
  snapshot: CrmSnapshot;
  flashMessage?: FlashMessage | null;
}) {
  return (
    <>
      <section className="glass-card rounded-[2rem] p-6 sm:p-8">
        <SectionHeader
          copy="Capture inputs live, but only when needed. Every write flow is launched from a modal so the workspace stays readable."
          eyebrow="Workspace"
          title="Create and update records"
        />
        {props.flashMessage ? <FlashNotice flashMessage={props.flashMessage} /> : null}
      </section>

      <CrmOperations snapshot={props.snapshot} />
    </>
  );
}

export function CrmPipelinePage({ snapshot }: { snapshot: CrmSnapshot }) {
  return <CrmDealsPage snapshot={snapshot} />;
}

export function CrmAccountsPage({ snapshot }: { snapshot: CrmSnapshot }) {
  return (
    <>
      <section className="glass-card rounded-[2rem] p-6 sm:p-8">
        <SectionHeader
          copy="This route is the math layer for company-level decisions. Search, sort, open, and edit account records without switching pages."
          eyebrow="Accounts"
          title="Company economics and leak exposure"
        />
      </section>

      <AccountsDirectory snapshot={snapshot} />
    </>
  );
}

export function CrmDealsPage({ snapshot }: { snapshot: CrmSnapshot }) {
  return (
    <>
      <section className="glass-card rounded-[2rem] p-6 sm:p-8">
        <SectionHeader
          copy="Deals now have a dedicated operating surface. Filter the pipeline as a list, or switch to a stage board when you want belief progression context."
          eyebrow="Deals"
          title="Sortable deal list and pipeline board"
        />
      </section>

      <DealsDirectory snapshot={snapshot} />
    </>
  );
}

export function CrmContactsPage({ snapshot }: { snapshot: CrmSnapshot }) {
  return (
    <>
      <section className="glass-card rounded-[2rem] p-6 sm:p-8">
        <SectionHeader
          copy="This route is for the people layer: search stakeholders, filter by response posture, and enrich decision-maker records in place."
          eyebrow="Contacts"
          title="Decision-maker directory"
        />
      </section>

      <ContactsDirectory snapshot={snapshot} />
    </>
  );
}

export function CrmRevenuePage(props: {
  snapshot: CrmSnapshot;
  flashMessage?: FlashMessage | null;
}) {
  const ledgerEntries = [...props.snapshot.ledgerEntries].sort((a, b) =>
    `${b.occurredOn}-${b.createdAt ?? ""}`.localeCompare(`${a.occurredOn}-${a.createdAt ?? ""}`),
  );
  const totalExpenses = ledgerEntries
    .filter((entry) => entry.entryType === "Expense")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const totalRevenue = ledgerEntries
    .filter((entry) => entry.entryType === "Revenue")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const netCash = totalRevenue - totalExpenses;
  const ownerTotals = ledgerEntries.reduce<Record<string, number>>((acc, entry) => {
    const direction = entry.entryType === "Revenue" ? 1 : -1;
    acc[entry.ownerName] = (acc[entry.ownerName] ?? 0) + direction * entry.amount;
    return acc;
  }, {});

  return (
    <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <div className="glass-card rounded-[2rem] p-6 sm:p-8">
        <SectionHeader
          copy="Use this as a shared cash ledger: log expenses either of you pay, then log sales revenue when it lands."
          eyebrow="Shared Ledger"
          title="Expenses and sales revenue"
        />

        {props.flashMessage ? <FlashNotice flashMessage={props.flashMessage} /> : null}

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <InsightCard
            eyebrow="Revenue In"
            value={formatCurrency(totalRevenue)}
            helper="Total sales collected"
          />
          <InsightCard
            eyebrow="Expenses Out"
            value={formatCurrency(totalExpenses)}
            helper="Tracked spend"
          />
          <InsightCard
            eyebrow="Net Cash"
            value={formatCurrency(netCash)}
            helper="Revenue minus expenses"
          />
        </div>

        <form action={createLedgerEntryAction} className="mt-6 grid gap-3 rounded-3xl border border-white/70 bg-white/75 p-5">
          <input name="redirectTo" type="hidden" value="/revenue" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Date">
              <input className={inputClassName} defaultValue={new Date().toISOString().slice(0, 10)} name="occurredOn" type="date" />
            </Field>
            <Field label="Type">
              <select className={inputClassName} defaultValue="Expense" name="entryType">
                <option value="Expense">Expense</option>
                <option value="Revenue">Revenue</option>
              </select>
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Paid / Received By">
              <input
                className={inputClassName}
                name="ownerName"
                placeholder="Your name or partner name"
                required
              />
            </Field>
            <Field label="Amount">
              <input
                className={inputClassName}
                min="0"
                name="amount"
                required
                step="0.01"
                type="number"
              />
            </Field>
          </div>
          <Field label="Description">
            <input
              className={inputClassName}
              name="description"
              placeholder="What happened?"
              required
            />
          </Field>
          <Field label="Notes">
            <input
              className={inputClassName}
              name="notes"
              placeholder="Optional detail"
            />
          </Field>
          <button
            className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
            type="submit"
          >
            Add Ledger Entry
          </button>
        </form>

        <div className="mt-6 overflow-hidden rounded-3xl border border-white/70 bg-white/70">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em]">
                  Date
                </th>
                <th className="px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em]">
                  Type
                </th>
                <th className="px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em]">
                  Person
                </th>
                <th className="px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em]">
                  Description
                </th>
                <th className="px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em]">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {ledgerEntries.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-sm text-slate-500" colSpan={5}>
                    No ledger entries yet. Add the first expense or sales payment above.
                  </td>
                </tr>
              ) : (
                ledgerEntries.map((entry) => (
                  <tr key={entry.id} className="border-t border-slate-200/70">
                    <td className="px-4 py-3">{entry.occurredOn}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                          entry.entryType === "Revenue"
                            ? "bg-emerald-100 text-emerald-900"
                            : "bg-amber-100 text-amber-900"
                        }`}
                      >
                        {entry.entryType}
                      </span>
                    </td>
                    <td className="px-4 py-3">{entry.ownerName}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{entry.description}</div>
                      {entry.notes ? (
                        <div className="mt-1 text-xs leading-5 text-slate-500">{entry.notes}</div>
                      ) : null}
                    </td>
                    <td
                      className={`px-4 py-3 font-semibold ${
                        entry.entryType === "Revenue" ? "text-emerald-700" : "text-rose-700"
                      }`}
                    >
                      {entry.entryType === "Revenue" ? "+" : "-"}
                      {formatCurrency(entry.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <section className="glass-card rounded-[2rem] p-6">
          <SectionHeader
            copy="This gives you a quick read on who has fronted costs or collected cash so far."
            eyebrow="By Person"
            title="Running balance by owner"
          />

          <div className="mt-5 space-y-3">
            {Object.keys(ownerTotals).length === 0 ? (
              <EmptySection message="No personal balances yet. Add your first ledger line." />
            ) : (
              Object.entries(ownerTotals)
                .sort(([, a], [, b]) => b - a)
                .map(([ownerName, total]) => (
                <div
                  key={ownerName}
                  className="rounded-2xl border border-white/70 bg-white/75 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900">{ownerName}</p>
                    <span className="font-mono text-xs text-slate-500">
                      {ledgerEntries.filter((entry) => entry.ownerName === ownerName).length} entries
                    </span>
                  </div>
                  <p
                    className={`mt-2 text-lg font-semibold ${
                      total >= 0 ? "text-emerald-700" : "text-rose-700"
                    }`}
                  >
                    {total >= 0 ? "+" : "-"}
                    {formatCurrency(Math.abs(total))}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[2rem] bg-gradient-to-br from-[#102130] via-[#17334a] to-[#0f766e] p-6 text-white shadow-2xl">
          <SectionHeader
            copy="Keep this intentionally simple: one line per expense, one line per customer payment."
            dark
            eyebrow="Ledger Rules"
            title="How to use this page"
          />

          <div className="mt-5 space-y-3 text-sm leading-6 text-cyan-50/90">
            <p>Log every shared business expense when it happens.</p>
            <p>Use the person field to show who paid or who received the money.</p>
            <p>Log customer payments as `Revenue`, not projected pipeline.</p>
            <p>Use the notes field for invoice numbers, vendors, or payment references.</p>
          </div>
        </section>
      </div>
    </section>
  );
}

function FlashNotice(props: { flashMessage: FlashMessage }) {
  return (
    <div
      className={`mt-6 rounded-3xl px-4 py-4 text-sm leading-6 ${
        props.flashMessage.status === "success"
          ? "bg-cyan-100 text-cyan-950"
          : "bg-rose-100 text-rose-950"
      }`}
    >
      <span className="font-mono text-[11px] uppercase tracking-[0.2em]">
        {props.flashMessage.status === "success" ? "Action Complete" : "Action Error"}
      </span>
      <p className="mt-2">{props.flashMessage.message}</p>
    </div>
  );
}

function SectionHeader(props: {
  eyebrow: string;
  title: string;
  copy: string;
  dark?: boolean;
}) {
  return (
    <div>
      <p
        className={`font-mono text-xs uppercase tracking-[0.24em] ${
          props.dark ? "text-slate-400" : "text-slate-500"
        }`}
      >
        {props.eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-semibold">{props.title}</h2>
      <p
        className={`mt-3 max-w-xl text-sm leading-6 ${
          props.dark ? "text-slate-300" : "text-slate-600"
        }`}
      >
        {props.copy}
      </p>
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

function QuestionChip(props: { label: string }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/75 px-4 py-3 text-sm font-medium text-slate-700">
      {props.label}
    </div>
  );
}

function InsightCard(props: { eyebrow: string; value: string; helper: string }) {
  return (
    <div className="rounded-3xl border border-white/60 bg-white/70 px-4 py-4">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">
        {props.eyebrow}
      </p>
      <p className="mt-2 text-xl font-semibold text-slate-900">{props.value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{props.helper}</p>
    </div>
  );
}

function EmptySection(props: { message: string; dark?: boolean }) {
  return (
    <div
      className={`rounded-2xl border border-dashed px-4 py-4 text-sm leading-6 ${
        props.dark
          ? "border-white/20 bg-white/5 text-slate-300"
          : "border-slate-300 bg-slate-50 text-slate-600"
      }`}
    >
      {props.message}
    </div>
  );
}

function MetricMini(props: { label: string; value: string; helper: string }) {
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

const inputClassName =
  "w-full rounded-2xl border border-[rgba(33,42,52,0.12)] bg-[rgba(255,255,255,0.58)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--teal)]";
