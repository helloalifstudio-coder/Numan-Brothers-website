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
\echo 'Import and staff index SQL privilege tests PASSED'
