-- СТЕЛЯ OS: provider-neutral PostgreSQL foundation
-- No Supabase-specific extensions, auth, or RLS dependencies.

create extension if not exists pgcrypto;

create type user_role as enum (
  'super_admin','company_owner','admin','manager','estimator','foreman',
  'installer','accountant','warehouse_manager','production_manager','viewer'
);

create type subscription_plan_code as enum ('FREE','PRO','BUSINESS','ENTERPRISE');
create type subscription_status as enum ('trialing','active','past_due','cancelled','expired');

create table app_users (
  id uuid primary key default gen_random_uuid(),
  telegram_user_id bigint not null unique,
  username text,
  first_name text,
  last_name text,
  language_code text not null default 'uk',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  owner_user_id uuid not null references app_users(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table company_memberships (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  user_id uuid not null references app_users(id) on delete cascade,
  role user_role not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, user_id)
);

create table subscription_plans (
  code subscription_plan_code primary key,
  name text not null,
  max_objects integer,
  max_members integer,
  features jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references companies(id) on delete cascade,
  plan_code subscription_plan_code not null references subscription_plans(code),
  status subscription_status not null default 'trialing',
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  grace_until timestamptz,
  provider text,
  provider_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table auth_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table audit_log (
  id bigserial primary key,
  company_id uuid references companies(id) on delete set null,
  user_id uuid references app_users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_memberships_user on company_memberships(user_id);
create index idx_memberships_company on company_memberships(company_id);
create index idx_sessions_user on auth_sessions(user_id);
create index idx_sessions_expiry on auth_sessions(expires_at);
create index idx_audit_company_created on audit_log(company_id, created_at desc);
create index idx_audit_entity on audit_log(entity_type, entity_id);

insert into subscription_plans(code, name, max_objects, max_members, features) values
('FREE','FREE',20,1,'{"constructor":"basic","estimates":"basic","nomenclature":"limited"}'),
('PRO','PRO',null,3,'{"constructor":"advanced","estimates":"advanced","documents":true,"cost":true}'),
('BUSINESS','BUSINESS',null,100,'{"team":true,"payroll":true,"warehouse":true,"production":true,"finance":true,"accounting":true,"analytics":true}'),
('ENTERPRISE','ENTERPRISE',null,null,'{"multi_company":true,"branches":true,"multi_warehouse":true,"advanced_permissions":true,"advanced_analytics":true}')
on conflict (code) do nothing;

create or replace function set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_users_updated on app_users;
create trigger trg_users_updated before update on app_users for each row execute function set_updated_at();
drop trigger if exists trg_companies_updated on companies;
create trigger trg_companies_updated before update on companies for each row execute function set_updated_at();
drop trigger if exists trg_memberships_updated on company_memberships;
create trigger trg_memberships_updated before update on company_memberships for each row execute function set_updated_at();
drop trigger if exists trg_subscriptions_updated on subscriptions;
create trigger trg_subscriptions_updated before update on subscriptions for each row execute function set_updated_at();

-- Foundation invariant: every company owner has an active membership.
-- Enforced by application transaction when a company is created; no provider-specific trigger required.
