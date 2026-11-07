# Noman Brothers — CMS sign-in and publishing diagnosis

**Project:** `zazdxmukmcayblsteulk` (`https://zazdxmukmcayblsteulk.supabase.co`)  
**Review:** https://numan-brothers-cms-showroom-agm-3137.vercel.app/studio  
**Read-only status:** https://numan-brothers-cms-showroom-agm-3137.vercel.app/api/cms-status

This project has separate **authentication**, **authorization**, and **database readiness** requirements. A user in Authentication → Users does not automatically become a CMS administrator. Do not create a hardcoded admin password or give a client-side special exception.

## 1. Verify the account in the correct project

Open https://supabase.com/dashboard/project/zazdxmukmcayblsteulk/auth/users and confirm that the user was created in **this project**, not in gym or a different Supabase organization. Use an email inbox you actually own (not a generic/shared third-party email). For password-based sign-in, the email must be **confirmed** when confirmations are enabled.

To inspect your own new project's Auth user metadata without exposing passwords, open SQL Editor in project `zazdxmukmcayblsteulk` and run:

```sql
-- READ ONLY. Replace with the email you own.
select
  id,
  email,
  email_confirmed_at is not null as email_confirmed,
  raw_app_meta_data ->> 'nb_role' as cms_role
from auth.users
where lower(email) = lower('REPLACE_WITH_YOUR_REAL_EMAIL@example.com');
```

Interpret the result:

- **No row:** the account was created in another project or under another email.
- **`email_confirmed=false`:** confirm the email using the normal Supabase email verification flow.
- **`cms_role` is null:** Supabase authentication can succeed but the CMS must block access.
- **`cms_role=owner/admin/editor`:** the user should be authorized. Sign out and back in, or press **Refresh CMS permissions** to refresh the JWT.

To assign the owner role to a **verified email you control**, use `docs/OWNER_ROLE_SQL_TEMPLATE.sql` after replacing its placeholder. It deliberately refuses unconfirmed or missing accounts. The recommended method for trusted operators is Supabase Auth Admin API `updateUserById(id,{app_metadata:{nb_role:'owner'}})` from a privileged server environment, **never the browser**. Do not change `user_metadata`.

## 2. Confirm the backend migrations really exist

In **this project's** SQL Editor, run this **read-only** query:

```sql
select
  to_regclass('public.nb_categories') is not null as categories_installed,
  to_regclass('public.nb_products') is not null as products_installed,
  to_regclass('public.nb_product_drafts') is not null as drafts_installed,
  to_regclass('public.nb_media') is not null as media_installed,
  to_regclass('public.nb_home_public') is not null as homepage_installed;
```

All five booleans must be `true` for core CMS operations. If any are false, check `docs/NOMAN_SQL_EDITOR_COPY_PASTE.md` before proceeding. The fresh-project installer is **not safe to rerun** on a partially installed schema. Check `supabase/sql-editor/NOMAN_BROTHERS_VERIFY_READ_ONLY.sql` for the complete 13-table/RLS/storage inventory.

## 3. How to interpret the studio's error

| Studio message | Meaning | Fix |
| --- | --- | --- |
| "Email or password was not accepted" | Supabase Auth rejected the credentials | Check user in correct project and reset password; do not blindly repeat |
| "Email address has not been confirmed" | Auth email verification not completed | Confirm controlled email through Supabase Authentication |
| "Sign-in succeeded · Role needed" | Valid Auth user without a privileged CMS role | Set `app_metadata.nb_role` to owner/admin/editor with trusted Auth admin, then refresh permissions |
| "Cannot reach Supabase Authentication" | Client browser cannot reach Auth | Inspect network extensions, project status and Auth logs |
| "Supabase rejected the public project key" | Vercel's URL and key belong to different projects or key revoked | Use Noman project's `sb_publishable_...` and create one fresh build |
| "Published catalogue ... migrations or API permissions" | REST schema missing/inaccessible despite app loading | Verify the nine migrations, table RLS and API grants |

The read-only `/api/cms-status` endpoint reports only whether public Auth health and anonymous category reads succeed. It **never reads passwords, sessions, private drafts or admin keys**. It cannot verify a particular user's credentials or privileged role.

## 4. Media publishing requires an Edge Function

After real login works, media approval still requires `supabase/functions/nb-media-approval/index.ts` to be deployed **to the same Noman project** with JWT verification enabled. The SQL migrations alone cannot deploy it.

A successful Vercel build is not proof of complete Auth + Storage integration.

## 5. Testing and communicating failures

1. Use a private/incognito window to visit the current /studio URL. Sign in with the email/password you created, **without sharing the password**.
2. If login fails, record the **exact displayed error text**, whether the Auth user row exists/was confirmed/has `cms_role`, and the two booleans from `/api/cms-status`.
3. After owner login, create one real private draft and publish it only after media approval. Verify the public website updates.

Never paste passwords, JWTs, `sb_secret_*` keys, database passwords, or raw session traces into chat/issues. The publishable key is browser-safe but still needs RLS.
