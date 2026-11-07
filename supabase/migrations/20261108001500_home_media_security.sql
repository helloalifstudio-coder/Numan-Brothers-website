-- Guard optional website CMS video/background assets during publish and archive.
begin;
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
  if coalesce(draft->>'contactPhone','') <> '' and (draft->>'contactPhone') !~ '^[1-9][0-9]{9,14}$' then
    raise exception 'Call phone must be international digits';
  end if;
  if coalesce(draft->>'contactWhatsapp','') <> ''
     and (draft->>'contactWhatsapp') !~ '^[1-9][0-9]{9,14}$' then
    raise exception 'Contact number must be verified and in international digits-only format';
  end if;
  if exists (
    select 1 from (values (draft->>'heroImage'), (draft->>'menImage'),
      (draft->>'kidsImage'), (draft->>'storyImage'),
      (draft->>'customizationImage')) as urls(photo)
    where coalesce(photo,'') <> '' and not exists (
      select 1 from public.nb_media m
        where m.approved and m.archived_at is null and photo = public.nb_media_public_url(m.storage_path)
    )
  ) then
    raise exception 'Homepage images must come from approved media';
  end if;
  if jsonb_typeof(coalesce(draft->'sectionVideos','{}'::jsonb)) <> 'object'
    or exists (
      select 1 from jsonb_each_text(coalesce(draft->'sectionVideos','{}'::jsonb)) v(key,url)
      where coalesce(v.url,'')<>'' and not exists (
        select 1 from public.nb_media m
        where m.approved and m.archived_at is null and m.mime_type like 'video/%'
          and v.url=public.nb_media_public_url(m.storage_path)
      )
    ) then
    raise exception 'Section videos must be approved video assets';
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
CREATE OR REPLACE FUNCTION nb_internal.nb_guard_media_revocation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
          (h.content->>'kidsImage'), (h.content->>'storyImage'),
          (h.content->>'customizationImage')
        ) as asset(url)
        where right(coalesce(asset.url,''),length(suffix)) = suffix
      )
    ) or exists (
      select 1 from public.nb_home_public h
        cross join lateral jsonb_each_text(coalesce(h.content->'sectionVideos','{}'::jsonb)) sv(key,url)
      where right(sv.url,length(suffix))=suffix
    ) then
      raise exception 'Media is referenced by published content; unpublish or replace it first'
        using errcode = '23503';
    end if;
  end if;
  return new;
end
$function$;
CREATE OR REPLACE FUNCTION nb_internal.nb_require_approved_category_image()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  if new.image_url is distinct from old.image_url
     and nullif(trim(new.image_url),'') is not null
     and not exists (
       select 1 from public.nb_media m
       where m.approved and m.archived_at is null
         and m.mime_type like 'image/%'
         and new.image_url = public.nb_media_public_url(m.storage_path)
     )
  then
    raise exception 'Collection artwork must be an approved image from this project'
      using errcode = '23514';
  end if;
  return new;
end;
$function$;
commit;
