# Revenue OS CRM

A signal-first CRM built for Vercel + Supabase. It is designed around five operating questions:

- Where did the signal originate?
- What math do we know about this prospect?
- What friction are they experiencing?
- What stage of belief are they in?
- What is the probability-weighted revenue?

This starter includes:

- A Next.js 16 App Router frontend ready for Vercel.
- A Supabase schema covering accounts, contacts, signals, diagnostics, deals, automations, and vertical modules.
- A server-side data layer that reads from Supabase when environment variables are present.
- A seeded fallback dataset so the UI still renders before the database is connected.

## Local Development

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Copy `.env.example` to `.env.local` and set:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

`SUPABASE_SERVICE_ROLE_KEY` is recommended because the dashboard loads server-side and can safely use privileged reads on Vercel. If the variables are missing, the app falls back to bundled mock data.

To enable the new login gate for you and your partner, also add:

```bash
CRM_SESSION_SECRET=...
CRM_USER_1_EMAIL=...
CRM_USER_1_PASSWORD=...
CRM_USER_1_NAME=...
CRM_USER_2_EMAIL=...
CRM_USER_2_PASSWORD=...
CRM_USER_2_NAME=...
```

Auth only turns on when `CRM_SESSION_SECRET` is set and at least one `CRM_USER_*` account is configured. Until then, the CRM remains accessible without login so you can stage the rollout safely.

## Supabase Setup

Create a new Supabase project, then run the included migration:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

The migration lives at [supabase/migrations/20260302113000_revenue_os.sql](/Users/surfturf/TR-CRM1.0/supabase/migrations/20260302113000_revenue_os.sql).

## Deploy to Vercel

1. Push this repository to GitHub.
2. Import it into Vercel as a Next.js project.
3. Add the Supabase environment variables in the Vercel project settings.
4. Redeploy after the Supabase schema is applied.

## Project Structure

- [src/app/page.tsx](/Users/surfturf/TR-CRM1.0/src/app/page.tsx): server-rendered entrypoint.
- [src/components/crm-dashboard.tsx](/Users/surfturf/TR-CRM1.0/src/components/crm-dashboard.tsx): primary CRM UI.
- [src/lib/data.ts](/Users/surfturf/TR-CRM1.0/src/lib/data.ts): Supabase fetch + fallback logic.
- [src/lib/mock-data.ts](/Users/surfturf/TR-CRM1.0/src/lib/mock-data.ts): seeded dataset and dashboard calculations.
- [src/lib/types.ts](/Users/surfturf/TR-CRM1.0/src/lib/types.ts): domain types.

## Current Scope

This is a production-oriented MVP, not a finished multi-tenant SaaS. It gives you:

- The math layer for accounts.
- Belief-progression pipeline stages.
- AI SDR classification and weighted revenue math.
- Revenue intelligence views and campaign performance.
- Automation rules and vertical intelligence modules.

The next practical extension is adding authenticated write flows (forms/actions) on top of the existing schema.
