# Noman Brothers — Repository consolidation and Vercel parity audit
**Audited:** 7 November 2026 (AGM)

## Purpose
Consolidate the 13 open draft PRs / 14 branches into a single authoritative React/Vite/Supabase showroom codebase on `main`. Both Vercel projects must build **the same exact source commit** with compatible browser-side Supabase public environment settings.

## Baseline verified before merge
- Repo: `helloalifstudio-coder/Numan-Brothers-website` (public)
- Old `main`: `0691a7f63c6fb684dacaff6d70cb48dcfad0636b`, no branch protection.
- Release candidate: `agm/noman-supabase-sql-editor-kit`, commit `81a776cf66cb1d798e5dbf84a3c5177cb8ec1f9f` before this report.
- `PR #13` is the unified diff targeting `main`, previously 127 changed files/196 commits; conflict-free.
- 12 other open draft PRs (#1–#12); #2–#12 are stacked ancestors of PR #13.
- #1 (`agm/heritage-uiux-audit-2026-11`) is an **alternate earlier editorial UI experiment**, including a distinct `EditorialHero.tsx`; it is **not** the chosen V2 storefront design. Treat it as superseded, not something to silently merge over V2.
- GitHub CI passed on latest release candidate: https://github.com/helloalifstudio-coder/Numan-Brothers-website/actions/runs/42384376594 (compile, Bun tests, SQL/role tests, locked build, sitemap, SEO and safe review checks).
- Existing original Vercel production was READY at old `main` commit `0691a7f`; never assume this old deployment has the new CMS.
- Separate Vercel CMS review had the unified release candidate READY at `81a776cf` and publicly accessible on its dedicated stable URL.

## Static codebase findings
1. **Single active app:** `src/main.tsx` mounts `src/App.tsx`. The release candidate uses the new `V2*` customer UI, a lazy-loaded private `/studio`, and no active Firebase checkout/admin. Legacy `src/lib/firebase.ts`, `firestoreService.ts`, `AdminPortal.tsx`, and `CartDrawer.tsx` no longer exist in release candidate. The npm package lists Supabase but no Firebase SDK. Preserve the old Git history and old Vercel deployment for rollback/history.
2. **No payment gateway:** the replacement is intentionally a read-only showroom and WhatsApp enquiry, not a payment/stock/order system. Customers with old Firebase orders or data must be exported/migrated separately if needed.
3. **CMS security:** owner/admin/editor roles come from immutable `auth.users.raw_app_meta_data` JWT claims. Creating an Auth user alone is not enough; it must have `app_metadata.nb_role`. Browser has only a publishable key; no hardcoded admin PIN or privileged key. SQL/RLS/approval correctness is tested in PostgreSQL CI fixture, but real editor/owner and function tests are still mandatory.
4. **Database:** nine forward-only migrations, atomic SQL Editor installer (new empty database only), 13 application tables, RLS policies, private staging media and public approved delivery, Edge Function source, SKU import workflow, publication versions and audit checks.
5. **SEO:** Vercel category prerender, published-only product handler, sitemap functions; noindex and robots disallow review builds without owner-approved canonical site. Final indexing depends on verified domain and real content.
6. **Build:** locked Bun dependencies, TypeScript checks, test suite and PostgreSQL fixture in GitHub Actions. Existing release gate is conservative: it requires hosted Auth, storage, media approval, backups and owner signoff before advertising fully working checkout or production.
7. **Client details:** store spelling, content, WhatsApp number, image rights and category naming require owner signoff. Do not insert demo products or hardcode credentials.

## Two Vercel projects — exact parity contract
| | Existing project | AGM CMS project |
| --- | --- | --- |
| Name | `numan-brothers-website` | `numan-brothers-cms-showroom` |
| Project ID | `prj_QvvKR6ybFqjnqcw87kZYvXx6XCxL` | `prj_Gt351DchejIVpndpzBFokzMhdAYG` |
| Team | `agm-3137` | `agm-3137` |
| Source of truth | the same GitHub `main` release commit | the same GitHub `main` release commit |
| Runtime | Vite/React, Bun locked deps, Node 24 | Vite/React, Bun locked deps, Node 24 |
| Public Supabase origin | `https://zazdxmukmcayblsteulk.supabase.co` | same |
| Browser API key | same Noman project publishable key, encrypted at Vercel | same |
| Domain | `numan-brothers-website.vercel.app` | `numan-brothers-cms-showroom-agm-3137.vercel.app` |

To verify parity after deploying, ensure both Vercel deployment metadata entries cite the **same SHA** and are READY. Compare `/assets/*.js` and `/assets/*.css` URLs/hashes; their main app bundles should be identical when the build inputs are identical. Verify both `/`, `/studio`, collection pages, security headers and `/api/cms-status`. Deployment protection is a **separate** setting and must not be mistaken for a UI difference.

## Release blockers still requiring real-user acceptance
- Noman project `zazdxmukmcayblsteulk` is not visible in AGM's connected Supabase account; live Auth user roles cannot be administered/inspected.
- Owner login, editor rejection, approved image/video promotion via `nb-media-approval`, end-to-end product/homepage publishing, restore/revocation, accessible mobile browsing, and real 10k/100k media load tests are not proven.
- Public read-only CMS diagnostics on the separate Vercel site showed Auth reachable, public categories/products/homepage accessible, and private draft/media/revision tables denied anonymously. These are narrower checks than production security clearance.
- `main` lacks branch protection; configure required status checks/reviews in GitHub repository settings.

## Consolidation/cleanup procedure
1. Ensure both Vercel projects have the two correct public Noman Supabase env variables **before** promoting new source to original production.
2. Verify CI against final candidate commit, and stage/build exact SHA. Preserve original production deployment ID as rollback.
3. Merge unified PR #13 to `main` once specifically authorized (user has now explicitly requested).
4. Rebuild/deploy exact merged `main` source on **both** Vercel projects, verify identical UI bundle checksums/routes.
5. Close redundant stacked PRs #2–#12 and obsolete alternative UI experiment PR #1, recording that neither PR's code should be merged separately.
6. Delete obsolete branch refs **only after** they are no longer used by CI/deployments and main contains all approved changes. Do not delete `main`, rewrite history, or delete rollback deployments. If connected GitHub tooling lacks a branch-ref DELETE operation, finish via GitHub UI (Branches → Delete branch). Confirm reference cleanup separately.
7. Continue future releases using `main` as sole production source, with short-lived reviewed branches and CI for changes; don't maintain a permanently diverged second UI branch.

## Explicit omissions
No secret API keys, passwords, private user data or unverified claims of revenue/payment completion are included in this report.
