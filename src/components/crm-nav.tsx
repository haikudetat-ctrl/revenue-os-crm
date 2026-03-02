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
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white/70 text-slate-700 hover:border-slate-300 hover:bg-white"
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
