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
  alt_text text not null default '' check (char_length(alt_text) <= 400),
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

create table if not exists public.nb_product_drafts (
  product_id uuid primary key,
  content jsonb not null check (jsonb_typeof(content) = 'object' and octet_length(content::text) <= 45000),
  updated_by uuid not null references auth.users(id),
  updated_at timestamptz not null default now()
);
create table if not exists public.nb_product_revisions (
  id bigint generated always as identity primary key,
  product_id uuid not null,
  version integer not null check (version > 0),
  content jsonb not null check (jsonb_typeof(content) = 'object'),
  published_by uuid references auth.users(id),
  published_at timestamptz not null default now(),
  unique(product_id, version)
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
-- Use the verified Supabase Auth JWT issuer to lock published assets
-- to the intended project, rejecting third-party lookalike URLs.
create or replace function public.nb_media_public_url(path text)
returns text language sql stable security invoker set search_path = ''
as $$
  select case
    when ((select auth.jwt()) ->> 'iss')
      ~ '^https://[a-z0-9-]+[.]supabase[.]co/auth/v1$'
    then regexp_replace((select auth.jwt()) ->> 'iss','/auth/v1$','')
      || '/storage/v1/object/public/nb-media/' || path
    else null
  end;
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

-- Protect the materialized public tables from direct REST writes even by
-- publishers. Only nb_publish_product()/nb_publish_home() may perform them.
-- The scope GUC is transaction-local and set only inside role-checked RPCs.
create or replace function public.nb_require_publish_scope()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  if not public.nb_can_publish() or
    current_setting('app.nb_publish_scope', true) is distinct from TG_ARGV[0] then
    raise exception 'Use the publishing workflow' using errcode = '42501';
  end if;
  return new;
end;
$$;
drop trigger if exists nb_materialized_product_guard on public.nb_products;
create trigger nb_materialized_product_guard before insert or update on public.nb_products
  for each row execute function public.nb_require_publish_scope('product');
drop trigger if exists nb_materialized_home_guard on public.nb_home_public;
create trigger nb_materialized_home_guard before insert or update on public.nb_home_public
  for each row execute function public.nb_require_publish_scope('home');

drop trigger if exists nb_touch_product on public.nb_products;
create trigger nb_touch_product before update on public.nb_products
  for each row execute function public.nb_touch_updated_at();
drop trigger if exists nb_touch_product_drafts on public.nb_product_drafts;
create trigger nb_touch_product_drafts before update on public.nb_product_drafts
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
alter table public.nb_product_drafts enable row level security;
alter table public.nb_product_revisions enable row level security;
alter table public.nb_media enable row level security;
alter table public.nb_home_drafts enable row level security;
alter table public.nb_home_public enable row level security;
alter table public.nb_home_revisions enable row level security;

revoke all on public.nb_categories, public.nb_products, public.nb_product_drafts,
  public.nb_product_revisions, public.nb_media,
  public.nb_home_drafts, public.nb_home_public, public.nb_home_revisions
  from public, anon, authenticated;
grant select on public.nb_categories, public.nb_products,
  public.nb_home_public to anon;
grant select on public.nb_categories, public.nb_products, public.nb_product_drafts,
  public.nb_product_revisions, public.nb_media,
  public.nb_home_drafts, public.nb_home_public, public.nb_home_revisions
  to authenticated;
grant insert, update on public.nb_products, public.nb_product_drafts, public.nb_media,
  public.nb_home_drafts, public.nb_home_public to authenticated;
grant insert on public.nb_product_revisions to authenticated;
grant insert on public.nb_home_revisions to authenticated;
grant update on public.nb_categories to authenticated;
grant delete on public.nb_products, public.nb_media to authenticated;
grant usage, select on sequence public.nb_home_revisions_id_seq,
  public.nb_product_revisions_id_seq to authenticated;

-- Public catalogue reads only enabled categories, approved media metadata,
-- published garments and the approved homepage document.
create policy nb_categories_public_select on public.nb_categories for select
  to anon, authenticated using (active or (select public.nb_can_edit()));
create policy nb_categories_publisher_update on public.nb_categories for update
  to authenticated using ((select public.nb_can_publish()))
  with check ((select public.nb_can_publish()));
create policy nb_products_public_select on public.nb_products for select
  to anon, authenticated using (status = 'published' or (select public.nb_can_edit()));
create policy nb_products_publisher_insert on public.nb_products for insert
  to authenticated with check ((select public.nb_can_publish()) and created_by = (select auth.uid()));
create policy nb_products_publisher_update on public.nb_products for update
  to authenticated using ((select public.nb_can_publish()))
  with check ((select public.nb_can_publish()));
create policy nb_product_drafts_staff_select on public.nb_product_drafts for select
  to authenticated using ((select public.nb_can_edit()));
create policy nb_product_drafts_editor_insert on public.nb_product_drafts for insert
  to authenticated with check (
    (select public.nb_can_edit()) and updated_by = (select auth.uid())
  );
create policy nb_product_drafts_editor_update on public.nb_product_drafts for update
  to authenticated using ((select public.nb_can_edit()))
  with check ((select public.nb_can_edit()) and updated_by = (select auth.uid()));
create policy nb_product_revisions_staff_select on public.nb_product_revisions for select
  to authenticated using ((select public.nb_can_edit()));
create policy nb_product_revisions_publisher_insert on public.nb_product_revisions for insert
  to authenticated with check ((select public.nb_can_publish()) and published_by = (select auth.uid()));
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
  perform set_config('app.nb_publish_scope','home',true);
  select content into draft from public.nb_home_drafts
    where key = 'home' for update;
  if not found then
    raise exception 'Save a homepage draft before publishing';
  end if;
  if jsonb_typeof(draft) <> 'object' or length(trim(coalesce(draft ->> 'heroTitle',''))) < 4 then
    raise exception 'Homepage draft requires a valid hero title';
  end if;
  if coalesce(draft->>'contactWhatsapp','') <> ''
     and (draft->>'contactWhatsapp') !~ '^[1-9][0-9]{9,14}$' then
    raise exception 'Contact number must be verified and in international digits-only format';
  end if;
  if exists (
    select 1 from (values (draft->>'heroImage'), (draft->>'menImage'),
      (draft->>'kidsImage'), (draft->>'storyImage')) as urls(photo)
    where coalesce(photo,'') <> '' and not exists (
      select 1 from public.nb_media m
        where m.approved and photo = public.nb_media_public_url(m.storage_path)
    )
  ) then
    raise exception 'Homepage images must come from approved media';
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
  perform set_config('app.nb_publish_scope','',true);
  return next_version;
end;
$$;
revoke all on function public.nb_publish_home() from public, anon, authenticated;
grant execute on function public.nb_publish_home() to authenticated;

-- Product content is edited privately and published atomically. Published rows
-- remain unchanged while editors prepare a new revision.
create or replace function public.nb_publish_product(p_product_id uuid)
returns integer language plpgsql security invoker set search_path = ''
as $$
declare
  draft jsonb;
  next_version integer;
  paths text[];
  photos text[];
  sizes_value text[];
  product_sku text;
  product_slug text;
  product_title text;
  product_dept text;
  product_video text;
  product_price numeric;
begin
  if not public.nb_can_publish() then
    raise exception 'Not authorized to publish' using errcode = '42501';
  end if;
  perform set_config('app.nb_publish_scope','product',true);
  select content into draft from public.nb_product_drafts
    where product_id = p_product_id for update;
  if not found then
    raise exception 'Save a product draft before publishing';
  end if;
  product_sku := trim(coalesce(draft->>'sku',''));
  product_slug := trim(coalesce(draft->>'slug',''));
  product_title := trim(coalesce(draft->>'title',''));
  product_dept := coalesce(draft->>'department','');
  product_video := nullif(trim(coalesce(draft->>'videoUrl','')), '');
  if length(product_title) < 2 or length(product_title) > 180
    or length(product_sku) < 2 or length(product_sku) > 80
    or product_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    or product_dept not in ('men','kids') then
    raise exception 'Invalid SKU, title, slug or department';
  end if;
  if jsonb_typeof(draft->'categoryPaths') <> 'array'
    or jsonb_typeof(draft->'imageUrls') <> 'array'
    or jsonb_typeof(coalesce(draft->'sizes','[]'::jsonb)) <> 'array' then
    raise exception 'Invalid product category or image list';
  end if;
  select coalesce(array_agg(val), '{}') into paths
    from jsonb_array_elements_text(draft->'categoryPaths') as vals(val);
  select coalesce(array_agg(val), '{}') into photos
    from jsonb_array_elements_text(draft->'imageUrls') as vals(val);
  select coalesce(array_agg(val), '{}') into sizes_value
    from jsonb_array_elements_text(coalesce(draft->'sizes','[]'::jsonb)) as vals(val);
  if cardinality(paths) = 0 or cardinality(photos) = 0 then
    raise exception 'Choose a collection and at least one approved image';
  end if;
  if exists (
    select 1 from unnest(paths) as routes(route)
    where not exists (
      select 1 from public.nb_categories c
      where c.path = route and c.active and c.department = product_dept
    )
  ) then
    raise exception 'A category is inactive, invalid or in the wrong department';
  end if;
  if exists (
    select 1 from unnest(photos) as photos_input(photo)
    where not exists (
      select 1 from public.nb_media m
      where m.approved and photo = public.nb_media_public_url(m.storage_path)
    )
  ) then
    raise exception 'Publish images from the approved media library only';
  end if;
  if product_video is not null and product_video !~ '^https://' then
    raise exception 'Videos must use HTTPS';
  end if;
  product_price := nullif(draft->>'price','')::numeric;
  if product_price is not null and product_price < 0 then
    raise exception 'Price cannot be negative';
  end if;
  insert into public.nb_products (
    id,sku,slug,title,department,category_paths,description,fabric,sizes,
    image_urls,video_url,price,status,sort_rank,published_at,created_by
  ) values (
    p_product_id,product_sku,product_slug,product_title,product_dept,paths,
    coalesce(draft->>'description',''),coalesce(draft->>'fabric',''),sizes_value,
    photos,product_video,product_price,'published',
    coalesce((draft->>'sortRank')::integer,0),now(),auth.uid()
  )
  on conflict (id) do update set
    sku = excluded.sku, slug = excluded.slug, title = excluded.title,
    department = excluded.department, category_paths = excluded.category_paths,
    description = excluded.description, fabric = excluded.fabric,
    sizes = excluded.sizes, image_urls = excluded.image_urls,
    video_url = excluded.video_url, price = excluded.price,
    status = 'published', sort_rank = excluded.sort_rank, published_at = now();
  select coalesce(max(version),0)+1 into next_version
    from public.nb_product_revisions where product_id = p_product_id;
  insert into public.nb_product_revisions(product_id,version,content,published_by)
    values (p_product_id,next_version,draft,auth.uid());
  perform set_config('app.nb_publish_scope','',true);
  return next_version;
end;
$$;
revoke all on function public.nb_publish_product(uuid) from public, anon, authenticated;
grant execute on function public.nb_publish_product(uuid) to authenticated;

-- Draft editors can revise their own still-unapproved media descriptions
-- without gaining the right to approve or modify approved assets.
create policy nb_media_editor_update_pending on public.nb_media for update
  to authenticated
  using (
    not approved and uploaded_by = (select auth.uid())
    and (select public.nb_can_edit())
  )
  with check (
    not approved and uploaded_by = (select auth.uid())
    and split_part(storage_path, '/', 1) = (select auth.uid())::text
    and (select public.nb_can_edit())
  );

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
