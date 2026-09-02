create extension if not exists pgcrypto;

do $$ begin create type user_role as enum ('super_admin','company_owner','admin','manager','estimator','foreman','installer','accountant','warehouse_manager','production_manager','viewer'); exception when duplicate_object then null; end $$;
do $$ begin create type object_status as enum ('lead','measurement','estimate','contract','deposit_paid','production','ready','delivery','installation','completed','cancelled'); exception when duplicate_object then null; end $$;

create table if not exists companies (id uuid primary key default gen_random_uuid(), name text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists users (id uuid primary key default gen_random_uuid(), telegram_id bigint not null unique, username text, first_name text, last_name text, language_code text, role user_role not null default 'company_owner', company_id uuid not null references companies(id) on delete cascade, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists clients (id uuid primary key default gen_random_uuid(), company_id uuid not null references companies(id) on delete cascade, name text not null, phone text, email text, notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists objects (id uuid primary key default gen_random_uuid(), company_id uuid not null references companies(id) on delete cascade, client_id uuid not null references clients(id) on delete restrict, title text not null, address text not null default '', status object_status not null default 'lead', manager_id uuid references users(id) on delete set null, estimator_id uuid references users(id) on delete set null, foreman_id uuid references users(id) on delete set null, notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists audit_log (id uuid primary key default gen_random_uuid(), company_id uuid references companies(id) on delete cascade, user_id uuid references users(id) on delete set null, action text not null, entity_type text not null, entity_id uuid, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now());
create index if not exists idx_users_company on users(company_id);
create index if not exists idx_clients_company on clients(company_id);
create index if not exists idx_objects_company_status on objects(company_id,status);
create index if not exists idx_audit_company_created on audit_log(company_id,created_at desc);
