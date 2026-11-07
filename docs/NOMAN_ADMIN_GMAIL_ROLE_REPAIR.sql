-- Noman Brothers: ONE verified CMS admin role assignment.
-- Open https://supabase.com/dashboard/project/zazdxmukmcayblsteulk/sql/new
-- BEFORE RUNNING: confirm you own/control the inbox admin@gmail.com.
-- Never grant this role to a dummy/shared address you cannot verify.
-- Use a unique strong password and MFA for administrative accounts.
-- This does NOT create or reset a user/password, and does NOT expose keys.
-- Re-run safe: sets the one role without replacing other app_metadata fields.
BEGIN;
DO $grant_noman_admin$
DECLARE
  target_email CONSTANT text := 'admin@gmail.com';
  user_count integer;
  target_id uuid;
  target_confirmed timestamptz;
  signed_in timestamptz;
  affected integer;
BEGIN
  SELECT count(*) INTO user_count
  FROM auth.users
  WHERE lower(email) = lower(target_email);
  IF user_count <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one existing Auth user for %, found %',
      target_email, user_count;
  END IF;

  SELECT id, email_confirmed_at, last_sign_in_at
  INTO target_id, target_confirmed, signed_in
  FROM auth.users
  WHERE lower(email) = lower(target_email)
  FOR UPDATE;

  IF target_confirmed IS NULL THEN
    RAISE EXCEPTION 'Refusing admin assignment: % email is not confirmed', target_email;
  END IF;
  IF signed_in IS NULL THEN
    RAISE EXCEPTION 'Refusing admin assignment: % has never signed in', target_email;
  END IF;

  UPDATE auth.users
  SET raw_app_meta_data = jsonb_set(
    coalesce(raw_app_meta_data, '{}'::jsonb),
    '{nb_role}',
    to_jsonb('admin'::text),
    true
  )
  WHERE id = target_id;
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 1 THEN
    RAISE EXCEPTION 'Unexpected admin assignment row count: %', affected;
  END IF;
  RAISE NOTICE 'Verified CMS admin role set for % (id %)', target_email, target_id;
END
$grant_noman_admin$;

-- Verify in the SQL Editor output; never query password columns.
SELECT
  email,
  email_confirmed_at IS NOT NULL AS email_confirmed,
  last_sign_in_at IS NOT NULL AS previously_signed_in,
  raw_app_meta_data ->> 'nb_role' AS cms_role
FROM auth.users
WHERE lower(email) = lower('admin@gmail.com');
COMMIT;

-- Back in /studio, click "Refresh CMS permissions" or sign out/in.
-- If the Auth email is not under your control, do not execute this query;
-- create a confirmed account with a real owner-controlled email instead.
