-- Phase 6: the public product RLS policy alone is not sufficient to
-- protect the staff-only union view from roleless authenticated callers.
-- Explicitly require a privileged CMS staff role at the view boundary.
begin;
create or replace view public.nb_studio_product_index
with (security_invoker = true)
as
select
  coalesce(p.id,d.product_id) as id,
  coalesce(nullif(d.content->>'title',''),p.title,'(Untitled draft)') as title,
  coalesce(nullif(d.content->>'sku',''),p.sku,'') as sku,
  coalesce(nullif(d.content->>'department',''),p.department,'men') as department,
  case when p.status='published' then 'published'
    when p.status='archived' then 'archived'
    else 'draft' end as status,
  (d.product_id is not null) as has_draft,
  greatest(coalesce(p.updated_at,'epoch'::timestamptz),
    coalesce(d.updated_at,'epoch'::timestamptz)) as updated_at
from public.nb_products p
full outer join public.nb_product_drafts d on p.id=d.product_id
where public.nb_can_edit();


revoke all on public.nb_studio_product_index from public,anon,authenticated;
grant select on public.nb_studio_product_index to authenticated;
commit;
