begin;
-- Additional CMS hero/card imagery must belong to an approved public asset.
-- Never accept unreviewed remote photos in a published customer-facing card.
create or replace function nb_internal.nb_require_approved_home_featured()
returns trigger language plpgsql security invoker set search_path = ''
as $function$
begin
  if jsonb_typeof(coalesce(new.content->'featuredImages','{}'::jsonb)) <> 'object' then
    raise exception 'Featured images must be a keyed object' using errcode='23514';
  end if;
  if exists (
    select 1 from jsonb_each_text(coalesce(new.content->'featuredImages','{}'::jsonb)) v(key,url)
    where v.key not in ('one','two','three')
       or (coalesce(v.url,'') <> '' and not exists (
         select 1 from public.nb_media m
         where m.approved and m.archived_at is null and m.mime_type like 'image/%'
           and v.url=public.nb_media_public_url(m.storage_path)
       ))
  ) then
    raise exception 'Featured card image must be an approved library photograph'
      using errcode='23514';
  end if;
  return new;
end;
$function$;
drop trigger if exists nb_guard_published_featured on public.nb_home_public;
create trigger nb_guard_published_featured before insert or update on public.nb_home_public
  for each row execute function nb_internal.nb_require_approved_home_featured();

-- Do not archive, revoke or delete a published featured photo before replacing it.
create or replace function nb_internal.nb_guard_featured_media_removal()
returns trigger language plpgsql security invoker set search_path = ''
as $function$
declare
  suffix text:='/nb-media-public/'||old.storage_path;
begin
  if tg_op='DELETE' or (old.approved and
      (new.approved is false or new.archived_at is not null)) then
    if exists(
      select 1 from public.nb_home_public h
        cross join lateral jsonb_each_text(coalesce(h.content->'featuredImages','{}'::jsonb)) v(key,url)
      where right(coalesce(v.url,''),length(suffix))=suffix
    ) then
      raise exception 'Featured photo is published. Replace or remove it in Website CMS before archiving/deleting'
        using errcode='23503';
    end if;
  end if;
  if tg_op='DELETE' then return old;end if;
  return new;
end;
$function$;
drop trigger if exists nb_guard_featured_media_update on public.nb_media;
create trigger nb_guard_featured_media_update before update on public.nb_media
  for each row execute function nb_internal.nb_guard_featured_media_removal();
drop trigger if exists nb_guard_featured_media_delete on public.nb_media;
create trigger nb_guard_featured_media_delete before delete on public.nb_media
  for each row execute function nb_internal.nb_guard_featured_media_removal();
revoke all on function nb_internal.nb_require_approved_home_featured() from public,anon,authenticated;
revoke all on function nb_internal.nb_guard_featured_media_removal() from public,anon,authenticated;
commit;
