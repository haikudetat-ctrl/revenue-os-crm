export function CrmBrand() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-[rgba(33,42,52,0.12)] bg-[linear-gradient(145deg,rgba(77,91,134,0.18),rgba(30,102,104,0.14))] shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
        <svg
          aria-hidden="true"
          className="h-8 w-8 text-[var(--foreground)]"
          viewBox="0 0 40 40"
        >
          <path
            d="M10 10h8a5 5 0 0 1 5 5v2h7"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.4"
          />
          <path
            d="M30 17l-3-3m3 3l-3 3"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.4"
          />
          <path
            d="M10 29h8a5 5 0 0 0 5-5v-2h7"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.4"
          />
          <circle cx="10" cy="10" r="2.6" fill="currentColor" />
          <circle cx="10" cy="29" r="2.6" fill="currentColor" />
          <circle cx="30" cy="22" r="2.6" fill="currentColor" />
        </svg>
      </div>

      <div className="min-w-0">
        <p className="text-[0.95rem] font-semibold uppercase tracking-[-0.03em] text-[var(--foreground)]">
          Revenue OS
        </p>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--ink-soft)]">
          CRM
        </p>
      </div>
    </div>
  );
}
