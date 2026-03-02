create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'acquisition_model') then
    create type acquisition_model as enum ('Paid', 'Referral', 'Organic');
  end if;

  if not exists (select 1 from pg_type where typname = 'response_type') then
    create type response_type as enum ('Positive', 'Neutral', 'Objection', 'Not Now');
  end if;

  if not exists (select 1 from pg_type where typname = 'reply_classification') then
    create type reply_classification as enum (
      'Interested',
      'Send Info',
      'Budget Objection',
      'Timing Objection',
      'Referral',
      'Wrong Person',
      'Hostile'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'pipeline_stage') then
    create type pipeline_stage as enum (
      'Cold Signal',
      'Engaged Signal',
      'Math Exposure',
      'Problem Acknowledged',
      'Friction Confirmed',
      'Architecture Proposed',
      'Closed - Installed'
    );
  end if;
end $$;

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  industry_vertical text not null,
  revenue_band text not null,
  employee_count integer not null default 0,
  location text not null,
  tech_stack text[] not null default '{}',
  ad_channels_used text[] not null default '{}',
  booking_software text not null default '',
  crm_used text not null default '',
  acquisition_model acquisition_model not null default 'Organic',
  estimated_ltv numeric(12,2) not null default 0,
  estimated_lead_volume integer not null default 0,
  estimated_conversion_rate numeric(5,2) not null default 0,
  estimated_revenue_leak_percent numeric(5,2) not null default 0,
  estimated_monthly_revenue_leak numeric(12,2) not null default 0,
  signal_score integer not null default 0 check (signal_score between 0 and 100),
  icp_fit_score integer not null default 0 check (icp_fit_score between 0 and 100),
  owner_persona_type text not null default '',
  friction_summary text not null default '',
  belief_stage pipeline_stage not null default 'Cold Signal',
  vertical_metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  name text not null,
  title text not null default '',
  linkedin text not null default '',
  email text not null,
  phone text not null default '',
  role_in_decision text not null default '',
  authority_level integer not null default 1 check (authority_level between 1 and 5),
  influence_level integer not null default 1 check (influence_level between 1 and 5),
  engagement_score integer not null default 0 check (engagement_score between 0 and 100),
  sentiment_tag text not null default '',
  response_type response_type not null default 'Neutral',
  created_at timestamptz not null default now()
);

create table if not exists public.campaign_signals (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  campaign_name text not null,
  email_step integer not null check (email_step > 0),
  opened boolean not null default false,
  clicked boolean not null default false,
  replied boolean not null default false,
  reply_sentiment text not null default '',
  ai_classification reply_classification not null default 'Send Info',
  time_to_first_response_hours integer,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.diagnostics (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  calculator_inputs jsonb not null default '{}'::jsonb,
  calculated_leak numeric(12,2) not null default 0,
  self_reported_pain_level integer not null default 1 check (self_reported_pain_level between 1 and 10),
  desired_outcome text not null default '',
  booking_timestamp timestamptz,
  time_on_page_seconds integer not null default 0,
  scroll_depth_percent integer not null default 0 check (scroll_depth_percent between 0 and 100),
  created_at timestamptz not null default now()
);

create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  primary_contact_id uuid not null references public.contacts(id) on delete restrict,
  name text not null,
  stage pipeline_stage not null default 'Cold Signal',
  arr_opportunity numeric(12,2) not null default 0,
  estimated_leak numeric(12,2) not null default 0,
  pain_score integer not null default 0 check (pain_score between 0 and 100),
  authority_level integer not null default 1 check (authority_level between 1 and 5),
  engagement_score integer not null default 0 check (engagement_score between 0 and 100),
  icp_fit_score integer not null default 0 check (icp_fit_score between 0 and 100),
  probability_score numeric(5,2) generated always as (
    least(
      greatest(
        icp_fit_score * (engagement_score / 100.0) * (pain_score / 100.0) * (authority_level / 5.0),
        0
      ),
      100
    )
  ) stored,
  weighted_revenue numeric(12,2) generated always as (
    arr_opportunity * (
      least(
        greatest(
          icp_fit_score * (engagement_score / 100.0) * (pain_score / 100.0) * (authority_level / 5.0),
          0
        ),
        100
      ) / 100.0
    )
  ) stored,
  time_in_stage_days integer not null default 0,
  next_action text not null default '',
  owner_name text not null default '',
  source text not null default '',
  outbound_cost numeric(12,2) not null default 0,
  proposal_sent_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.deal_stage_events (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  stage pipeline_stage not null,
  entered_at timestamptz not null default now(),
  exited_at timestamptz
);

create table if not exists public.automation_rules (
  id uuid primary key default gen_random_uuid(),
  trigger_name text not null,
  action_name text not null,
  status text not null default 'Active',
  created_at timestamptz not null default now()
);

create table if not exists public.vertical_modules (
  id uuid primary key default gen_random_uuid(),
  vertical text not null,
  summary text not null default '',
  metrics text[] not null default '{}',
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_accounts_updated_at on public.accounts;
create trigger set_accounts_updated_at
before update on public.accounts
for each row execute function public.set_updated_at();

drop trigger if exists set_deals_updated_at on public.deals;
create trigger set_deals_updated_at
before update on public.deals
for each row execute function public.set_updated_at();

create or replace view public.revenue_intelligence as
select
  d.source as campaign_name,
  count(*) as deals_created,
  sum(case when d.stage = 'Closed - Installed' then d.arr_opportunity / 12.0 else 0 end) as mrr_added,
  avg(d.time_in_stage_days)::numeric(10,2) as avg_time_in_stage_days,
  sum(d.weighted_revenue) as weighted_revenue
from public.deals d
group by d.source;
