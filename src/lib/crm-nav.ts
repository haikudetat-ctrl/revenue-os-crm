export const CRM_NAV_ITEMS = [
  { href: "/", label: "Overview" },
  { href: "/workspace", label: "Workspace" },
  { href: "/deals", label: "Deals" },
  { href: "/accounts", label: "Accounts" },
  { href: "/contacts", label: "Contacts" },
  { href: "/revenue", label: "Revenue" },
] as const;

export const CRM_APP_PATHS = CRM_NAV_ITEMS.map((item) => item.href);
