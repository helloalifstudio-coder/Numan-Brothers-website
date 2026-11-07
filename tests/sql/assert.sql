-- Fail fast on unexpected privilege, role or publishing behavior.
\set ON_ERROR_STOP on
\echo 'Checking public access does not grant writes'
set role anon;
do $$
begin
  if (select count(*) from public.nb_products) <> 0 then
    raise exception 'Catalogue was unexpectedly prepopulated';
  end if;
end;
$$;
do $$
declare forbidden boolean := false;
begin
  begin
    insert into public.nb_product_drafts (product_id, content,updated_by)
      values ('99999999-9999-4999-8999-999999999999','{}'::jsonb,'11111111-1111-4111-8111-111111111111');
  exception when insufficient_privilege then forbidden := true;
  end;
  if not forbidden then raise exception 'Anonymous draft write was allowed'; end if;
end;
$$;
reset role;
\echo 'Checking editor permissions'
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
select set_config('request.jwt.claims','{"app_metadata":{"nb_role":"editor"}}',false);
set role authenticated;
do $$
begin
  if not public.nb_can_edit() or public.nb_can_publish() then
    raise exception 'Editor role check is incorrect';
  end if;
end;
$$;
insert into public.nb_media(storage_path,original_name,mime_type,size_bytes,approved,uploaded_by)
  values ('11111111-1111-4111-8111-111111111111/a.webp','a.webp','image/webp',1024,false,
    '11111111-1111-4111-8111-111111111111');
insert into public.nb_home_drafts(key,content,updated_by) values ('home',
 '{"heroTitle":"Crafted for your occasion","heroImage":""}',
 '11111111-1111-4111-8111-111111111111');
insert into public.nb_product_drafts(product_id,content,updated_by) values
  ('22222222-2222-4222-8222-222222222222',
  '{"sku":"NB-CI-1","slug":"ci-kids-sherwani","title":"Kids Sherwani","department":"kids","categoryPaths":["/kids/sherwani"],"imageUrls":["https://test.supabase.co/storage/v1/object/public/nb-media/11111111-1111-4111-8111-111111111111/a.webp"],"sizes":["M"],"price":"999.00"}',
  '11111111-1111-4111-8111-111111111111');
do $$
declare rejected boolean := false;
begin
  begin
    perform public.nb_publish_home();
  exception when insufficient_privilege then rejected := true;
  end;
  if not rejected then raise exception 'Editor could publish homepage'; end if;
  rejected:=false;
  begin
    perform public.nb_publish_product('22222222-2222-4222-8222-222222222222');
  exception when insufficient_privilege then rejected := true;
  end;
  if not rejected then raise exception 'Editor could publish product'; end if;
end;
$$;
-- An editor must not be able to approve media or write a published product.
do $$
declare changed integer;
begin
  update public.nb_media set approved = true;
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'Editor approved media'; end if;
end;
$$;
reset role;
\echo 'Checking publisher transaction and media approval'
select set_config('request.jwt.claims','{"app_metadata":{"nb_role":"owner"}}',false);
set role authenticated;
update public.nb_media set approved=true;
do $$
begin
  if not public.nb_can_publish() then raise exception 'Owner role missing'; end if;
  if public.nb_publish_home() <> 1 then raise exception 'Invalid homepage version'; end if;
  if public.nb_publish_product('22222222-2222-4222-8222-222222222222') <> 1 then
    raise exception 'Invalid product version';
  end if;
end;
$$;
-- Confirm unpublished/draft HTML cannot be publicly selected.
reset role;
select set_config('request.jwt.claims','{}',false);
select set_config('request.jwt.claim.sub','',false);
set role anon;
do $$
declare count_products integer; count_pages integer; forbidden boolean := false;
begin
  select count(*) into count_products from public.nb_products;
  select count(*) into count_pages from public.nb_home_public;
  if count_products<>1 or count_pages<>1 then raise exception 'Published rows not visible'; end if;
  begin
    perform 1 from public.nb_home_drafts;
  exception when insufficient_privilege then forbidden:=true;
  end;
  if not forbidden then raise exception 'Anonymous user could read homepage drafts'; end if;
end;
$$;
reset role;
\echo 'CMS PostgreSQL security and publish tests PASSED'
