# Noman Brothers — Supabase Staging Installation Pack

**Release mode: STAGING ONLY. No changes to the live website, legacy Firebase data or existing `gym` project.**

This pack covers the *catalogue-first* website, CMS, images and videos. It deliberately has **no** POS, payment, order, stock quantity or customer-login tables. The goal is to prove the app against an independent test backend before a client-owned production project is created.

## Architecture and ownership

The database uses Supabase Auth for staff identity, PostgreSQL + RLS for catalogue and publishing, Supabase Storage for private uploads and approved public assets, and an authenticated Edge Function for promotion/revocation.

- Use an independent **AGM staging Supabase project** in a confirmed organization. Existing linked accounts both currently show only a Free-plan organization named `gym`; obtain explicit organization/cost clearance before creating a new project. **Never run Nomaan migrations on the existing gym project.**
- Region: `ap-south-1` (Mumbai) when possible for the Warangal storefront, unless a later client-specific requirement overrides it.
- The eventual client's **production** Supabase project is separately created in the store owner's account. Do not share databases, storage buckets, Auth users or admin keys between the agency test and the client's production installation.
- Require owner-controlled accounts; the client can use an existing Gmail identity to sign up for GitHub/Supabase/Vercel and **invite AGM as a collaborator**. Do not collect the client's Gmail password, authentication codes or Gmail login link.

## The nine ordered migrations (no destructive reset)

Apply the version-controlled files in this order, never by copy-pasting a combined unversioned query into an existing production database:

1. `20261107060000_nomaan_cms.sql` — core categories/products, drafts, revisions, roles, RLS, initial Storage and publish RPCs.
2. `20261107130000_catalogue_private_media.sql` — private upload bucket, approved delivery bucket, relational product links and indexed queries.
3. `20261107150000_studio_product_index.sql` — searchable staff product/draft view.
4. `20261107170000_bulk_import_jobs.sql` — job/row records, permission isolation and progress counts.
5. `20261107172000_match_approved_media.sql` — SKU-based approved-gallery linking.
6. `20261107195000_studio_index_role_gate.sql` — role gating for the staff index.
7. `20261107199000_import_owner_idempotency.sql` — per-staff import fingerprint isolation.
8. `20261107210000_catalogue_integrity_audit.sql` — append-only audit records, safe revocation and manager diagnostics.
9. `20261107223000_category_media_publish_guard.sql` — reject unapproved public collection banner artwork.

The list contains **nine** migration files; filenames are the source of truth. Do not skip a file or reorder them. No merchandise is seeded; only the approved navigation taxonomy is initialized.

**Migration caveat:** The initial candidate migration briefly creates a legacy public `nb-media` bucket before the next migration makes it private. These migrations are intended only for a fresh, empty dedicated project. Do not upload media or expose the endpoint before the second migration completes. For any previously used database, generate and test a forward-only data-and-assets migration instead of overwriting applied migrations. Migration #2 deliberately aborts if published items or approved media already exist.

## Installation procedure (after a project is selected and created)

1. Clone the **approved release** or designated staging branch. Use a pinned Supabase CLI; consult `supabase --version` and `supabase --help` because flags can change.
2. In the project root, authenticate and link to the exact new project ref: `supabase login`, then `supabase link --project-ref <STAGING_PROJECT_REF>`.
3. Inspect `supabase migration list`, `supabase db push --help`, then use `supabase db push --dry-run` where supported. Compare every pending migration to the files above and verify that the project ref matches the new staging project.
4. Apply the reviewed migration sequence with `supabase db push`. Do not use `supabase db reset` against any remote project.
5. Inspect `nb_*` tables, indexes, functions, RLS policies, Storage buckets and `nb_internal` (non-exposed internal trigger schema). Run database Security Advisor and Performance Advisor; review all findings.
6. Deploy the reviewed `supabase/functions/nb-media-approval/index.ts` to **staging only**. Verify that its runtime's Auth and server-only key configuration is correct before exposing it; do not paste a `service_role` / `sb_secret_` key into a Vite variable.
7. Provision separate **test owner, editor, and unprivileged staff** users in staging Auth. Set `app_metadata.nb_role` with privileged Auth administration only. Never use a client password; refresh JWT after role changes.
8. Set staging frontend variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` with the **staging** project values. Keep those out of the production Vercel environment.
9. Run read-only `EXPECTED_SUPABASE_PROJECT_REF=<STAGING_PROJECT_REF> node scripts/check-client-cms.mjs`. This is a public API preflight, not full Auth/Storage validation.
10. Follow `docs/SUPABASE_STAGING_TEST_MATRIX.md`, record actual evidence and failures, then complete `docs/RELEASE_ACCEPTANCE.md`. Never mark a manual test passed without evidence.

## Database/Storage inventory

- **Catalogue:** `nb_categories`, `nb_products`, `nb_product_categories`, `nb_product_media`.
- **Editorial drafts/history:** `nb_product_drafts`, `nb_product_revisions`, `nb_home_drafts`, `nb_home_public`, `nb_home_revisions`.
- **Images and videos:** `nb_media` and Storage `nb-media-staging` (private), `nb-media-public` (public approved delivery only), `nb-media` (legacy private/unused).
- **Bulk operations:** `nb_import_jobs`, `nb_import_rows`, `nb_link_approved_media`.
- **Audit/administration:** `nb_audit_events`, `nb_catalogue_health()`, staff-only `nb_studio_product_index`.
- **Controlled publication:** `nb_publish_product(uuid)`, `nb_publish_home()`, transaction guards, real staff role checks and recorded revisions.
- **Auth:** Supabase-managed `auth.users`; use `app_metadata.nb_role` and restrict signup. No duplicate user credentials stored in catalogue tables.

## Important launch safety rules

- A file in a **public** bucket can be fetched by anyone with its URL. Pending and unapproved image/video uploads must remain in private staging.
- An approved image/video is copied from private staging to a public bucket by server-side logic. RLS on metadata alone does **not** hide an existing public Storage URL.
- Approval/revocation and object copying are not a single SQL transaction. Simulate partial failures and run a reconciliation procedure before relying on the workflow.
- Never use the Supabase service-role/secret key in `VITE_*`. Browser keys must be publishable and RLS-tested.
- Local PostgreSQL fixtures validate schema semantics, but **cannot** prove actual Supabase Auth, Storage APIs, Edge Functions, CDN, TUS resumability or browser rendering. Verify these in a real dedicated staging project.
- Production remains **NO-GO** until full staging evidence, backup restore, correct client-owned backend, domain, media rights and owner sign-off.

## Handover from AGM staging to client production

1. Do not transfer the agency staging database or sample test assets. Re-run the same reviewed migration files on a fresh **client-owned** Supabase project.
2. Confirm client identity and publishable key, and update only the client's Vercel environment variables. Verify the expected project ref before deployment.
3. Provision the verified store owner in Auth and assign privileged `app_metadata.nb_role` on the server, not from the browser.
4. Import real merchandise through CMS CSV/images under the owner's supervision, approve photograph rights, then publish as intended.
5. Perform the same negative security tests and limited acceptance checks on the client environment before its domain is promoted. Preserve the known-good legacy website as a rollback target.
