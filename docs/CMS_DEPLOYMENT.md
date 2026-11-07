# Nomaan Brothers — Supabase CMS Commissioning Guide

## Safety first
1. The connected Supabase accounts currently expose only an inactive project named **gym**. It is unrelated. Do not deploy any Nomaan migration there.
2. Create a dedicated **client-owned** Supabase project for Nomaan Brothers (plus staging when practical). Record its project ref and regional selection. Give AGM a limited collaborator seat.
3. Keep the current Vercel production deployment and its database untouched until a verified replacement is ready.
4. Export existing Firebase products, user documents, orders and return records. Check **deployed** Firestore rules: the old committed rules allowed overly broad writes. Treat this as an urgent separate security assessment.

## Database
Review the migration file at:
supabase/migrations/20261107060000_nomaan_cms.sql

Apply it through the Supabase project's SQL editor or a reviewed Supabase CLI migration flow. It creates isolated nb_ tables, category labels and the nb-media bucket. It does not add fake inventory or overwrite unrelated tables.

Inspect these tables:
nb_categories, nb_products, nb_product_drafts, nb_product_revisions, nb_media, nb_home_drafts, nb_home_public, nb_home_revisions.

Run Supabase Security Advisor and verify RLS/GRANTs. Anonymous readers should access only **published** products and homepage; they cannot access drafts. Ensure Data API exposure is explicitly configured where needed. Storage uploads must be authenticated and limited to a user-specific prefix. The bucket currently serves uploaded objects publicly; media approval controls whether they are referenced by the website, **not whether someone with the direct URL can access the file**. Do not upload confidential photos.

## Provision owner/editor accounts
- Create or invite the owner email through Supabase Auth in the **new** project.
- Grant the role with a privileged action (Supabase dashboard/Admin API), never via browser mutable metadata.
- Supported app_metadata key: nb_role, values "owner", "admin" or "editor".

For example, in the **new project's** SQL editor and only after confirming the email belongs to the owner, set raw_app_meta_data of the intended auth.users row to include {"nb_role":"owner"}. The user must refresh their session for new JWT claims. Never use the legacy hardcoded admin PIN.

Roles:
- Owner: approve/publish and delete records.
- Admin: approve/publish.
- Editor: upload media and write private drafts.
- Visitor: read published content.

Disable open self-registration if the CMS is staff-only. Turn on MFA and strong password rules where supported, and keep a staff revocation procedure.

## Vercel preview
Configure Preview environment variables from the newly created project's API settings:

    VITE_SUPABASE_URL=https://NEW_PROJECT_REF.supabase.co
    VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_NEW_PROJECT_KEY

Never expose any service-role or Supabase secret key in a frontend variable. Set CORS/redirects/auth origins appropriately for the preview and future domain. Verify /studio is noindexed and served with private no-store semantics.

## Publish content
1. Sign into /studio as an authorized staff member.
2. Upload real approved garment photos (JPEG, PNG, WebP, AVIF, GIF), and short MP4/WebM videos (up to 50 MB). Larger files use chunked TUS uploads within the current session.
3. Owner/admin reviews and **approves** assets. The CMS never publishes unapproved images via its publish flow.
4. Create product drafts: SKU, slug, title, department, one or more category routes, approved image, descriptions, sizes and optional video.
5. Owner/admin publishes an atomic revision; the public page reads the published row.
6. Set homepage hero and department/story imagery using approved media; save draft then publish.
7. Verify new product, relevant category and homepage in an incognito browser. No empty category should display invented products.
8. Confirm media usage rights and storefront WhatsApp contact with the owner.

For heavy streaming or large marketing videos, plan a dedicated adaptive video provider rather than raw Storage playback.

## Mandatory production commissioning tests
**Unauthenticated:** published product read works; anonymous product write, draft read, media upload, delete and publish all fail.

**Editor:** upload to own folder succeeds, saving product/homepage drafts succeeds, publishing, approving media and uploading to someone else's folder fail.

**Owner:** approves media, publishes homepage and product, revision count increments, content appears only after approval. Verify previously published product remains unchanged while a new draft is being edited.

**Operations:** backup/restore drill, server and Storage quotas, security advisors and audit logs, mobile/reduced-motion accessibility, product/category deep link refresh, search, Core Web Vitals, crawler indexing checks, failure rollbacks.

### Open items before go-live
- Obtain owner-supplied catalogue and real photographs/videos; no demo stock.
- Confirm names "Sadi" and Sherwani "Plain Suits".
- Confirm store WhatsApp number and address.
- Test direct media URLs/permissions and the TUS upload client on real Supabase Storage.
- Validate the schema migration against the real project and run security advisors.
- Review that Vite SPA category/product routes are indexable; implement prerender/SSR if appropriate.
- Do NOT merge, promote or remove the current deployment until all gates above pass.

## Rollback
Keep the existing Vercel production deployment as known-good. A failed staging deployment must not alter production. Before retiring Firebase, export data and verify retention requirements. The git file firestore.rules alone does not update remotely deployed Firebase policy.
