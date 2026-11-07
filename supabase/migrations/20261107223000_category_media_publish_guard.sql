-- Prevent bypassing the approved-media library when changing a public
-- collection banner directly through the Data API.
-- Forward-only; safe after the integrity/audit migration and taxonomy seed.
begin;

create or replace function nb_internal.nb_require_approved_category_image()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  if new.image_url is distinct from old.image_url
     and nullif(trim(new.image_url),'') is not null
     and not exists (
       select 1 from public.nb_media m
       where m.approved
         and m.mime_type like 'image/%'
         and new.image_url = public.nb_media_public_url(m.storage_path)
     )
  then
    raise exception 'Collection artwork must be an approved image from this project'
      using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function nb_internal.nb_require_approved_category_image() from public, anon, authenticated;

create trigger nb_category_image_approval_guard
  before update of image_url on public.nb_categories
  for each row execute function nb_internal.nb_require_approved_category_image();

commit;
