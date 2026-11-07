-- Phase 6 offline role tests. Postgres test fixture simulates Supabase JWT roles.
-- Live Supabase project tests are still mandatory before production.
\set ON_ERROR_STOP on
\echo 'Checking import job RLS and security-invoker index exposure'

set role anon;
do $anon$
declare denied boolean:=false;
begin
  begin
    perform 1 from public.nb_import_jobs;
  exception when insufficient_privilege then denied:=true;
  end;
  if not denied then raise exception 'Anonymous import audit exposure'; end if;
  denied:=false;
  begin
    perform 1 from public.nb_studio_product_index;
  exception when insufficient_privilege then denied:=true;
  end;
  if not denied then raise exception 'Anonymous staff index exposure'; end if;
end $anon$;
reset role;

select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
select set_config('request.jwt.claims','{"iss":"https://test.supabase.co/auth/v1","app_metadata":{"nb_role":"editor"}}',false);
set role authenticated;
insert into public.nb_import_jobs(import_key,kind,filename,status,total_count,created_by)
  values(repeat('a',64),'csv','catalogue.csv','pending',1,'11111111-1111-4111-8111-111111111111');
insert into public.nb_import_rows(job_id,row_number,sku,status)
  select id,1,'NB-CI-1','pending' from public.nb_import_jobs where import_key=repeat('a',64);
do $editor$
begin
  if (select count(*) from public.nb_studio_product_index)=0 then
    raise exception 'Staff index did not return published or private product records';
  end if;
  if (select count(*) from public.nb_import_rows) <> 1 then
    raise exception 'Staff cannot read own imported row audit';
  end if;
end $editor$;
reset role;

select set_config('request.jwt.claim.sub','',false);
select set_config('request.jwt.claims','{}',false);
set role authenticated;
do $roleless$
begin
  if exists(select 1 from public.nb_import_rows) then
    raise exception 'Role-less authenticated account can read private import audit';
  end if;
  if exists(select 1 from public.nb_studio_product_index) then
    raise exception 'Role-less authenticated account can see staff product index';
  end if;
end $roleless$;
reset role;
-- Separate editors may each import the same file. Their job ID and
-- change permissions are scoped to their own identity.
insert into auth.users (id) values ('33333333-3333-4333-8333-333333333333');
select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',false);
select set_config('request.jwt.claims','{"iss":"https://test.supabase.co/auth/v1","app_metadata":{"nb_role":"editor"}}',false);
set role authenticated;
insert into public.nb_import_jobs(import_key,kind,filename,status,total_count,created_by)
  values (repeat('a',64),'csv','same-filename.csv','pending',1,
    '33333333-3333-4333-8333-333333333333');

do $owner_scope$
declare
  own_count integer;
  changed integer;
begin
  select count(*) into own_count from public.nb_import_jobs where import_key=repeat('a',64);
  if own_count <> 2 then
    raise exception 'Same file hash is not allowed for distinct authorized staff';
  end if;
  update public.nb_import_jobs set filename='unauthorized-override.csv'
    where import_key=repeat('a',64)
      and created_by='11111111-1111-4111-8111-111111111111';
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'Editor modified another staff import job'; end if;
  update public.nb_import_jobs set filename='authorized-own-update.csv'
    where import_key=repeat('a',64)
      and created_by='33333333-3333-4333-8333-333333333333';
  get diagnostics changed = row_count;
  if changed <> 1 then raise exception 'Editor cannot update their own import job'; end if;
end $owner_scope$;
reset role;

\echo 'Import and staff index SQL privilege tests PASSED'
