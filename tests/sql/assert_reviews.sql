-- Verify public submissions require review, and read access excludes pending.
set role anon;
insert into public.nb_reviews(display_name,rating,comment)
values('Preview Reviewer',4,'A public review submission for moderation testing.');
do $$
declare n integer;
begin
  select count(*) into n from public.nb_reviews;
  if n<>0 then raise exception 'Pending anonymous review leaked to public'; end if;
  if has_table_privilege('anon','public.nb_reviews','UPDATE')
     or has_table_privilege('anon','public.nb_reviews','DELETE')
  then raise exception 'Public review mutation grants are too broad'; end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
select set_config('request.jwt.claims','{"iss":"https://test.supabase.co/auth/v1","app_metadata":{"nb_role":"owner"}}',false);
set role authenticated;
do $$
declare n integer;
begin
  select count(*) into n from public.nb_reviews where status='pending';
  if n<>1 then raise exception 'Owner cannot view pending review';end if;
end $$;
update public.nb_reviews set status='approved' where display_name='Preview Reviewer';
reset role;
set role anon;
do $$
declare n integer;
begin
  select count(*) into n from public.nb_reviews where status='approved';
  if n<>1 then raise exception 'Approved review not visible to visitors';end if;
end $$;
reset role;
