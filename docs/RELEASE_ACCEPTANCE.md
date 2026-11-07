# Nomaan Brothers — Release Acceptance and Go/No-Go Ledger

**Release status: NO-GO until every required gate is evidenced and approved.**
Source-only GitHub CI is necessary but not sufficient. Client domain and production Supabase credentials are **not yet connected**. The existing live Firebase/Vercel deployment must remain intact until a staged replacement is tested and the owner approves release.

## Git/source integrity (automated; confirm exact commit)

- [ ] PR #2 through Phase 6 are reviewed in dependency order and reduced to approved mergeable diffs.
- [ ] Exact intended release commit matches an immutable GitHub Actions green run: locked deps, TypeScript, Bun, SQL auth/migration tests, preflight contracts, SEO prerender tests, and build.
- [ ] No API keys, privileged tokens, database passwords, customer information or unapproved product data are committed.
- [ ] GitHub `main` is protected: PR reviews, status requirements, no bypass/force push where possible; Vercel production promotion controlled.
- [ ] Verify preview deployment suppression remains enabled. Do not trigger per-commit Vercel previews.

## Dedicated client-owned Supabase acceptance (UNVERIFIED)

- [ ] New Supabase project owned by the store client, distinct from `gym`, configured with required RLS/Storage/Edge Functions.
- [ ] All migrations applied on a dedicated staging project, with migration history and advisors reviewed; old published media handled by a reviewed forward-only backfill if applicable.
- [ ] Verify SQL RLS with **real** anonymous, editor, owner and revoked users; rejected product edits, media reads, approvals, deletes, forged revisions and unauthorized import rows.
- [ ] Verify pending uploads are not reachable by anonymous/public URL, including the old bucket. Private signed preview expires.
- [ ] Verify owner-only approval Edge Function checks **fresh** Auth role, copies to public bucket, reconciles object failures, and correctly revokes publication.
- [ ] Verify media publish RPC rejects references to unapproved assets and preserves immutable revisions.
- [ ] Test legitimate staff login/logout, session expiry, role removal, failed refresh and MFA where available.

## CMS onboarding and scale (UNVERIFIED)

- [ ] Real 5-product happy-path test: upload; approve; draft; edit; publish; archive; restore; homepage publish.
- [ ] CSV validation, repeat-run idempotence, interrupted-resume, wrong category, duplicate SKU, malformed text, external images, and concurrent admin conflict test.
- [ ] 250-photo interrupted resumable upload including 50 MB boundary. Check orphan cleanup/reconciliation.
- [ ] Stage 10,000 synthetic products and 100,000 synthetic media rows; measure server p95 query times, browser page readiness, list virtualization, Storage bandwidth, API limits and costs. Record measured results.
- [ ] Verify SKU matching and correct photo order for all sample products; no silent overwrite of manual galleries.

## SEO/UX/accessibility (UNVERIFIED)

- [ ] Staged Vercel product and category routes serve meaningful initial HTML with correct status codes (invalid products must return genuine HTTP 404).
- [ ] Vercel Function can locate built `dist/index.html` and published data using anonymous-only key; no private drafts surfaced.
- [ ] Dynamic sitemap index/static/product chunks validate against a sitemap tester, with only published pages and the verified canonical domain.
- [ ] Search engine crawlers can read product headings, alt text and links; canonical/JSON-LD reflect real owner-approved data. Prevent duplicate product metadata.
- [ ] Mobile devices of different sizes, keyboard and screenreader navigation, reduced motion, image aspect ratios, layout shifts, Core Web Vitals and high-contrast accessibility tested.
- [ ] Security headers (CSP, frame denial, noindex/no-store on Studio, HTTPS) verified on live Vercel responses.

## Operations, ownership, and release authorization (UNVERIFIED)

- [ ] Client owns GitHub repo, Supabase, Vercel, domain. AGM added as appropriately scoped collaborator.
- [ ] Owner-approved name/spelling, address, WhatsApp, category labels and image rights documented; no fake pricing or sample stock.
- [ ] Export old Firebase data and inspect **deployed** Firestore security rules before any retirement.
- [ ] Database restore drill, Storage recovery, image orphan reconciliation, import audit, staff offboarding and incident response rehearsed.
- [ ] Record staging deployment URL, release SHA, CI URL, owner approval, migration backup references, timestamp and rollback deployment.
- [ ] Verify Vercel env keys `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`; add owner-verified `SITE_CANONICAL_URL` only after domain confirmation.
- [ ] Only then authorize and apply a controlled production deploy, test real public browsing and studio auth. Keep the known-good rollback target until successful handover.

## Reviewer log (must be filled at actual release, not guessed)

| Item | Verified value |
| --- | --- |
| Client Supabase ref | PENDING |
| Staging project ref | PENDING |
| Owner-approved domain | PENDING |
| Exact release Git SHA | PENDING |
| Automated CI URL | PENDING |
| RLS/Storage/Edge tests | PENDING |
| 10k/100k load test evidence | PENDING |
| Staging smoke test URL | PENDING |
| Restore drill evidence | PENDING |
| Store owner signoff | PENDING |
| AGM signoff | PENDING |
| Production deployment URL | PENDING |

**Never label a PR or deployment production-ready based solely on the status “READY” or source compilation.**
