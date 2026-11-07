-- OPTIONAL manual owner setup for the NEW Noman Brothers Supabase project.
-- Recommended alternative: set app_metadata through the Supabase Auth Admin API.
-- Run only in that project's SQL Editor AFTER creating and verifying the owner
-- account in Authentication > Users. NEVER run against unrelated projects.
-- Replace the email below and independently verify the project ref in dashboard.
do $owner_setup$
declare
  verified_email text := 'REPLACE_WITH_OWNER_EMAIL@example.com';
  found_count integer;
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
  update auth.users
    set raw_app_meta_data=jsonb_set(
      coalesce(raw_app_meta_data,'{}'::jsonb),
      '{nb_role}',to_jsonb('owner'::text),true
    )
    where lower(email)=lower(verified_email);
end $owner_setup$;
-- Have the owner sign out/in to refresh their JWT before using /studio.
