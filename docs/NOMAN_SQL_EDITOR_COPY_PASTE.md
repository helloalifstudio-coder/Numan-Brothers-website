# Noman Brothers — Copy/paste Supabase SQL Editor installation

**Target new project:** `zazdxmukmcayblsteulk`  
**Project API origin (public):** `https://zazdxmukmcayblsteulk.supabase.co`  
**Supabase Dashboard:** https://supabase.com/dashboard/project/zazdxmukmcayblsteulk

This installation bundle matches the **nine versioned** Noman Brothers CMS migrations in `supabase/migrations/`. It creates the full fresh-project catalogue CMS schema. **Only run the installer on a new, empty, dedicated Noman Brothers project.** Both currently connected Supabase accounts expose only the unrelated project `gym`, so AGM cannot inspect or verify this Noman project's current database state yet. We have not executed this SQL remotely.

## 1. Confirm project before writing anything

1. Open the Supabase dashboard URL above and check that the name is Noman Brothers and the project reference is exactly `zazdxmukmcayblsteulk`. Confirm you are a project owner/editor and that this is an **empty** project for the new website.
2. If the project already has `nb_*` tables, functions, triggers, or `nb-media*` Storage buckets, **STOP**. Do not paste the installer onto a partially configured or live site. Send a redacted table inventory/error message instead; create and review forward-only migrations.
3. Leave the existing `gym` project, the old Firebase deployment, and all other websites unchanged.

## 2. One copy/paste into Supabase SQL Editor

1. Open `supabase/sql-editor/NOMAN_BROTHERS_INSTALL_FRESH_PROJECT.sql` in the GitHub repository for the `agm/noman-supabase-sql-editor-kit` branch. Use **Raw** and **Copy** to get the entire file (approximately 59 KB and 1,235 lines); do not copy only a GitHub preview fragment.
2. Go to **Supabase → SQL Editor → New query** for project `zazdxmukmcayblsteulk`.
3. Paste the entire file, including the leading `BEGIN;`, the nine numbered sections, final assertions, and `COMMIT;`.
4. Click **Run** once. The file creates all application schema objects in a **single transaction**. If a statement fails, the transaction is not committed; **do not skip that statement**, drop existing tables to force success, or rerun on a populated schema.
5. Expect a success notification and a PostgreSQL NOTICE roughly describing 13 RLS-enabled tables, 35+ policies, and three buckets. Do not assume success unless the query actually completes.

**Contents in order:**

1. `20261107060000_nomaan_cms.sql` — product/category entities, Auth roles, private drafts, homepage, approved publish procedures.
2. `20261107130000_catalogue_private_media.sql` — 2 private/public media buckets plus legacy private bucket, media associations, paging/search indexes.
3. `20261107150000_studio_product_index.sql` — bounded staff product index.
4. `20261107170000_bulk_import_jobs.sql` — staff import job/row records and RLS.
5. `20261107172000_match_approved_media.sql` — SKU-to-photo matching.
6. `20261107195000_studio_index_role_gate.sql` — secure view permissions.
7. `20261107199000_import_owner_idempotency.sql` — importer fingerprint isolation.
8. `20261107210000_catalogue_integrity_audit.sql` — immutable event audit, media revocation protections, catalogue health.
9. `20261107223000_category_media_publish_guard.sql` — reject unapproved collection banner art.

The fresh schema creates **13 application tables**, RLS policies, indexes, Storage bucket definitions, SQL functions, SQL triggers and fixed men/kids navigation categories. It **does not** invent garment products, payment records, customers, photos, videos, stock quantities or prices.

## 3. Copy/paste a read-only post-install check

Open `supabase/sql-editor/NOMAN_BROTHERS_VERIFY_READ_ONLY.sql`, paste it into a **new** SQL Editor query in the **same project**, and run. It checks table RLS, critical SQL RPCs, storage bucket privacy, protected internal schema and staff view.

You can also inspect manually:
- **Table Editor:** `nb_categories`, `nb_products`, `nb_product_drafts`, `nb_product_revisions`, `nb_media`, `nb_home_drafts`, `nb_home_public`, `nb_home_revisions`, `nb_product_categories`, `nb_product_media`, `nb_import_jobs`, `nb_import_rows`, `nb_audit_events`.
- **Storage:** `nb-media-staging` (**Private**), `nb-media-public` (**Public**, *approved only*), `nb-media` (**Private** legacy).
- **Database → Advisors:** resolve applicable Security Advisor and Performance Advisor warnings. The Inventory query does not substitute for real Auth, RLS and Storage API tests.

Do not run files under `tests/sql/assert*.sql` inside the client project's SQL Editor: those are test fixtures that deliberately write synthetic records and change assumed security roles.

## 4. Deploy the protected media Edge Function — required

SQL Editor cannot deploy JavaScript/Deno Edge Functions. Without this step, owner/admin **image/video approval will not work**.

Open `supabase/functions/nb-media-approval/index.ts`. In Supabase **Edge Functions**, deploy a function named exactly `nb-media-approval` using its reviewed source or the CLI:

```bash
supabase login
supabase link --project-ref zazdxmukmcayblsteulk
supabase functions deploy nb-media-approval --project-ref zazdxmukmcayblsteulk
```

Keep JWT verification enabled. The function validates the signed-in user's freshly fetched `app_metadata.nb_role` before copying privately uploaded assets to public delivery. Supabase manages the function's server-side credentials. Never paste a Supabase `sb_secret_*` or `service_role` key into a browser/Vite variable.

After deployment, test owner approval, editor rejection and anonymous rejection with a real staged asset. Publishing private photos without first approving the media must fail.

## 5. Create the real CMS owner

In the **same** Supabase project, open **Authentication → Users** and invite/create an owner using the real store owner's email. After they exist, assign `app_metadata.nb_role = "owner"` through the Auth Admin API, or follow `docs/OWNER_ROLE_SQL_TEMPLATE.sql` in the *same* project's SQL Editor. Replace its email placeholder and confirm the correct account.

The SQL owner-role template will throw an error if the placeholder is unchanged or the Auth user doesn't exist exactly once.

The user signs out/in to refresh the access token. `editor` can upload and draft; `admin` and `owner` can approve and publish. Public sign-up isn't required. Do not share Gmail passwords, temporary codes, or private API keys with AGM.

## 6. Vercel — only two **public** frontend variables

AGM created a **separate** Vercel project named `numan-brothers-cms-showroom` so the original Firebase production deployment remains untouched.

The public URL `VITE_SUPABASE_URL=https://zazdxmukmcayblsteulk.supabase.co` has already been entered into Vercel project Production/Preview settings. Only the **publishable** API key remains to be set:

```dotenv
VITE_SUPABASE_URL=https://zazdxmukmcayblsteulk.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_<EXACT_PUBLIC_KEY_FROM_NOMAN_SUPABASE>
```

Find the publishable key in **Supabase → Project Settings → API Keys** for `zazdxmukmcayblsteulk`. A publishable key is intended for public browser access **only after correct RLS tests**. Do **not** provide the project database password, user session tokens, secret key, or service-role key.

Save the publishable key under the Vercel project's **Production** environment. Vite embeds both variables at **build time**, so **create one fresh production deployment** of the reviewed release after both keys are present; an existing review deployment will not update itself.

**Current review website:** https://numan-brothers-cms-showroom-agm-3137.vercel.app/  
**CMS Studio URL:** https://numan-brothers-cms-showroom-agm-3137.vercel.app/studio

The preview is a **review build** and the CMS shows **CMS not connected** until a full production build uses the real values.

## 7. Acceptance — test both sides

1. On `/studio`, sign in as the owner (must not show "CMS not connected").
2. Upload a genuine licensed photograph and a short supported MP4/WebM video; verify private previews cannot be fetched anonymously.
3. Approve media as owner/admin using `nb-media-approval`; confirm editor/visitor cannot approve.
4. Draft an actual product SKU + category + approved gallery, check that it is not publicly visible, then publish version 1.
5. Verify its public product page, category card, photo-synced blur, WhatsApp enquiry and video playback.
6. Edit and publish homepage version 1, add authorized category banner and verified owner contact; confirm the public site updates without redeploying React.
7. Test anonymous RLS, 10k product/page benchmarks, bulk CSV recovery, real URL SSR/SEO, backup and Storage restoration.
8. Only after security, performance, and owner acceptance, enable public indexing for the final verified domain and promote the actual production deployment.

## IMPORTANT: SQL Editor vs migrations history

Supabase officially recommends the CLI-migration workflow for teams because SQL Editor does **not** register these nine files in `supabase_migrations.schema_migrations`. If you use this one-shot SQL Editor installation, **do not later run `supabase db push` on this same project without reconciling migration history**. The safe route is to run the versioned migrations via CLI instead of pasting the bundle. If you have already used SQL Editor, verify all schema changes and follow the documented `supabase migration repair` process with exact migration IDs; never blindly mark missing migrations as applied.

The SQL script's bundled transaction and postflight checks are intended to prevent a half-installed *empty project*; they are **not** a substitute for real hosted Auth, Storage, client session, and video tests.
