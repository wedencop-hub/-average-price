create table if not exists nomenclature_relations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  parent_id uuid not null references nomenclature(id) on delete cascade,
  child_id uuid not null references nomenclature(id) on delete cascade,
  quantity numeric(14,4) not null check(quantity>0),
  created_at timestamptz not null default now(),
  unique(company_id,parent_id,child_id),
  check(parent_id<>child_id)
);
create index if not exists idx_nomenclature_relations_parent on nomenclature_relations(company_id,parent_id);
