# Noman Brothers — Real Supabase Staging Verification Matrix

This is an **execution checklist**. Each row needs an actual observed result, tester, timestamp, screenshot/log/reference, and the exact deployment/commit. Do not mark a step passed based only on CI, an API HTTP 200, or a Vercel READY build.

| Gate | Test steps on a NEW AGM staging project | Pass criterion |
| --- | --- | --- |
| Schema / migrations | Apply all eight migrations in order; run `tests/sql/verify_supabase_inventory.sql` | 13 expected `nb_*` tables have RLS; correct functions, indexes and private/public buckets |
| Public catalogue | As an anonymous visitor read products/categories/homepage; attempt draft/media/audit access | Published information only; all sensitive data denied |
| Editor role | Sign in as editor; create draft, upload pending image/video, change alt text; try publishing/approving/deleting/reading audit | Draft/upload work; privileged operations denied |
| Owner role | Sign in as owner; review pending file, approve via Edge Function, publish product and homepage; inspect revision | Public copy exists; correct version and audit event; gallery available |
| Revoked session | Remove owner `app_metadata.nb_role`, revoke Auth sessions, retry approval and product publication | Fresh role check rejects operations and revocation takes effect as designed |
| Private files | Guess the staging object URL and access anonymously; request private preview as editor then let signature expire | Anonymous cannot fetch private bytes; authorized signed URL expires |
| Image types | JPEG, PNG, WebP, AVIF, GIF valid uploads; SVG/executable rejected | Server and client reject unsupported MIME; correct asset metadata |
| Video types | MP4, WebM upload, preview in CMS, approve, attach to product, view in public browser | MIME, metadata, video playback, mobile compatibility, public URL correct |
| Upload limits | 1 B, 6 MB, 50 MB boundary; retry interrupted TUS PATCH; offline/reconnect | Valid files succeed or safely fail; no duplicate metadata or orphan leaks |
| Media dependencies | Publish an image as product cover/category/hero; attempt to revoke | Revoke must fail until all published references removed |
| SKU image match | Upload `NB-SHW-001_01.jpg`, `_02.jpg`, approve, match to empty draft gallery | Correct SKU and order; manual gallery untouched; no auto-publication |
| Bulk CSV | Valid import, 10k-row import, invalid category, duplicate SKU, file replay, concurrent editors | Expected row counts, no silent overwrite, verified idempotence and ownership |
| Interrupted import | Kill browser after draft insert but before audit; retry same file | Existing draft recognized, counters reconcile, no duplicate product |
| SEO | Controlled **single** staging Vercel deploy and inspect raw HTML, sitemap, robots, canonical, 404 | Real HTTP response is crawlable; unpublished data never indexed |
| RLS/service policy | Real signed-out, editor, owner, no-role, revoked user requests to every Data API table and RPC | Zero unauthorized reads/writes, no service key in browser |
| DB stress | Seed 10k artificial garments and 100k media *on isolated staging only*, run indexed queries and page browsing | Record actual p50/p95 latency, HTTP errors, memory/network/cost; no invented thresholds |
| Storage stress | Upload realistic mixed file sizes, sample 250-photo batch and retry | Record successful uploads, 95th-percentile upload time, bandwidth and failure rate |
| Backups | Restore SQL + Storage object bytes to a different test project | Rows, images, published versions and permissions recovered |
| Client fork | Fork approved release to a clean temporary account/repo and wire a fresh Supabase project | No source-code changes needed beyond environment configuration |

## Repeatable test record

Record the following **for each gate**:

- Release Git SHA and source CI URL
- Staging project reference and Vercel URL (no keys)
- Test actor: anonymous/editor/owner/revoked (do not record passwords)
- Expected and actual result, HTTP status, screenshots/log locations, timestamp
- Measured p50/p95 when relevant, concurrency, hardware/network and Supabase plan
- Failure, correction, rerun and tester/reviewer signature

## A note on scale

The current CI performs a **10,000-row CSV parse** and **100,000 synthetic filename matches** in memory, not a real 10k/100k hosted database benchmark. Avoid calling that proof of database scalability. To approve production, create bounded synthetic database fixtures in a dedicated staging project and measure PostgREST/RLS/Storage with real network requests; then remove all synthetic fixtures before customer onboarding. These operations can consume storage/compute and incur fees, so calculate quotas first.

## Safe rollout procedure

1. Execute local/CI fixture checks and migration static audit.
2. Apply migrations to a fresh, approved AGM staging project only.
3. Provision actual *test* Auth identities. Exercise roles and private/public Storage.
4. Verify the product media approval Edge Function by calling through CMS using the user's access token, not a service-role browser key.
5. Correct failures through **new forward-only** versioned migrations, never silently edit SQL already applied.
6. Benchmark database and Storage with synthetic test data and record results.
7. After all backend gates pass, allow a **single controlled staging** Vercel deployment for the integrated UI and SEO smoke tests.
8. Review acceptance evidence. Leave client production and legacy website unchanged until both AGM and the shop owner sign off.

The only project currently visible through the connected account is `gym`; **do not** run these tests against that database.
