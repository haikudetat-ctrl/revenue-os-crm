"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CRM_NAV_ITEMS } from "@/lib/crm-nav";

export function CrmNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2">
      {CRM_NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            className={`rounded-2xl border px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.12em] transition-colors ${
              isActive
                ? "border-[rgba(33,42,52,0.18)] bg-[linear-gradient(135deg,rgba(77,91,134,0.9),rgba(30,102,104,0.92))] text-[#f5efe4] shadow-[0_8px_24px_rgba(33,42,52,0.16)]"
                : "border-[rgba(33,42,52,0.1)] bg-[rgba(255,255,255,0.42)] text-[var(--foreground)] hover:border-[rgba(33,42,52,0.16)] hover:bg-[rgba(255,255,255,0.62)]"
            }`}
            href={item.href}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
