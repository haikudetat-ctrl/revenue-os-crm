create table if not exists public.startup_checklist_progress (
  user_email text not null,
  user_name text not null,
  section_id text not null,
  item_label text not null,
  item_key text not null,
  completed_at timestamptz not null default timezone('utc'::text, now()),
  created_at timestamptz not null default timezone('utc'::text, now()),
  primary key (user_email, item_key)
);

create index if not exists startup_checklist_progress_user_email_idx
  on public.startup_checklist_progress (user_email);
