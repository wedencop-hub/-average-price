create type subscription_plan as enum ('free','pro','business','enterprise');
create type subscription_status as enum ('trial','active','grace','expired','cancelled');

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references companies(id) on delete cascade,
  plan subscription_plan not null default 'free',
  status subscription_status not null default 'active',
  provider text,
  provider_subscription_id text,
  started_at timestamptz not null default now(),
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz,
  grace_until timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_subscriptions_status_period on subscriptions(status,current_period_end);

create table if not exists subscription_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  subscription_id uuid references subscriptions(id) on delete set null,
  event_type text not null,
  provider text,
  provider_event_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(provider,provider_event_id)
);
create index if not exists idx_subscription_events_company_created on subscription_events(company_id,created_at desc);
