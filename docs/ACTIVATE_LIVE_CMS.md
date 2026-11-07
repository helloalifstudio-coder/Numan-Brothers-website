# Noman Brothers — Activate the Vercel website and CMS

## Current review links (7 November 2026)

Website: https://numan-brothers-cms-showroom-agm-3137.vercel.app/

CMS route: https://numan-brothers-cms-showroom-agm-3137.vercel.app/studio

Vercel project: `numan-brothers-cms-showroom` (separate from the original Firebase Vercel project), AGM team `agm-3137`.

**Review deployment is deliberately not production.** There is no dedicated Noman Brothers Supabase connection. The /studio URL loads the CMS setup page until Vite public keys are supplied at build time. Public product SEO/sitemaps return unavailable until real published data exists. The original Firebase site is still intact.

The Vercel production build is intentionally **fail-closed** until both public Supabase environment variables are valid. Do not insert fake values or reuse the connected `gym` project's credentials to bypass this check.

## 1. Create the correct Supabase project

- In the client's own account, create a project named `numan-brothers-cms` (or a clearly named variant). Select Mumbai when available and check the pricing and storage quotas.
- Do not share the Supabase project with any other client's data. Save its actual project ref in your private onboarding records.
- Install the Supabase CLI, check `supabase --version`, and use this repository's checked-in `supabase/config.toml` and `supabase/migrations/` directory.

## 2. Install all nine migrations **on the empty new project**

From an approved clone of this candidate, run:

```bash
supabase login
supabase link --project-ref <NEW_NOMAN_SUPABASE_PROJECT_REF>
supabase migration list
supabase db push --dry-run
supabase db push
```

Confirm each command's current flags using `--help` if the installed CLI version differs. Verify the linked ref twice before applying SQL. Do not use `supabase db reset` on a hosted project.

Nine SQL migrations apply in lexicographic timestamp order:

```text
20261107060000_nomaan_cms.sql
20261107130000_catalogue_private_media.sql
20261107150000_studio_product_index.sql
20261107170000_bulk_import_jobs.sql
20261107172000_match_approved_media.sql
20261107195000_studio_index_role_gate.sql
20261107199000_import_owner_idempotency.sql
20261107210000_catalogue_integrity_audit.sql
20261107223000_category_media_publish_guard.sql
```

The first migration briefly defines a legacy bucket before the second migration makes it private. Apply all nine without uploading any files in between. Do not paste and rerun them on a populated database. No demo garments are seeded. Only the fixed men/kids category routes are created.

For an inventory-only verification, run `tests/sql/verify_supabase_inventory.sql` via Supabase SQL Editor (not the destructive test fixtures) and review Security/Performance Advisors.

## 3. Deploy the approval function (required for media)

```bash
supabase functions deploy nb-media-approval --project-ref <NEW_NOMAN_SUPABASE_PROJECT_REF>
```

Use the reviewed `supabase/functions/nb-media-approval/index.ts`. The checked-in `supabase/config.toml` keeps JWT verification enabled. Supabase supplies the required server-only credentials to its own Edge Function runtime. **Never place a secret/service-role key in Vercel browser variables or GitHub.**

Confirm the function exists in the target project's Edge Functions dashboard. Exercise authenticated owner vs editor vs anonymous approval/revocation tests; a successful deploy alone is not proof of correct authorization.

## 4. Create the CMS owner account

In the *same new project* open **Authentication → Users**, invite/create the genuine store owner, and verify their email. Set `app_metadata.nb_role = "owner"` using privileged Auth administration. If no Auth Admin API operator is available, the strictly guarded `docs/OWNER_ROLE_SQL_TEMPLATE.sql` can be run in that **new project's** SQL Editor after replacing its email placeholder.

The CMS uses email/password sign-in. Ask the owner to sign out/in after role assignment. Never create a hardcoded PIN or turn on public self-registration.

`owner` or `admin` can approve media and publish; `editor` can create drafts and upload private assets. Guests can only read published content.

## 5. Add **public** Supabase settings in the NEW Vercel project

In Vercel project **numan-brothers-cms-showroom → Settings → Environment Variables**, set both variables on the environment(s) you will deploy:

```dotenv
VITE_SUPABASE_URL=https://<NEW_NOMAN_SUPABASE_PROJECT_REF>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_<EXACT_PUBLIC_KEY_FROM_SUPABASE>
```

Do **not** use `sb_secret_...`, `service_role`, database password, or any other company's URL or key.

Because this is Vite, **the VITE_ values are embedded during build**. Changing them in the Vercel dashboard does **not** reconfigure an already built deployment. Trigger one intentional **new production deployment** of the approved source commit after setting the real values. Verify the final public domain and ensure the new production deployment is not blocked by project protections. Do not enable repeated per-commit previews.

Leave `SITE_CANONICAL_URL` unset until the business approves its final HTTPS domain. When approved, set it to the domain origin and redeploy. Product HTML/sitemaps must be checked with real published data.

## 6. Confirm working end-to-end

1. Load `/studio` and verify it shows a real staff login screen (not "CMS not connected").
2. Log in as the verified owner, then log out and test an editor and unauthenticated visitor.
3. Upload a real authorized image and MP4/WebM video: verify it is private before approval.
4. Approve each via the media Edge Function. Confirm approved public copies are accessible and draft assets are not.
5. Create a product with SKU, category and approved image; save private draft; confirm it is invisible to public visitors; publish version 1; confirm public product and associated category.
6. Save and publish a homepage hero, collection banner and the approved WhatsApp number. Confirm text and images update **without** a React redeploy.
7. Check public product page, /search, /sitemap.xml, mobile navigation, image/video playback and the blurred photo background.
8. Import a small CSV and media batch, retry once, and inspect job counters. Run actual role/RLS, load, and restore tests before switching any client traffic.

For read-only anonymous API verification (run locally with **public** keys only):

```bash
EXPECTED_SUPABASE_PROJECT_REF=<NEW_NOMAN_SUPABASE_PROJECT_REF> \
VITE_SUPABASE_URL=https://<NEW_NOMAN_SUPABASE_PROJECT_REF>.supabase.co \
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_<REAL_KEY> \
node scripts/check-client-cms.mjs
```

Then `node scripts/smoke-deployment.mjs https://<VERIFIED_PRODUCTION_DOMAIN>` to check HTTP routes and security headers. The latter cannot replace browser/Auth/Storage tests.

## Go/no-go

Until all steps, live security checks, real backup restore and client content/sign-off have passed, keep the dedicated public deployment as **review-only** and leave the existing Firebase production deployment untouched.

If anything fails, record the exact project ref (not API keys), failing UI action and sanitized HTTP/Edge logs, then correct via a **forward-only migration** and retest.
