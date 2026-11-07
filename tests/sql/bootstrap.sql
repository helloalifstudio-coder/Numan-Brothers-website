-- Minimal PostgreSQL test fixture that simulates Supabase roles/auth/storage.
-- Not a replacement for end-to-end testing against a real Supabase project.
create role anon nologin;
create role authenticated nologin;
create schema auth;
create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
$$;
create function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb,'{}'::jsonb)
$$;
create schema storage;
create table storage.buckets (
  id text primary key, name text not null, public boolean not null default false,
  file_size_limit bigint, allowed_mime_types text[]
);
create table storage.objects (
  id uuid primary key default gen_random_uuid(), bucket_id text not null,
  name text not null
);
create function storage.foldername(name text) returns text[]
  language sql immutable as $$ select array[split_part(name,'/',1)]::text[] $$;
grant usage on schema public,auth,storage to anon,authenticated;
grant execute on function auth.uid(),auth.jwt(),storage.foldername(text) to anon,authenticated;
grant select, insert,update,delete on storage.objects to authenticated;
insert into auth.users (id) values ('11111111-1111-4111-8111-111111111111');
