-- OPTIONAL manual owner setup for the NEW Noman Brothers Supabase project.
-- Recommended alternative: set app_metadata through the Supabase Auth Admin API.
-- Run only in that project's SQL Editor AFTER creating and verifying the owner
-- account in Authentication > Users. NEVER run against unrelated projects.
-- Replace the email below and independently verify the project ref in dashboard.
do $owner_setup$
declare
  verified_email text := 'REPLACE_WITH_OWNER_EMAIL@example.com';
  found_count integer;
  verified_count integer;
begin
  if verified_email like 'REPLACE_WITH_%'
     or verified_email !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' then
    raise exception 'Replace the placeholder with the verified owner email';
  end if;
  select count(*) into found_count
    from auth.users where lower(email)=lower(verified_email);
  if found_count <> 1 then
    raise exception 'Expected exactly one existing Auth user with this email, got %', found_count;
  end if;
  select count(*) into verified_count
    from auth.users
    where lower(email)=lower(verified_email) and email_confirmed_at is not null;
  if verified_count <> 1 then
    raise exception 'Owner email must be confirmed before granting CMS privileges';
  end if;
  update auth.users
    set raw_app_meta_data=jsonb_set(
      coalesce(raw_app_meta_data,'{}'::jsonb),
      '{nb_role}',to_jsonb('owner'::text),true
    )
    where lower(email)=lower(verified_email);
end $owner_setup$;
-- Never assign owner to an unowned or shared email inbox. Confirm ownership first.
-- Have the owner sign out/in (or click Refresh CMS permissions) to update JWT.
-- Read-only verification (replace the email placeholder):
-- select email, email_confirmed_at is not null as email_confirmed,
--        raw_app_meta_data ->> 'nb_role' as cms_role
-- from auth.users
-- where lower(email)=lower('REPLACE_WITH_OWNER_EMAIL@example.com');
