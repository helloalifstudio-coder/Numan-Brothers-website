-- Forward-only CMS inventory operations: archive products and discard drafts.
-- Production was provisioned via the SQL Editor installer; see migration ledger.
begin;
create or replace function public.nb_archive_product(p_product_id uuid)
returns boolean language plpgsql security invoker set search_path = ''
as $$
declare current_status text;
begin
  if not public.nb_can_publish() then raise exception 'Only owners/admins may archive garments' using errcode='42501'; end if;
  select status into current_status from public.nb_products where id=p_product_id for update;
  if not found then raise exception 'Product not found' using errcode='P0002'; end if;
  if current_status='archived' then return true; end if;
  perform set_config('app.nb_publish_scope','product',true);
  update public.nb_products set status='archived', published_at=null where id=p_product_id;
  perform set_config('app.nb_publish_scope','',true);
  return true;
end;$$;
revoke all on function public.nb_archive_product(uuid) from public, anon;
grant execute on function public.nb_archive_product(uuid) to authenticated;
grant delete on public.nb_product_drafts to authenticated;
drop policy if exists nb_product_drafts_editor_delete on public.nb_product_drafts;
create policy nb_product_drafts_editor_delete on public.nb_product_drafts
for delete to authenticated using (
  (select public.nb_can_publish()) or
  ((select public.nb_can_edit()) and updated_by=(select auth.uid()))
);
commit;
