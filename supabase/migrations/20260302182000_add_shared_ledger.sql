create table if not exists public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  entry_type text not null check (entry_type in ('Expense', 'Revenue')),
  occurred_on date not null default current_date,
  owner_name text not null default '',
  description text not null,
  notes text not null default '',
  amount numeric(12,2) not null default 0 check (amount >= 0),
  created_at timestamptz not null default now()
);

create index if not exists ledger_entries_occurred_on_idx
on public.ledger_entries (occurred_on desc, created_at desc);
