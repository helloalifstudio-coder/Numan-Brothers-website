-- Server-side SKU matching for approved assets. Never overwrites a manual
-- gallery or publishes content; staff explicitly reviews linked draft images.
begin;

alter table public.nb_media add column if not exists filename_sku text
  generated always as (
    case when original_name ~* '^[a-z0-9_-]+_[0-9]{2,4}[.](jpg|jpeg|png|webp|avif|gif)$'
    then upper(regexp_replace(original_name, '_[0-9]{2,4}[.](jpg|jpeg|png|webp|avif|gif)$', '', 'i'))
    else null end
  ) stored;
create index if not exists nb_media_import_filename_idx
  on public.nb_media(filename_sku,original_name) where approved;

-- Iterate in stable UUID order so batches can be resumed without offsets.
create or replace function public.nb_link_approved_media(
  p_after uuid default null, p_limit integer default 100
)
returns table(processed integer, linked integer, next_after uuid)
language plpgsql security invoker set search_path = ''
as $$
declare
  product_row record;
  matches text[];
begin
  if not public.nb_can_edit() then
    raise exception 'Staff access required' using errcode = '42501';
  end if;
  if p_limit < 1 or p_limit > 100 then
    raise exception 'Batch size must be between 1 and 100';
  end if;
  processed := 0; linked := 0; next_after := p_after;
  for product_row in
    select d.product_id, d.content
    from public.nb_product_drafts d
    where p_after is null or d.product_id > p_after
    order by d.product_id
    limit p_limit
  loop
    processed := processed+1;
    next_after := product_row.product_id;
    if jsonb_typeof(product_row.content->'imageUrls') = 'array'
       and jsonb_array_length(product_row.content->'imageUrls') > 0 then
      continue;
    end if;
    select array_agg(public.nb_media_public_url(m.storage_path)
        order by substring(m.original_name from '_([0-9]{2,4})[.]')::integer,m.id)
      into matches
    from public.nb_media m
    where m.approved
      and m.filename_sku = upper(trim(product_row.content->>'sku'))
      and m.mime_type like 'image/%';
    if coalesce(cardinality(matches),0) > 0 then
      update public.nb_product_drafts d
      set content=jsonb_set(d.content,'{imageUrls}',to_jsonb(matches),true),
          updated_by=auth.uid()
      where d.product_id=product_row.product_id;
      linked := linked+1;
    end if;
  end loop;
  return next;
end;
$$;
revoke all on function public.nb_link_approved_media(uuid,integer) from public,anon,authenticated;
grant execute on function public.nb_link_approved_media(uuid,integer) to authenticated;
commit;
