# Nomaan Brothers — Operations, Security and Recovery

This guide applies to a **dedicated client-owned Supabase project** and its own Vercel deployment. The connected project named `gym` is an unrelated app and must never be used.

## People and roles

- Client owner owns accounts, domain and billing. AGM has least-privilege collaborator access and provides source maintenance.
- `app_metadata.nb_role` is set by a privileged Auth administrator; staff cannot grant themselves roles using browser-user metadata. Editors prepare drafts; admins/owner approve/publish. Avoid shared accounts.
- For staff offboarding: revoke sessions, remove privileged role, rotate any shared credentials used outside Supabase, review recent revision/import actions. JWT claims may be cached until token expiry; test access removal against a real session.
- Restrict Supabase and Vercel dashboard team permissions; enforce MFA where available.

## Backup strategy and restore drill

1. Choose backup cadence and retention for the client's Supabase plan; document actual provider capabilities. Verify backups include the database and independently archive original uploaded media objects; a DB dump alone does **not** restore Storage bytes.
2. Before migrations, export the schema, catalogue data, auth-user references and Storage object inventory to client-controlled encrypted storage. Protect PII and object URLs; no backups in Git.
3. Test restore to a **separate staging project**. Verify foreign keys, row counts, product-media mapping, private/public bucket objects and owner Auth re-provisioning without overwriting production.
4. Record restore time, backup timestamp, API health, publish revision count and restore errors. Only a passed drill satisfies the release gate.
5. Make forward-only SQL migrations for databases that have already received previous migrations; never edit applied history or silently replay a changed initial SQL file.

## Media lifecycle and reconciliation

- New files upload to private `nb-media-staging` and receive a DB `nb_media` row.
- The owner/admin Edge Function verifies a **fresh** Auth role, copies approved objects into public `nb-media-public`, and marks the metadata approved.
- File copy and SQL update are not a single atomic transaction. On failures, flag and reconcile: (1) uploaded object without metadata; (2) public object without approved metadata; (3) approved metadata with missing public copy; (4) revoked image still cached externally.
- Review referenced published product associations before revoking/deleting media. Avoid deleting referenced garment photos.
- A previous `nb-media` public bucket is changed to private for clean installs; existing files require an **audited asset backfill**. Phase 2 deliberately blocks automatic conversion if previously published product/media records exist.

## CSV/import lifecycle

- Jobs record a stable file fingerprint, creator, total, processed/imported/skipped/error counts, and per-row audit entries. Do not run the same CSV concurrently.
- CSV draft identities are deterministic per job/row; on retry the importer recognizes its existing draft even if the row-audit insert failed. Image batch paths are also deterministic, allowing recovery of prior uploaded Storage objects and missing metadata. This reduces duplicates but does **not** make Storage and SQL writes atomic. Inspect the job/audit state after browser interruption, concurrent-session conflict or quota errors.
- Import fingerprints are scoped to each authenticated staff member. Two employees can process the same source file without sharing mutable job records.
- Interrupted multipart/TUS transfers may still require manual reconciliation of incomplete upload sessions or expiry. Do not promise background processing after a browser tab is closed.
- SKU matching only attaches approved assets to empty draft galleries and never publishes them.
- Examine failed-row report; do not blindly retry huge batches on authentication/quota errors.
- Validate and monitor Storage size, bandwidth, PostgREST limits, per-query response time, file upload success/timeout rate and Supabase billing.

## Published media revocation

- Media approval/revocation uses a privileged Edge Function that refreshes the owner's role from Auth rather than trusting a stale browser JWT.
- A currently published product gallery, video, homepage or category banner blocks removal of its public asset. Editors must first replace references and publish the updated content. Stale CDN copies may remain externally cached for a limited period.
- Reconcile partial public-copy/metadata failures before declaring approval or revocation complete.

## Deployment/change control

1. Keep PRs draft until tests pass and code is reviewed. Preserve prior Vercel production deployment as rollback candidate; do not auto-build a Vercel preview for each push.
2. Confirm client Supabase ref and owner-approved domain before setting Vercel environment variables. `VITE_` values are browser-visible; never use service-role or secret keys there. Server-only secrets belong in Supabase Edge Function runtime, never source code.
3. Confirm migrations/Storage/Edge Functions deployed to client staging and real user permission tests. Run `EXPECTED_SUPABASE_PROJECT_REF=...` plus `node scripts/check-client-cms.mjs` and `node scripts/smoke-deployment.mjs https://STAGING_ORIGIN`.
4. Test real Vercel response statuses/HTML/sitemap and the admin UI before approving production. If a staging URL uses Vercel Authentication, access it via authorized Vercel tooling; do not remove protection just to satisfy automation.
5. Release only after `docs/RELEASE_ACCEPTANCE.md` has all real evidence and signoffs. Production deployment is a separate controlled operation; `main` remains protected and Vercel deployment gates prevent unintended promotions.
6. Monitor request/runtime errors and client-reported issues after release. Roll back the Vercel deployment if needed, but note that rolling back code **does not automatically roll back database migrations**.

## Incident handling

- **Unauthorized access:** disable/revoke identity, inspect Auth logs, history/asset changes, backups and sharing links. Rotate server credentials if compromise is suspected.
- **Wrong store backend:** stop deployment; verify client project ref and env/preview scope. Never copy production data between clients without approval.
- **Missing products:** check publish status, category routes, RLS, migration history and API failures. Avoid adding fake sample merchandise.
- **Upload stuck:** check Storage bucket policies, TUS endpoint, file size limit, Auth expiry and orphan job records.
- **Search results missing:** verify table indexes, valid published status, category membership and server pagination. Distinguish application error from legitimately empty categories.
- **SEO missing:** inspect live HTTP page source instead of only browser DOM; test product function packaging, sitemap, robots and canonical URL.

## Handover checklist

Provide the client with their repo, environment-variable **names** and where to retrieve public values, staff login method, CMS user guide, backup responsibilities, operations contact, exact release SHA and instructions for future migrations. Never hand over an agency-wide secret or password.
