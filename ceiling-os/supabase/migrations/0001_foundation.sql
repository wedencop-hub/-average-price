-- СТЕЛЯ OS foundation schema
-- Prepared but intentionally NOT applied yet because the connected Supabase SQL endpoint is timing out.

create extension if not exists pgcrypto;

create type public.app_role as enum (
  'super_admin','company_owner','admin','manager','estimator','foreman',
  'installer','accountant','warehouse_manager','production_manager','viewer'
);

create type public.subscription_plan_code as enum ('FREE','PRO','BUSINESS','ENTERPRISE');
create type public.subscription_status as enum ('trialing','active','past_due','cancelled','expired');

create table public.app_users (
  id uuid primary key references auth.users(id) on delete cascade,
  telegram_id bigint not null unique,
  username text,
  first_name text,
  last_name text,
  phone text,
  locale text not null default 'uk',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_user_id uuid not null references public.app_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.company_memberships (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references public.app_users(id) on delete cascade,
  role public.app_role not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(company_id,user_id)
);

create table public.subscription_plans (
  code public.subscription_plan_code primary key,
  name text not null,
  max_objects integer,
  features jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references public.companies(id) on delete cascade,
  plan_code public.subscription_plan_code not null references public.subscription_plans(code),
  status public.subscription_status not null default 'trialing',
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  grace_until timestamptz,
  provider text,
  provider_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  actor_user_id uuid references public.app_users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index company_memberships_user_idx on public.company_memberships(user_id);
create index company_memberships_company_idx on public.company_memberships(company_id);
create index audit_log_company_created_idx on public.audit_log(company_id, created_at desc);

insert into public.subscription_plans(code,name,max_objects,features) values
 ('FREE','Безкоштовний',10,'{"basic_constructor":true,"basic_estimates":true,"limited_nomenclature":true}'::jsonb),
 ('PRO','PRO',null,'{"advanced_constructor":true,"unlimited_objects":true,"documents":true,"internal_cost":true}'::jsonb),
 ('BUSINESS','BUSINESS',null,'{"team":true,"payroll":true,"warehouse":true,"production":true,"finance":true,"analytics":true}'::jsonb),
 ('ENTERPRISE','ENTERPRISE',null,'{"multi_company":true,"branches":true,"multi_warehouse":true,"advanced_permissions":true,"advanced_analytics":true}'::jsonb)
on conflict (code) do update set name=excluded.name,max_objects=excluded.max_objects,features=excluded.features;

alter table public.app_users enable row level security;
alter table public.companies enable row level security;
alter table public.company_memberships enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.audit_log enable row level security;

create policy app_users_self_select on public.app_users
  for select to authenticated using (id = (select auth.uid()));

create policy app_users_self_update on public.app_users
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy memberships_select_own on public.company_memberships
  for select to authenticated using (user_id = (select auth.uid()));

create policy companies_select_member on public.companies
  for select to authenticated
  using (exists (select 1 from public.company_memberships m where m.company_id = companies.id and m.user_id = (select auth.uid()) and m.is_active));

create policy companies_insert_owner on public.companies
  for insert to authenticated
  with check (owner_user_id = (select auth.uid()));

create policy companies_update_owner on public.companies
  for update to authenticated
  using (owner_user_id = (select auth.uid()))
  with check (owner_user_id = (select auth.uid()));

create policy plans_select_authenticated on public.subscription_plans
  for select to authenticated using (true);

create policy subscriptions_select_member on public.subscriptions
  for select to authenticated
  using (exists (select 1 from public.company_memberships m where m.company_id = subscriptions.company_id and m.user_id = (select auth.uid()) and m.is_active));

create policy audit_select_member on public.audit_log
  for select to authenticated
  using (company_id is null or exists (select 1 from public.company_memberships m where m.company_id = audit_log.company_id and m.user_id = (select auth.uid()) and m.is_active));
