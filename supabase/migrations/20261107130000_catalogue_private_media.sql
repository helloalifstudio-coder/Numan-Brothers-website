-- Phase 2: catalogue associations, indexed search, private upload staging.
-- Forward-only migration. DO NOT apply to legacy Firebase or unrelated gym DB.
begin;

-- Refuse an implicit live data migration: approved assets must first be
-- reconciled from the old public bucket to private staging/public delivery.
do $gate$
begin
  if exists (select 1 from public.nb_media where approved)
     or exists (select 1 from public.nb_products where status = 'published') then
    raise exception 'Existing live catalogue/media detected. Perform an audited asset backfill before Phase 2 migration.';
  end if;
end $gate$;

-- The candidate public bucket must not continue exposing pending uploads.
update storage.buckets set public = false where id = 'nb-media';
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('nb-media-staging','nb-media-staging',false,52428800,
    array['image/jpeg','image/png','image/webp','image/avif','image/gif','video/mp4','video/webm']),
       ('nb-media-public','nb-media-public',true,52428800,
    array['image/jpeg','image/png','image/webp','image/avif','image/gif','video/mp4','video/webm'])
on conflict (id) do nothing;

-- Clean up permissions inherited from the old upload implementation.
drop policy if exists nb_storage_staff_select on storage.objects;
drop policy if exists nb_storage_staff_insert on storage.objects;
drop policy if exists nb_storage_publisher_update on storage.objects;
drop policy if exists nb_storage_owner_delete on storage.objects;

create policy nb_staging_staff_select on storage.objects for select to authenticated
  using (bucket_id = 'nb-media-staging' and (select public.nb_can_edit()));
create policy nb_staging_staff_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'nb-media-staging'
    and (select public.nb_can_edit())
    and (storage.foldername(name))[1] = (select auth.uid())::text);
-- Only the server-side media promotion function may INSERT into public delivery.
-- Do not grant authenticated INSERT/UPDATE/DELETE on nb-media-public.

-- Approval itself is privileged: editors/admins only update descriptions,
-- not the approved boolean. The Edge Function uses a server-only admin key.
revoke update on public.nb_media from authenticated;
grant update (alt_text) on public.nb_media to authenticated;

-- The same private object path is copied to the public bucket only after
-- approval. Keep URL generation stable for existing draft JSON shapes.
create or replace function public.nb_media_public_url(path text)
returns text language sql stable security invoker set search_path = ''
as $$
  select case
    when ((select auth.jwt()) ->> 'iss')
      ~ '^https://[a-z0-9-]+[.]supabase[.]co/auth/v1$'
    then regexp_replace((select auth.jwt()) ->> 'iss','/auth/v1$','')
      || '/storage/v1/object/public/nb-media-public/' || path
    else null
  end;
$$;

create table public.nb_product_categories (
  product_id uuid not null references public.nb_products(id) on delete cascade,
  category_path text not null references public.nb_categories(path) on delete restrict,
  primary key(product_id,category_path)
);
create index nb_product_categories_route_idx on public.nb_product_categories(category_path,product_id);

create table public.nb_product_media (
  product_id uuid not null references public.nb_products(id) on delete cascade,
  media_id uuid not null references public.nb_media(id) on delete restrict,
  sort_order integer not null check (sort_order >= 0),
  is_cover boolean not null default false,
  primary key(product_id,media_id),
  unique(product_id,sort_order)
);
create unique index nb_product_media_one_cover_idx on public.nb_product_media(product_id) where is_cover;
create index nb_product_media_asset_idx on public.nb_product_media(media_id);

alter table public.nb_product_categories enable row level security;
alter table public.nb_product_media enable row level security;
revoke all on public.nb_product_categories, public.nb_product_media from public, anon, authenticated;
grant select on public.nb_product_categories, public.nb_product_media to anon, authenticated;
grant insert, delete on public.nb_product_categories, public.nb_product_media to authenticated;

-- Anonymous reads are limited to associations of approved published items.
create policy nb_product_categories_read on public.nb_product_categories for select
  to anon, authenticated using (
    (select public.nb_can_edit()) or exists (
      select 1 from public.nb_products p
      where p.id=product_id and p.status='published'
    ));
create policy nb_product_media_read on public.nb_product_media for select
  to anon, authenticated using (
    (select public.nb_can_edit()) or exists (
      select 1 from public.nb_products p
      where p.id=product_id and p.status='published'
    ));
create policy nb_product_categories_write on public.nb_product_categories for insert
  to authenticated with check ((select public.nb_can_publish()));
create policy nb_product_categories_delete on public.nb_product_categories for delete
  to authenticated using ((select public.nb_can_publish()));
create policy nb_product_media_write on public.nb_product_media for insert
  to authenticated with check ((select public.nb_can_publish()));
create policy nb_product_media_delete on public.nb_product_media for delete
  to authenticated using ((select public.nb_can_publish()));

-- Guard the association tables with the existing authorized publication
-- transaction scope; these are not free-form REST edit endpoints.
create or replace function public.nb_require_publish_scope()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  if not public.nb_can_publish() or
    current_setting('app.nb_publish_scope', true) is distinct from TG_ARGV[0] then
    raise exception 'Use the publishing workflow' using errcode = '42501';
  end if;
  if TG_OP = 'DELETE' then return old; end if;
  return new;
end;
$$;
create trigger nb_product_categories_guard before insert or delete or update
  on public.nb_product_categories for each row
  execute function public.nb_require_publish_scope('product');
create trigger nb_product_media_guard before insert or delete or update
  on public.nb_product_media for each row
  execute function public.nb_require_publish_scope('product');

-- Read-model associations are rebuilt atomically from the existing,
-- validated published product arrays, without duplicating a second CMS form.
create or replace function public.nb_sync_published_associations()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  delete from public.nb_product_categories where product_id = new.id;
  delete from public.nb_product_media where product_id = new.id;
  if new.status = 'published' then
    insert into public.nb_product_categories(product_id,category_path)
      select distinct new.id, route
      from unnest(new.category_paths) as route;
    insert into public.nb_product_media(product_id,media_id,sort_order,is_cover)
      select new.id, m.id, (photo.ordinality - 1)::integer, photo.ordinality = 1
      from unnest(new.image_urls) with ordinality as photo(url,ordinality)
      join public.nb_media m
        on m.approved and photo.url = public.nb_media_public_url(m.storage_path);
    if (select count(*) from public.nb_product_media where product_id = new.id)
       <> cardinality(new.image_urls) then
      raise exception 'Published product media associations could not be validated';
    end if;
  end if;
  return new;
end;
$$;
create trigger nb_product_associations_sync after insert or update on public.nb_products
  for each row execute function public.nb_sync_published_associations();

-- PostgreSQL GIN expression search for case-insensitive SKU/title filtering.
create extension if not exists pg_trgm;
create index nb_products_title_trgm_idx on public.nb_products using gin (title gin_trgm_ops)
  where status='published';
create index nb_products_sku_trgm_idx on public.nb_products using gin (sku gin_trgm_ops)
  where status='published';
create index nb_products_published_page_idx on public.nb_products
  (department, updated_at desc, id) where status='published';

commit;
