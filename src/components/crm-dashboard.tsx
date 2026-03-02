import { CrmSnapshot, PIPELINE_STAGES } from "@/lib/types";

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

export function CrmDashboard({ snapshot }: { snapshot: CrmSnapshot }) {
  const topAccounts = [...snapshot.accounts]
    .sort((a, b) => b.estimatedMonthlyRevenueLeak - a.estimatedMonthlyRevenueLeak)
    .slice(0, 3);
  const topSignals = snapshot.campaignSignals
    .filter((signal) => signal.replied || signal.clicked)
    .slice(0, 5);
  const highestLeakAccount = [...snapshot.accounts].sort(
    (a, b) => b.estimatedMonthlyRevenueLeak - a.estimatedMonthlyRevenueLeak,
  )[0];
  const strongestDeals = [...snapshot.deals].sort(
    (a, b) => (b.probabilityScore ?? 0) - (a.probabilityScore ?? 0),
  );

  return (
    <main className="grid-lines min-h-screen px-4 py-6 text-slate-900 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="glass-card overflow-hidden rounded-[2rem] p-6 sm:p-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-teal-800">
                Revenue OS CRM
              </p>
              <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
                Signal-first CRM built around revenue math and belief progression.
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
                Every screen answers the same five questions: signal origin, known math,
                friction, belief stage, and probability-weighted revenue. Anything else is
                noise.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <InsightCard
                eyebrow="Forecast"
                value={formatCurrency(snapshot.weightedRevenue)}
                helper="Probability-weighted pipeline"
              />
              <InsightCard
                eyebrow="Highest Leak"
                value={formatCurrency(highestLeakAccount?.estimatedMonthlyRevenueLeak ?? 0)}
                helper={highestLeakAccount?.companyName ?? "No data"}
              />
              <InsightCard
                eyebrow="Data Source"
                value={snapshot.origin === "supabase" ? "Supabase" : "Seeded Demo"}
                helper={`Updated ${formatDate(snapshot.generatedAt)}`}
              />
            </div>
          </div>

          <div
            className={`mt-6 rounded-3xl px-4 py-4 text-sm leading-6 ${
              snapshot.syncStatus === "connected"
                ? "bg-emerald-100 text-emerald-950"
                : "bg-amber-100 text-amber-950"
            }`}
          >
            <span className="font-mono text-[11px] uppercase tracking-[0.2em]">
              {snapshot.syncStatus === "connected" ? "Sync Healthy" : "Fallback Reason"}
            </span>
            <p className="mt-2">{snapshot.syncMessage}</p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {snapshot.dashboardMetrics.map((metric) => (
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

        <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <div className="glass-card rounded-[2rem] p-6 sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-slate-500">
                  Pipeline Architecture
                </p>
                <h2 className="mt-2 text-2xl font-semibold">Belief progression velocity</h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-slate-600">
                This replaces the usual linear deal board. Each stage measures whether belief
                is increasing, how long it stalls, and how much leak remains exposed.
              </p>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {snapshot.stagePerformance.map((stage, index) => (
                <article
                  key={stage.stage}
                  className="rounded-3xl border border-white/60 bg-white/75 p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${getStageTone(
                        index,
                      )}`}
                    >
                      {stage.stage}
                    </span>
                    <span className="font-mono text-xs text-slate-500">
                      {stage.dealCount} active
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <MetricMini
                      label="Reached"
                      value={`${stage.reachedCount}`}
                      helper="Accounts touched"
                    />
                    <MetricMini
                      label="Conversion"
                      value={formatPercent(stage.conversionRate)}
                      helper="Into next stage"
                    />
                    <MetricMini
                      label="Time"
                      value={`${stage.avgTimeInStageDays.toFixed(1)}d`}
                      helper="Average in stage"
                    />
                  </div>

                  <div className="mt-4 rounded-2xl bg-slate-900 px-4 py-3 text-white">
                    <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-300">
                      Revenue leakage still exposed
                    </p>
                    <p className="mt-1 text-xl font-semibold">
                      {formatCurrency(stage.revenueLeakage)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <section className="glass-card rounded-[2rem] p-6">
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-slate-500">
                AI SDR Layer
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Reply classification engine</h2>
              <div className="mt-5 space-y-3">
                {topSignals.map((signal) => (
                  <div
                    key={signal.id}
                    className="rounded-2xl border border-white/70 bg-white/70 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-slate-900">{signal.campaignName}</p>
                      <span className="rounded-full bg-slate-900 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-white">
                        {signal.aiClassification}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Step {signal.emailStep} •{" "}
                      {signal.timeToFirstResponseHours
                        ? `${signal.timeToFirstResponseHours}h to first response`
                        : "Awaiting reply"}{" "}
                      • {signal.replySentiment} sentiment
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-2xl">
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-slate-400">
                Probability Engine
              </p>
              <h2 className="mt-2 text-2xl font-semibold">
                {(strongestDeals[0]?.probabilityScore ?? 0).toFixed(0)}% fit on the strongest deal
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Probability score = ICP fit × engagement × pain × authority. The dashboard
                forecasts weighted revenue instead of pipeline fantasy.
              </p>
              <div className="mt-5 grid gap-3">
                {strongestDeals.slice(0, 3).map((deal) => (
                  <div
                    key={deal.id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold">{deal.name}</p>
                      <p className="font-mono text-sm text-teal-300">
                        {deal.probabilityScore}% / {formatCurrency(deal.weightedRevenue ?? 0)}
                      </p>
                    </div>
                    <p className="mt-2 text-sm text-slate-300">
                      {deal.ownerName} • {deal.nextAction}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_1.2fr]">
          <div className="glass-card rounded-[2rem] p-6 sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-slate-500">
                  Account Math Layer
                </p>
                <h2 className="mt-2 text-2xl font-semibold">Revenue leakage by account</h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-slate-600">
                This is not a contact database. The account is the operating model: channel,
                LTV, conversion, leak, and ICP fit.
              </p>
            </div>

            <div className="mt-6 space-y-4">
              {topAccounts.map((account) => (
                <article
                  key={account.id}
                  className="rounded-3xl border border-white/70 bg-white/75 p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xl font-semibold">{account.companyName}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {account.industryVertical} • {account.location} •{" "}
                        {account.acquisitionModel} acquisition
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-900 px-4 py-3 text-right text-white">
                      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-300">
                        Leak / Month
                      </p>
                      <p className="text-xl font-semibold">
                        {formatCurrency(account.estimatedMonthlyRevenueLeak)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <MetricMini
                      label="Signal"
                      value={`${account.signalScore}/100`}
                      helper="Outbound intensity"
                    />
                    <MetricMini
                      label="ICP Fit"
                      value={`${account.icpFitScore}/100`}
                      helper="Ideal customer score"
                    />
                    <MetricMini
                      label="LTV"
                      value={formatCurrency(account.estimatedLtv)}
                      helper="Estimated customer value"
                    />
                    <MetricMini
                      label="Conv."
                      value={formatPercent(account.estimatedConversionRate)}
                      helper="Estimated conversion rate"
                    />
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">
                        Friction
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        {account.frictionSummary}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">
                        System Context
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        {account.techStack.join(", ")} with {account.bookingSoftware} and{" "}
                        {account.crmUsed}.
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-[2rem] p-6 sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-slate-500">
                  Revenue Intelligence
                </p>
                <h2 className="mt-2 text-2xl font-semibold">Campaign efficiency panel</h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-slate-600">
                Outbound performance is measured against revenue created, not activity volume.
              </p>
            </div>

            <div className="mt-6 overflow-hidden rounded-3xl border border-white/70 bg-white/70">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-900 text-white">
                  <tr>
                    <th className="px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em]">
                      Campaign
                    </th>
                    <th className="px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em]">
                      Reply Rate
                    </th>
                    <th className="px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em]">
                      Booked
                    </th>
                    <th className="px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em]">
                      MRR Added
                    </th>
                    <th className="px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em]">
                      Rev / 1k
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.campaignPerformance.map((campaign) => (
                    <tr key={campaign.campaignName} className="border-t border-slate-200/70">
                      <td className="px-4 py-3 font-semibold">{campaign.campaignName}</td>
                      <td className="px-4 py-3">{formatPercent(campaign.replyRate)}</td>
                      <td className="px-4 py-3">{formatPercent(campaign.bookedRate)}</td>
                      <td className="px-4 py-3">{formatCurrency(campaign.mrrAdded)}</td>
                      <td className="px-4 py-3 font-semibold text-teal-800">
                        {formatCurrency(campaign.revenuePerThousandEmails)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {snapshot.diagnostics.map((diagnostic) => (
                <article
                  key={diagnostic.id}
                  className="rounded-3xl border border-white/70 bg-white/75 p-5"
                >
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">
                    Diagnostic signal
                  </p>
                  <p className="mt-2 text-xl font-semibold">
                    {formatCurrency(diagnostic.calculatedLeak)} leak identified
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Pain score {diagnostic.selfReportedPainLevel}/10 • {diagnostic.timeOnPageSeconds}
                    s on page • {diagnostic.scrollDepthPercent}% scroll depth
                  </p>
                  <p className="mt-3 text-sm font-medium text-slate-800">
                    {diagnostic.desiredOutcome}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_1fr_1fr]">
          <div className="glass-card rounded-[2rem] p-6">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-slate-500">
              Automation Layer
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Reduce thinking load</h2>
            <div className="mt-5 space-y-3">
              {snapshot.automationRules.map((rule) => (
                <div
                  key={rule.id}
                  className="rounded-2xl border border-white/70 bg-white/75 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900">{rule.trigger}</p>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-emerald-900">
                      {rule.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{rule.action}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-[2rem] p-6">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-slate-500">
              Vertical Intelligence
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Adaptive offer modules</h2>
            <div className="mt-5 space-y-4">
              {snapshot.verticalModules.map((module) => (
                <article
                  key={module.id}
                  className="rounded-3xl border border-white/70 bg-white/75 p-4"
                >
                  <p className="text-lg font-semibold text-slate-900">{module.vertical}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{module.summary}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {module.metrics.map((metric) => (
                      <span
                        key={metric}
                        className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white"
                      >
                        {metric}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] bg-gradient-to-br from-[#102130] via-[#17334a] to-[#0f766e] p-6 text-white shadow-2xl">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-cyan-100/80">
              Operating Summary
            </p>
            <h2 className="mt-2 text-2xl font-semibold">What makes this different</h2>
            <ul className="mt-5 space-y-4 text-sm leading-6 text-cyan-50/90">
              <li>Tracks revenue math instead of vanity activity.</li>
              <li>Measures signal intensity from first outbound touch to close.</li>
              <li>Models belief progression instead of a lazy linear deal stage.</li>
              <li>Surfaces leak exposure so priority is obvious.</li>
              <li>Forecasts weighted revenue with explicit probability math.</li>
            </ul>

            <div className="mt-6 rounded-3xl bg-white/10 p-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-100/70">
                Stage map
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {PIPELINE_STAGES.map((stage) => (
                  <span
                    key={stage}
                    className="rounded-full border border-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]"
                  >
                    {stage}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
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
