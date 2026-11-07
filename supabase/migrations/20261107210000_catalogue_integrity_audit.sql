-- Noman Brothers: production-candidate catalogue integrity and audit controls.
-- NEW CLIENT/STAGING PROJECT ONLY, after all preceding versioned migrations.
-- No inventories, orders, payment records or dummy customer merchandise.
begin;

create schema if not exists nb_internal;
revoke all on schema nb_internal from public, anon, authenticated;

-- Keep a compact immutable operational record without storing private draft
-- payloads, client passwords, raw API credentials or original upload bytes.
create table public.nb_audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid,
  event_type text not null check (event_type in (
    'product_published','homepage_published','category_updated',
    'media_approved','media_revoked','import_status_changed'
  )),
  entity_type text not null check (entity_type in (
    'product','homepage','category','media','import'
  )),
  entity_id text not null check (length(entity_id) between 1 and 128),
  meta jsonb not null default '{}'::jsonb
    check (jsonb_typeof(meta)='object' and octet_length(meta::text) <= 2000),
  occurred_at timestamptz not null default now()
);
create index nb_audit_events_recent_idx
  on public.nb_audit_events(occurred_at desc, id desc);
create index nb_audit_events_entity_idx
  on public.nb_audit_events(entity_type, entity_id, occurred_at desc);

alter table public.nb_audit_events enable row level security;
revoke all on public.nb_audit_events from public, anon, authenticated;
grant select on public.nb_audit_events to authenticated;
create policy nb_audit_owner_read on public.nb_audit_events
  for select to authenticated
  using ((select public.nb_can_publish()));

-- Only this database-owned trigger function can append audit events.
-- No API user can call it directly: it lives outside exposed public schema.
create or replace function nb_internal.nb_record_catalogue_event()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  kind text;
  type_name text;
  record_id text;
  detail jsonb := '{}'::jsonb;
begin
  case TG_TABLE_NAME
    when 'nb_products' then
      if new.status <> 'published' then return new; end if;
      kind := 'product_published'; type_name := 'product';
      record_id := new.id::text; detail := jsonb_build_object('sku',new.sku);
    when 'nb_home_public' then
      kind := 'homepage_published'; type_name := 'homepage';
      record_id := 'home'; detail := jsonb_build_object('version',new.version);
    when 'nb_categories' then
      if TG_OP = 'UPDATE' and
        row(new.description,new.image_url,new.active,new.sort_order) is not distinct from
        row(old.description,old.image_url,old.active,old.sort_order) then
        return new;
      end if;
      kind := 'category_updated'; type_name := 'category';
      record_id := new.path;
    when 'nb_media' then
      if new.approved is not distinct from old.approved then return new; end if;
      kind := case when new.approved then 'media_approved' else 'media_revoked' end;
      type_name := 'media'; record_id := new.id::text;
    when 'nb_import_jobs' then
      if new.status is not distinct from old.status then return new; end if;
      kind := 'import_status_changed'; type_name := 'import';
      record_id := new.id::text; detail := jsonb_build_object('status',new.status);
    else
      raise exception 'Unexpected audit trigger target' using errcode = '42501';
  end case;
  insert into public.nb_audit_events(actor_id,event_type,entity_type,entity_id,meta)
    values (auth.uid(), kind, type_name, record_id, detail);
  return new;
end
$$;
revoke all on function nb_internal.nb_record_catalogue_event() from public, anon, authenticated;

create trigger nb_audit_products after insert or update on public.nb_products
  for each row execute function nb_internal.nb_record_catalogue_event();
create trigger nb_audit_home after insert or update on public.nb_home_public
  for each row execute function nb_internal.nb_record_catalogue_event();
create trigger nb_audit_categories after update on public.nb_categories
  for each row execute function nb_internal.nb_record_catalogue_event();
create trigger nb_audit_media after update of approved on public.nb_media
  for each row execute function nb_internal.nb_record_catalogue_event();
create trigger nb_audit_import_jobs after update of status on public.nb_import_jobs
  for each row execute function nb_internal.nb_record_catalogue_event();

-- Independent, server-side guard: even a service-role update cannot revoke a
-- file that a published product/homepage/collection still references.
-- This complements Edge Function preflight checks and protects against
-- administrative mistakes. Media bytes still require Storage reconciliation.
create or replace function nb_internal.nb_guard_media_revocation()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  suffix text := '/nb-media-public/' || old.storage_path;
begin
  if old.approved is true and new.approved is false then
    if exists (
      select 1 from public.nb_product_media pm
      join public.nb_products p on p.id = pm.product_id
      where pm.media_id=old.id and p.status='published'
    ) or exists (
      select 1 from public.nb_products p
      where p.status='published'
        and (
          right(coalesce(p.video_url,''),length(suffix)) = suffix
          or exists (
            select 1 from unnest(p.image_urls) as photo(url)
            where right(photo.url,length(suffix)) = suffix
          )
        )
    ) or exists (
      select 1 from public.nb_categories c
      where right(coalesce(c.image_url,''),length(suffix)) = suffix
        and c.active
    ) or exists (
      select 1 from public.nb_home_public h
      where exists (
        select 1 from (values
          (h.content->>'heroImage'), (h.content->>'menImage'),
          (h.content->>'kidsImage'), (h.content->>'storyImage')
        ) as asset(url)
        where right(coalesce(asset.url,''),length(suffix)) = suffix
      )
    ) then
      raise exception 'Media is referenced by published content; unpublish or replace it first'
        using errcode = '23503';
    end if;
  end if;
  return new;
end
$$;
revoke all on function nb_internal.nb_guard_media_revocation() from public, anon, authenticated;
create trigger nb_approved_media_reference_guard
  before update of approved on public.nb_media
  for each row execute function nb_internal.nb_guard_media_revocation();

-- Additional indexes for large approved-media libraries and the staff studio.
create index nb_media_approved_recent_idx
  on public.nb_media(created_at desc,id desc) where approved;
create index nb_media_filename_trgm_idx
  on public.nb_media using gin (original_name gin_trgm_ops);
create index nb_product_drafts_changed_idx
  on public.nb_product_drafts(updated_at desc,product_id);
create index nb_product_revisions_recent_idx
  on public.nb_product_revisions(product_id,published_at desc);

-- Observe catalogue size without reading private staff/media data.
-- Metrics are returned only to a signed-in manager. Security invoker by default.
create or replace function public.nb_catalogue_health()
returns table(
  published_products bigint, private_drafts bigint, approved_assets bigint,
  pending_assets bigint, total_import_jobs bigint
)
language plpgsql stable security invoker set search_path = ''
as $$
begin
  if not public.nb_can_publish() then
    raise exception 'Manager access required' using errcode='42501';
  end if;
  return query
  select
    (select count(*) from public.nb_products p where p.status='published'),
    (select count(*) from public.nb_product_drafts),
    (select count(*) from public.nb_media m where m.approved),
    (select count(*) from public.nb_media m where not m.approved),
    (select count(*) from public.nb_import_jobs);
end
$$;
revoke all on function public.nb_catalogue_health() from public, anon, authenticated;
grant execute on function public.nb_catalogue_health() to authenticated;

commit;
