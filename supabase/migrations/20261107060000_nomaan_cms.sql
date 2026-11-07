-- Nomaan Brothers CMS: isolated, fail-closed schema. Apply ONLY to a dedicated
-- client-owned Supabase project, never to the connected "gym" project.
-- No demo products, no public-write policies, no destructive legacy-table drops.
begin;

create table if not exists public.nb_categories (
  path text primary key check (path ~ '^/(men|kids)(/[a-z0-9-]+)*$'),
  department text not null check (department in ('men','kids')),
  label text not null check (char_length(trim(label)) between 1 and 100),
  description text not null default '',
  image_url text,
  sort_order integer not null default 0,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.nb_products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique check (char_length(trim(sku)) between 2 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(trim(title)) between 2 and 180),
  department text not null check (department in ('men','kids')),
  category_paths text[] not null default '{}',
  description text not null default '',
  fabric text not null default '',
  sizes text[] not null default '{}',
  image_urls text[] not null default '{}',
  video_url text,
  price numeric(12,2) check (price is null or price >= 0),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  sort_rank integer not null default 0,
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint nb_publish_requires_catalog check (
    status <> 'published' or
    (cardinality(category_paths) > 0 and cardinality(image_urls) > 0)
  ),
  constraint nb_product_media_urls check (
    array_to_string(image_urls, ' ') !~* '(javascript:|data:|file:|<)'
    and (video_url is null or video_url ~ '^https://')
  )
);
create index if not exists nb_products_published_idx
  on public.nb_products (department, sort_rank, updated_at desc)
  where status = 'published';
create index if not exists nb_products_categories_idx on public.nb_products using gin (category_paths);

create table if not exists public.nb_media (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null unique check (storage_path !~ '(^/|[.][.])'),
  original_name text not null check (char_length(original_name) between 1 and 220),
  mime_type text not null check (mime_type in (
    'image/jpeg','image/png','image/webp','image/avif','image/gif',
    'video/mp4','video/webm'
  )),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 52428800),
  alt_text text not null default '',
  approved boolean not null default false,
  uploaded_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists nb_media_recent_idx on public.nb_media (created_at desc);

create table if not exists public.nb_home_drafts (
  key text primary key check (key = 'home'),
  content jsonb not null default '{}'::jsonb
    check (jsonb_typeof(content) = 'object' and octet_length(content::text) <= 30000),
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);
create table if not exists public.nb_home_public (
  key text primary key check (key = 'home'),
  content jsonb not null default '{}'::jsonb
    check (jsonb_typeof(content) = 'object' and octet_length(content::text) <= 30000),
  version integer not null default 1 check (version > 0),
  published_by uuid references auth.users(id),
  published_at timestamptz not null default now()
);
create table if not exists public.nb_home_revisions (
  id bigint generated always as identity primary key,
  key text not null check (key = 'home'),
  version integer not null check (version > 0),
  content jsonb not null check (jsonb_typeof(content) = 'object'),
  published_by uuid references auth.users(id),
  published_at timestamptz not null default now(),
  unique (key, version)
);

-- Roles are assigned by Supabase Auth administration ONLY (app_metadata).
-- Never authorize against mutable user_metadata or just 'authenticated'.
create or replace function public.nb_can_edit()
returns boolean language sql stable security invoker
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and coalesce((select auth.jwt()) -> 'app_metadata' ->> 'nb_role', '')
      in ('owner','admin','editor');
$$;
create or replace function public.nb_can_publish()
returns boolean language sql stable security invoker
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and coalesce((select auth.jwt()) -> 'app_metadata' ->> 'nb_role', '')
      in ('owner','admin');
$$;
create or replace function public.nb_is_owner()
returns boolean language sql stable security invoker
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and coalesce((select auth.jwt()) -> 'app_metadata' ->> 'nb_role', '') = 'owner';
$$;
create or replace function public.nb_touch_updated_at()
returns trigger language plpgsql security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists nb_touch_product on public.nb_products;
create trigger nb_touch_product before update on public.nb_products
  for each row execute function public.nb_touch_updated_at();
drop trigger if exists nb_touch_media on public.nb_media;
create trigger nb_touch_media before update on public.nb_media
  for each row execute function public.nb_touch_updated_at();
drop trigger if exists nb_touch_categories on public.nb_categories;
create trigger nb_touch_categories before update on public.nb_categories
  for each row execute function public.nb_touch_updated_at();
drop trigger if exists nb_touch_home_draft on public.nb_home_drafts;
create trigger nb_touch_home_draft before update on public.nb_home_drafts
  for each row execute function public.nb_touch_updated_at();

alter table public.nb_categories enable row level security;
alter table public.nb_products enable row level security;
alter table public.nb_media enable row level security;
alter table public.nb_home_drafts enable row level security;
alter table public.nb_home_public enable row level security;
alter table public.nb_home_revisions enable row level security;

revoke all on public.nb_categories, public.nb_products, public.nb_media,
  public.nb_home_drafts, public.nb_home_public, public.nb_home_revisions
  from public, anon, authenticated;
grant select on public.nb_categories, public.nb_products,
  public.nb_home_public to anon;
grant select on public.nb_categories, public.nb_products, public.nb_media,
  public.nb_home_drafts, public.nb_home_public, public.nb_home_revisions
  to authenticated;
grant insert, update on public.nb_products, public.nb_media,
  public.nb_home_drafts, public.nb_home_public to authenticated;
grant insert, update on public.nb_home_revisions to authenticated;
grant update on public.nb_categories to authenticated;
grant delete on public.nb_products, public.nb_media to authenticated;
grant usage, select on sequence public.nb_home_revisions_id_seq to authenticated;

-- Public catalogue reads only enabled categories, approved media metadata,
-- published garments and the approved homepage document.
create policy nb_categories_public_select on public.nb_categories for select
  to anon, authenticated using (active or (select public.nb_can_edit()));
create policy nb_categories_publisher_update on public.nb_categories for update
  to authenticated using ((select public.nb_can_publish()))
  with check ((select public.nb_can_publish()));
create policy nb_products_public_select on public.nb_products for select
  to anon, authenticated using (status = 'published' or (select public.nb_can_edit()));
create policy nb_products_editor_insert on public.nb_products for insert
  to authenticated with check (
    (select public.nb_can_edit()) and status = 'draft'
    and created_by = (select auth.uid())
  );
create policy nb_products_editor_update_draft on public.nb_products for update
  to authenticated using (status = 'draft' and (select public.nb_can_edit()))
  with check (status = 'draft' and (select public.nb_can_edit()));
create policy nb_products_publisher_update on public.nb_products for update
  to authenticated using ((select public.nb_can_publish()))
  with check ((select public.nb_can_publish()));
create policy nb_products_owner_delete on public.nb_products for delete
  to authenticated using ((select public.nb_is_owner()));

create policy nb_media_staff_select on public.nb_media for select
  to authenticated using ((select public.nb_can_edit()));
create policy nb_media_editor_insert on public.nb_media for insert
  to authenticated with check (
    (select public.nb_can_edit())
    and uploaded_by = (select auth.uid())
    and split_part(storage_path, '/', 1) = (select auth.uid())::text
    and approved = false
  );
create policy nb_media_publisher_update on public.nb_media for update
  to authenticated using ((select public.nb_can_publish()))
  with check ((select public.nb_can_publish()));
create policy nb_media_owner_delete on public.nb_media for delete
  to authenticated using ((select public.nb_is_owner()));

create policy nb_home_drafts_staff_select on public.nb_home_drafts for select
  to authenticated using ((select public.nb_can_edit()));
create policy nb_home_drafts_editor_insert on public.nb_home_drafts for insert
  to authenticated with check ((select public.nb_can_edit()) and updated_by = (select auth.uid()));
create policy nb_home_drafts_editor_update on public.nb_home_drafts for update
  to authenticated using ((select public.nb_can_edit()))
  with check ((select public.nb_can_edit()) and updated_by = (select auth.uid()));
create policy nb_home_public_read on public.nb_home_public for select
  to anon, authenticated using (true);
create policy nb_home_public_publisher_insert on public.nb_home_public for insert
  to authenticated with check ((select public.nb_can_publish()) and published_by = (select auth.uid()));
create policy nb_home_public_publisher_update on public.nb_home_public for update
  to authenticated using ((select public.nb_can_publish()))
  with check ((select public.nb_can_publish()) and published_by = (select auth.uid()));
create policy nb_home_revisions_staff_select on public.nb_home_revisions for select
  to authenticated using ((select public.nb_can_edit()));
create policy nb_home_revisions_publisher_insert on public.nb_home_revisions for insert
  to authenticated with check ((select public.nb_can_publish()) and published_by = (select auth.uid()));

-- A single transactional publish operation includes immutable revision history.
-- SECURITY INVOKER: RLS and grants continue to enforce the caller's role.
create or replace function public.nb_publish_home()
returns integer language plpgsql security invoker
set search_path = ''
as $$
declare
  draft jsonb;
  next_version integer;
begin
  if not public.nb_can_publish() then
    raise exception 'Not authorized to publish' using errcode = '42501';
  end if;
  select content into draft from public.nb_home_drafts
    where key = 'home' for update;
  if not found then
    raise exception 'Save a homepage draft before publishing';
  end if;
  if jsonb_typeof(draft) <> 'object' or length(trim(coalesce(draft ->> 'heroTitle',''))) < 4 then
    raise exception 'Homepage draft requires a valid hero title';
  end if;
  select version + 1 into next_version from public.nb_home_public
    where key = 'home' for update;
  next_version := coalesce(next_version, 1);
  insert into public.nb_home_public (key, content, version, published_by, published_at)
    values ('home', draft, next_version, auth.uid(), now())
    on conflict (key) do update set
      content = excluded.content,
      version = excluded.version,
      published_by = excluded.published_by,
      published_at = excluded.published_at;
  insert into public.nb_home_revisions (key, version, content, published_by)
    values ('home', next_version, draft, auth.uid());
  return next_version;
end;
$$;
revoke all on function public.nb_publish_home() from public, anon, authenticated;
grant execute on function public.nb_publish_home() to authenticated;

-- Editors may upload; only owners/admins approve, replace or delete.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'nb-media','nb-media',true,52428800,
  array['image/jpeg','image/png','image/webp','image/avif','image/gif','video/mp4','video/webm']
)
on conflict (id) do nothing;

create policy nb_storage_staff_select on storage.objects for select
  to authenticated using (bucket_id = 'nb-media' and (select public.nb_can_edit()));
create policy nb_storage_staff_insert on storage.objects for insert
  to authenticated with check (
    bucket_id = 'nb-media'
    and (select public.nb_can_edit())
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy nb_storage_publisher_update on storage.objects for update
  to authenticated using (bucket_id = 'nb-media' and (select public.nb_can_publish()))
  with check (bucket_id = 'nb-media' and (select public.nb_can_publish()));
create policy nb_storage_owner_delete on storage.objects for delete
  to authenticated using (bucket_id = 'nb-media' and (select public.nb_is_owner()));

-- Seed navigation taxonomy, never seed inventory or fake commercial claims.
insert into public.nb_categories (path, department, label, sort_order) values
  ('/men','men','Men''s Wear',1),
  ('/men/kurta-pyjama','men','Kurta Pyjama',10),
  ('/men/pathani','men','Pathani',20),
  ('/men/sherwani','men','Sherwani',30),
  ('/men/sherwani/handwork','men','Handwork Sherwani',31),
  ('/men/sherwani/plain','men','Plain Suits',32),
  ('/men/suits','men','Suits',40),
  ('/men/suits/handwork','men','Handwork Suits',41),
  ('/men/suits/plain','men','Plain Suits',42),
  ('/men/jodhpuri','men','Jodhpuri',50),
  ('/men/marriage','men','Marriage Collection',60),
  ('/men/marriage/jutti','men','Jutti',61),
  ('/men/marriage/pagdi','men','Pagdi',62),
  ('/men/marriage/sadi','men','Sadi',63),
  ('/men/tope','men','Tope',70),
  ('/kids','kids','Kids Wear',100),
  ('/kids/kurta-pyjama','kids','Kurta Pyjama',110),
  ('/kids/sherwani','kids','Sherwani',120),
  ('/kids/pathani','kids','Pathani',130),
  ('/kids/sadi','kids','Sadi',140),
  ('/kids/suits','kids','Suits',150),
  ('/kids/jodhpuri','kids','Jodhpuri',160),
  ('/kids/tope','kids','Tope',170)
on conflict (path) do nothing;

commit;
