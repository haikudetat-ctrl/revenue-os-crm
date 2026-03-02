export const CRM_NAV_ITEMS = [
  { href: "/", label: "Overview" },
  { href: "/workspace", label: "Workspace" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/accounts", label: "Accounts" },
  { href: "/revenue", label: "Revenue" },
] as const;

export const CRM_APP_PATHS = CRM_NAV_ITEMS.map((item) => item.href);
