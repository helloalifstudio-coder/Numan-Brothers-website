-- New CMS operations must preserve RLS and restrict archive RPC.
DO $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_proc WHERE oid='public.nb_archive_product(uuid)'::regprocedure)
 THEN RAISE EXCEPTION 'Archive RPC missing'; END IF;
 IF has_function_privilege('anon','public.nb_archive_product(uuid)','EXECUTE')
 THEN RAISE EXCEPTION 'Anonymous may archive products'; END IF;
 IF NOT has_function_privilege('authenticated','public.nb_archive_product(uuid)','EXECUTE')
 THEN RAISE EXCEPTION 'Authenticated publisher cannot invoke archive workflow'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='nb_product_drafts'
 AND policyname='nb_product_drafts_editor_delete')
 THEN RAISE EXCEPTION 'Draft discard policy missing'; END IF;
END;
$$;
