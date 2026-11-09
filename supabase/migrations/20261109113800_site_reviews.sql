begin;
-- Only owner-approved, first-party reviews are displayed. No scraped testimonials.
create table if not exists public.nb_reviews (
  id uuid primary key default gen_random_uuid(),
  display_name text not null check (char_length(btrim(display_name)) between 2 and 70),
  rating smallint not null check (rating between 1 and 5),
  comment text not null check (char_length(btrim(comment)) between 20 and 1200),
  source text not null default 'website' check (source='website'),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  approved_at timestamptz
);
create index if not exists nb_reviews_public_index
  on public.nb_reviews (status, approved_at desc, created_at desc);
-- Identical repeat posts must not crowd the queue. This is not a substitute for
-- edge CAPTCHA/IP abuse controls when submission volumes grow.
create unique index if not exists nb_reviews_duplicate_guard
  on public.nb_reviews (lower(btrim(display_name)),md5(lower(btrim(comment))))
  where status in ('pending','approved');
alter table public.nb_reviews enable row level security;
revoke all on public.nb_reviews from public,anon,authenticated;
grant select (id,display_name,rating,comment,source,status,created_at,approved_at)
  on public.nb_reviews to anon;
grant insert (display_name,rating,comment) on public.nb_reviews to anon,authenticated;
grant select on public.nb_reviews to authenticated;
grant update (status) on public.nb_reviews to authenticated;

create policy nb_reviews_public_read on public.nb_reviews for select
  to anon,authenticated using (status='approved');
create policy nb_reviews_staff_read on public.nb_reviews for select
  to authenticated using ((select public.nb_can_edit()));
create policy nb_reviews_public_submit on public.nb_reviews for insert
  to anon,authenticated with check (status='pending' and source='website' and approved_at is null);
create policy nb_reviews_publisher_moderate on public.nb_reviews for update
  to authenticated using ((select public.nb_can_publish()))
  with check ((select public.nb_can_publish()));

create or replace function public.nb_stamp_review_approval()
returns trigger language plpgsql security invoker set search_path=''
as $review_stamp$
begin
  if new.status='approved' and old.status is distinct from 'approved' then
    new.approved_at:=now();
  elsif new.status<>'approved' then
    new.approved_at:=null;
  end if;
  return new;
end;
$review_stamp$;
drop trigger if exists nb_review_approval_stamp on public.nb_reviews;
create trigger nb_review_approval_stamp before update on public.nb_reviews
  for each row execute function public.nb_stamp_review_approval();
revoke all on function public.nb_stamp_review_approval() from public,anon,authenticated;
commit;
