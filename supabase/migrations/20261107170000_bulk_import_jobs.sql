-- Phase 4: resumable audit-friendly catalogue onboarding jobs.
-- Import jobs record validated drafts; no publishing or stock-accounting writes.
begin;

-- Enforce the same SKU identity across unpublished drafts, case-insensitively.
create unique index if not exists nb_product_drafts_unique_sku_idx
  on public.nb_product_drafts (upper(trim(content->>'sku')))
  where trim(coalesce(content->>'sku','')) <> '';

create table public.nb_import_jobs (
  id uuid primary key default gen_random_uuid(),
  import_key text not null unique check (import_key ~ '^[0-9a-f]{64}$'),
  kind text not null check (kind in ('csv','images')),
  filename text not null check (char_length(filename) between 1 and 240),
  status text not null default 'pending'
    check (status in ('pending','running','completed','completed_with_errors','failed','cancelled')),
  total_count integer not null default 0 check (total_count between 0 and 200000),
  processed_count integer not null default 0 check (processed_count >= 0),
  success_count integer not null default 0 check (success_count >= 0),
  skipped_count integer not null default 0 check (skipped_count >= 0),
  error_count integer not null default 0 check (error_count >= 0),
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint nb_import_counts_consistent check (
    processed_count <= total_count
    and processed_count = success_count + skipped_count + error_count
  )
);
create index nb_import_jobs_recent_idx on public.nb_import_jobs(created_by,created_at desc);

create table public.nb_import_rows (
  job_id uuid not null references public.nb_import_jobs(id) on delete restrict,
  row_number integer not null check (row_number >= 1),
  sku text not null check (char_length(sku) between 2 and 80),
  status text not null default 'pending'
    check (status in ('pending','imported','skipped','failed')),
  product_id uuid,
  message text not null default '' check (char_length(message) <= 1000),
  created_at timestamptz not null default now(),
  primary key(job_id,row_number)
);
create index nb_import_rows_status_idx on public.nb_import_rows(job_id,status);

create trigger nb_touch_import_job before update on public.nb_import_jobs
  for each row execute function public.nb_touch_updated_at();

alter table public.nb_import_jobs enable row level security;
alter table public.nb_import_rows enable row level security;
revoke all on public.nb_import_jobs, public.nb_import_rows from public,anon,authenticated;
grant select,insert,update on public.nb_import_jobs,public.nb_import_rows to authenticated;

create policy nb_import_jobs_staff_select on public.nb_import_jobs for select to authenticated
  using ((select public.nb_can_edit()));
create policy nb_import_jobs_owner_insert on public.nb_import_jobs for insert to authenticated
  with check ((select public.nb_can_edit()) and created_by=(select auth.uid()));
create policy nb_import_jobs_owner_update on public.nb_import_jobs for update to authenticated
  using ((select public.nb_can_edit()) and created_by=(select auth.uid()))
  with check ((select public.nb_can_edit()) and created_by=(select auth.uid()));

create policy nb_import_rows_staff_select on public.nb_import_rows for select to authenticated
  using ((select public.nb_can_edit()));
create policy nb_import_rows_owner_insert on public.nb_import_rows for insert to authenticated
  with check ((select public.nb_can_edit()) and exists(
    select 1 from public.nb_import_jobs j where j.id=job_id and j.created_by=(select auth.uid())
  ));
create policy nb_import_rows_owner_update on public.nb_import_rows for update to authenticated
  using ((select public.nb_can_edit()) and exists(
    select 1 from public.nb_import_jobs j where j.id=job_id and j.created_by=(select auth.uid())
  ))
  with check ((select public.nb_can_edit()) and exists(
    select 1 from public.nb_import_jobs j where j.id=job_id and j.created_by=(select auth.uid())
  ));
commit;
