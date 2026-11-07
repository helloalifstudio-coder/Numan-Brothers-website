# Phase 1 — Security / Clean-Fork Foundation Review

**Status:** DRAFT development-only, no remote schema migration, no production merge.

**Dependency:** This branch is based on `agm/nomaan-supabase-cms-production` (draft PR #3), rather than the legacy `main`. Review this PR as a stacked change; never merge the dependent branch independently into the live branch.

## Security findings and dispositions

| Severity | Finding | Phase 1 action | Release disposition |
| --- | --- | --- | --- |
| High | Authenticated publisher could INSERT arbitrary published product/home revision rows through the Data API, without the publish RPC. | Added `nb_require_publish_scope` INSERT triggers for both revision tables; SQL negative tests assert direct inserts fail. | Verify in fresh Supabase environment. |
| High | Owner could hard DELETE products/media through Data API. No archive workflow or reconciliation existed. | Removed table DELETE grants and policies in the not-yet-released initial migration; SQL negative tests added. | Later archive/cleanup RPC must be separately reviewed. |
| **Critical for go-live** | `nb-media` Storage bucket remains public. Pending/unapproved uploads are addressable by direct URL. | Recorded explicit onboarding/release blocker. | **MUST** implement private staging + approved delivery and verify media migration before any client upload/live release. |
| High | Existing Firebase backend may still have permissive *deployed* Firestore rules. | Documented export and live-policy review; did not touch remote Firebase. | Must inspect/secure deployed Firebase before retirement. |
| High | Proposed migration has only fixture-based PostgreSQL security tests; none have yet run on a dedicated client-owned Supabase project. | Retained fixture tests and introduced anonymous read-only REST commissioning probe. | Negative RLS, real Auth and Storage integration tests are required; fixture tests alone are insufficient. |
| Medium | Privileged `app_metadata` role claims can remain stale in already-issued JWTs. | Documented session refresh/revocation procedures. | Test role removal with live sessions; choose appropriate JWT expiry. |
| Medium | Production Vite build checks only presence of plausible URL/key, not a working client schema. | Added `scripts/check-client-cms.mjs` to validate project ref, public schema and anon permissions using a publishable key. | Separate live integration gate; run against correct target during commissioning. |
| Medium | App currently fetches only 500 published products and fixed media lists. | Explicitly deferred to Phase 2 scalable queries. | Required before 10k/100k acceptance benchmark. |
| Medium | SPA SEO, correct 404 and domain/canonical data require validation. | Existing metadata sanitization retained; scoped to Phase 5. | Owner-approved domain and crawler tests required. |
| Operational | No verified production restore drill, image rights confirmation or multi-client clone test. | Added client-owned fork/onboarding procedure; no demo data. | Mandatory before handover. |

## Changed Phase 1 controls

- Pending initial migration: `supabase/migrations/20261107060000_nomaan_cms.sql`. Phase 1 changes it because the CMS candidate has **not** been deployed to a Nomaan-owned project. If anyone applied the earlier migration to a real database, **do not edit migration history or silently replay**; create a reviewed forward-only hardening migration instead.
- `tests/sql/assert.sql`: owner cannot forge revision history or directly hard-delete products/media; existing tests still exercise approved publish RPC.
- `tests/cms-security.test.ts`: structural migration assertions.
- `scripts/check-client-cms.mjs` and `tests/client-preflight.test.mjs`: read-only Supabase client-project and anonymous access checks.
- `.github/workflows/quality.yml`: new preflight contract tests.
- `docs/CLIENT_ONBOARDING.md`: ownership, fork, migrations, environment variables, authorization and commissioning.

## PR-level evidence required

1. Latest commit passes the GitHub `Website quality gate` TypeScript/build, static tests, PostgreSQL authorization fixture and production credential fail-closed check.
2. The PR has a small, inspectable diff against the CMS draft branch, with no change to `main` and no live migrations.
3. No production env values, service-role keys, passwords, or customer data committed.
4. No direct deployment, preview promotion or Netlify changes caused by this work. The Git-integrated Vercel service may automatically make a protected **preview** for a development branch; previews are not live production.
5. The critical media-publicity blocker and real-project testing remain clearly flagged.

## Phase handoff

- **Phase 2:** Product/media relational schema design, safer staging/publishing bucket infrastructure, search/pagination model, backfill plan, and revised migration tests.
- **Phase 3:** Staff catalogue/media UI, approval and publication; secure integrations for new buckets.
- **Phase 4:** Bulk import and upload queue.
- **Phase 5:** Storefront paging, SEO, optimized images, accessibility, performance.
- **Phase 6:** Fresh-fork release rehearsal, complete live RLS/Storage/Auth tests, backups, client onboarding sign-off.

No claim of production readiness is permitted until all phase gates pass.
