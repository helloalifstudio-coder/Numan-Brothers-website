-- Verify that a confirmed Auth user receives exactly one owner role
-- from the separate, password-free SQL Editor bootstrap script.
DO $verify$
DECLARE
  owners integer;
BEGIN
  SELECT count(*) INTO owners FROM auth.users
  WHERE email='admin@gmail.com'
    AND email_confirmed_at is not null
    AND raw_app_meta_data->>'nb_role'='owner';
  IF owners<>1 THEN
    RAISE EXCEPTION 'Verified sample owner was not provisioned exactly once';
  END IF;
  IF EXISTS (
    SELECT 1 FROM auth.users
    WHERE email <> 'admin@gmail.com'
      AND raw_app_meta_data->>'nb_role' IN ('owner','admin','editor')
  ) THEN
    RAISE EXCEPTION 'Another staff account unexpectedly received CMS access';
  END IF;
END;
$verify$;
