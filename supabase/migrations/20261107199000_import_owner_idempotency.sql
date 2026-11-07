-- Phase 6 reconciliation: imported files must be scoped to their uploader.
-- Two authorized staff members can import the same CSV independently without
-- receiving another staff member's job ID or modifying their audit trail.
begin;

alter table public.nb_import_jobs
  drop constraint if exists nb_import_jobs_import_key_key;

create unique index if not exists nb_import_jobs_owner_fingerprint_uq
  on public.nb_import_jobs(created_by, import_key);

commit;
