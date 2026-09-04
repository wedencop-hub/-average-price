alter table estimate_items add column if not exists nomenclature_id uuid references nomenclature(id) on delete set null;
create index if not exists idx_estimate_items_nomenclature on estimate_items(nomenclature_id);
