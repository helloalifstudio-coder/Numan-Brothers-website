-- Read-only installation inventory check; works in SQL Editor or Postgres CI.
-- Safe to run on a newly provisioned staging project. This does NOT migrate data.
begin read only;

do $inventory$
declare
  expected text[] := array[
    'nb_categories','nb_products','nb_media','nb_product_drafts',
    'nb_product_revisions','nb_home_drafts','nb_home_public',
    'nb_home_revisions','nb_product_categories','nb_product_media',
    'nb_import_jobs','nb_import_rows','nb_audit_events'
  ];
  name text;
  rls_enabled boolean;
  n integer;
begin
  foreach name in array expected loop
    select c.relrowsecurity into rls_enabled
    from pg_class c join pg_namespace ns on ns.oid=c.relnamespace
    where ns.nspname='public' and c.relname=name and c.relkind in ('r','p');
    if rls_enabled is distinct from true then
      raise exception 'Required table missing or RLS disabled: %',name;
    end if;
  end loop;
  if not exists (
    select 1 from pg_class c join pg_namespace ns on ns.oid=c.relnamespace
    where ns.nspname='public' and c.relname='nb_studio_product_index' and c.relkind='v'
  ) then raise exception 'Secure staff index view missing'; end if;
  if not exists (
    select 1 from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
    where ns.nspname='public' and p.proname='nb_catalogue_health'
  ) then raise exception 'Manager health RPC missing'; end if;
  if not exists (
    select 1 from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
    where ns.nspname='public' and p.proname='nb_publish_product'
  ) then raise exception 'Product publishing RPC missing'; end if;
  if not exists (
    select 1 from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
    where ns.nspname='public' and p.proname='nb_publish_home'
  ) then raise exception 'Homepage publishing RPC missing'; end if;
  if not exists (
    select 1 from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
    where ns.nspname='public' and p.proname='nb_link_approved_media'
  ) then raise exception 'Gallery SKU matching RPC missing'; end if;
  select count(*) into n
    from storage.buckets where id='nb-media-staging' and public=false;
  if n<>1 then raise exception 'Required private staging bucket missing'; end if;
  select count(*) into n
    from storage.buckets where id='nb-media-public' and public=true;
  if n<>1 then raise exception 'Approved public delivery bucket missing'; end if;
  select count(*) into n
    from storage.buckets where id='nb-media' and public=false;
  if n<>1 then raise exception 'Legacy upload bucket is not private'; end if;
  if has_schema_privilege('anon','nb_internal','USAGE')
     or has_schema_privilege('authenticated','nb_internal','USAGE') then
    raise exception 'Internal audit trigger schema exposed to app roles';
  end if;
  if has_table_privilege('anon','public.nb_audit_events','SELECT')
     or has_table_privilege('authenticated','public.nb_audit_events','INSERT') then
    raise exception 'Audit event table privilege is too broad';
  end if;
  if not exists(
    select 1 from pg_policies where schemaname='storage'
      and tablename='objects' and policyname='nb_staging_staff_insert'
  ) then raise exception 'Storage upload policy missing'; end if;
  if not exists(
    select 1 from pg_indexes where schemaname='public'
      and indexname='nb_media_filename_trgm_idx'
  ) then raise exception 'Media search index missing'; end if;
end
$inventory$;

select
  (select count(*) from pg_class c join pg_namespace ns on ns.oid=c.relnamespace
    where ns.nspname='public' and left(c.relname,3)='nb_' 
      and c.relkind='r') as catalogue_tables,
  (select count(*) from pg_policies where schemaname='public'
    and left(tablename,3)='nb_') as catalogue_rls_policies,
  (select count(*) from storage.buckets where id in
    ('nb-media-staging','nb-media-public','nb-media')) as storage_buckets,
  'INSTALLATION INVENTORY OK' as status;

commit;
