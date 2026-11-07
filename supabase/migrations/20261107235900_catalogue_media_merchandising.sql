
-- Noman Brothers catalog merchandising and media organisation. Forward-only.
-- Correct display labels WITHOUT breaking historical routes or product-category URLs.
begin;
alter table public.nb_products
  add column if not exists offer_price numeric(12,2),
  add column if not exists customizable boolean not null default false;
alter table public.nb_products drop constraint if exists nb_offer_below_original;
alter table public.nb_products add constraint nb_offer_below_original
  check(offer_price is null or (price is not null and offer_price>=0 and offer_price<price));
alter table public.nb_media
  add column if not exists department text,
  add column if not exists category_path text,
  add column if not exists archived_at timestamptz;
alter table public.nb_media drop constraint if exists nb_media_department_choice;
alter table public.nb_media add constraint nb_media_department_choice
  check(department is null or department in ('men','kids'));
alter table public.nb_media drop constraint if exists nb_media_category_route;
alter table public.nb_media add constraint nb_media_category_route
  check(category_path is null or
    (department is not null and category_path ~ '^/(men|kids)(/[a-z0-9-]+)*$'
     and split_part(category_path,'/',2)=department));
create index if not exists nb_media_library_filter_idx
  on public.nb_media(department,category_path,created_at desc) where archived_at is null;
create table if not exists public.nb_sku_counters(
  prefix text primary key check(prefix ~ '^[A-Z]{2,3}$'),
  next_number bigint not null check(next_number>0)
);
alter table public.nb_sku_counters enable row level security;
grant select,insert,update on public.nb_sku_counters to authenticated;
drop policy if exists nb_sku_counter_staff on public.nb_sku_counters;
create policy nb_sku_counter_staff on public.nb_sku_counters for all to authenticated
  using ((select public.nb_can_edit()))
  with check ((select public.nb_can_edit()));
create index if not exists nb_draft_sku_unique
  on public.nb_product_drafts ((content->>'sku'))
  where nullif(content->>'sku','') is not null;

create or replace function public.nb_next_sku(p_category_path text)
returns text language plpgsql security invoker set search_path = ''
as $sku$
declare
  piece text;
  parent_piece text;
  code text;
  num bigint;
  result_sku text;
begin
  if not public.nb_can_edit() then
    raise exception 'Staff access required for SKU generation' using errcode='42501';
  end if;
  if not exists (select 1 from public.nb_categories
                 where path=p_category_path and active) then
    raise exception 'Choose an active collection first';
  end if;
  piece:=split_part(p_category_path,'/',3);
  parent_piece:=split_part(p_category_path,'/',4);
  if piece in ('sherwani','suits') then
    null; -- Subcategories share the parent garment's serial range.
  elsif piece='marriage' and parent_piece<>'' then
    piece:=parent_piece;
  end if;
  code:=case piece
    when 'kurta-pyjama' then 'KP'
    when 'pathani' then 'PA'
    when 'jodhpuri' then 'JP'
    when 'tope' then 'TB'
    when 'tobh' then 'TB'
    when 'sherwani' then 'SH'
    when 'suits' then 'SU'
    when 'jutti' then 'JT'
    when 'jooti' then 'JT'
    when 'pagdi' then 'PG'
    when 'sadi' then 'SD'
    when 'sadiri' then 'SD'
    else 'OT' end;
  for iter in 1..100000 loop
    insert into public.nb_sku_counters(prefix,next_number) values(code,2)
      on conflict(prefix) do update
        set next_number=public.nb_sku_counters.next_number+1
      returning next_number-1 into num;
    if num>99999 then raise exception 'SKU numbering capacity reached'; end if;
    result_sku:='NB-'||code||'-'||lpad(num::text,5,'0');
    exit when not exists (select 1 from public.nb_products where sku=result_sku)
          and not exists (select 1 from public.nb_product_drafts where content->>'sku'=result_sku);
  end loop;
  return result_sku;
end;
$sku$;
revoke all on function public.nb_next_sku(text) from public,anon;
grant execute on function public.nb_next_sku(text) to authenticated;

CREATE OR REPLACE FUNCTION public.nb_publish_product(p_product_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
  product_offer numeric;
  product_customizable boolean;
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
      where m.approved and m.archived_at is null and photo = public.nb_media_public_url(m.storage_path)
    )
  ) then
    raise exception 'Publish images from the approved media library only';
  end if;
  if product_video is not null and product_video !~ '^https://' then
    raise exception 'Videos must use HTTPS';
  end if;
  product_price := nullif(draft->>'price','')::numeric;
  product_offer := nullif(draft->>'offerPrice','')::numeric;
  product_customizable := coalesce((draft->>'customizable')::boolean,false);
  if product_offer is not null and
    (product_price is null or product_offer < 0 or product_offer >= product_price) then
    raise exception 'Offer price must be lower than the actual price';
  end if;
  if product_price is not null and product_price < 0 then
    raise exception 'Price cannot be negative';
  end if;
  insert into public.nb_products (
    id,sku,slug,title,department,category_paths,description,fabric,sizes,
    image_urls,video_url,price,offer_price,customizable,status,sort_rank,published_at,created_by
  ) values (
    p_product_id,product_sku,product_slug,product_title,product_dept,paths,
    coalesce(draft->>'description',''),coalesce(draft->>'fabric',''),sizes_value,
    photos,product_video,product_price,product_offer,product_customizable,'published',
    coalesce((draft->>'sortRank')::integer,0),now(),auth.uid()
  )
  on conflict (id) do update set
    sku = excluded.sku, slug = excluded.slug, title = excluded.title,
    department = excluded.department, category_paths = excluded.category_paths,
    description = excluded.description, fabric = excluded.fabric,
    sizes = excluded.sizes, image_urls = excluded.image_urls,
    video_url = excluded.video_url, price = excluded.price,
    offer_price = excluded.offer_price, customizable = excluded.customizable,
    status = 'published', sort_rank = excluded.sort_rank, published_at = now();
  select coalesce(max(version),0)+1 into next_version
    from public.nb_product_revisions where product_id = p_product_id;
  insert into public.nb_product_revisions(product_id,version,content,published_by)
    values (p_product_id,next_version,draft,auth.uid());
  perform set_config('app.nb_publish_scope','',true);
  return next_version;
end;
$function$;


CREATE OR REPLACE FUNCTION public.nb_publish_home()
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
        where m.approved and m.archived_at is null and photo = public.nb_media_public_url(m.storage_path)
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
$function$;


update public.nb_categories set label=case
  when path in ('/men/tope','/kids/tope') then 'Tobh'
  when path='/men/marriage/jutti' then 'Jooti'
  when path in ('/men/marriage/sadi','/kids/sadi') then 'Sadiri'
  else label end
where path in ('/men/tope','/kids/tope','/men/marriage/jutti',
               '/men/marriage/sadi','/kids/sadi');
commit;
