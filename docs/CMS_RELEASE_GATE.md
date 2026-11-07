# Nomaan Brothers CMS — Go/No-Go Checklist

This checklist separates **implementation** from **real-world production readiness**.

| Area | Code state | Evidence still required |
| --- | --- | --- |
| Men/Kids navigation | Implemented | Browser/mobile acceptance |
| Published catalogue adapter | Implemented | Dedicated live Supabase data |
| Supabase migration, RLS, publishing | Committed | Fresh real-project security tests/advisors |
| Private staff studio | Implemented | Invited owner/editor login |
| Image uploads and approvals | Private staging and approval candidate coded | Live Storage + MIME/path/permission, revocation and concurrency tests |
| Resumable short video upload | Implemented | Live TUS resume smoke test |
| Homepage drafts and publish | Implemented | Owner authorization + version rollback test |
| Product drafts and publish | Candidate code implemented | Real sample publish, negative role tests, media dependency checks and revisions |
| Source, TypeScript and SQL CI | Run on every push | Latest commit passing |
| Legacy Firebase retirement | Not remotely applied | Export data, deployed-rules inspection |
| SEO prerender/SSR | Candidate code implemented | Verify deployed Vercel routing, product HTML, 404s, sitemaps and Core Web Vitals |
| Accurate store content | Pending | Approved catalogue, photos, contact |
| Operations | Runbooks drafted; no live proof | Monitor costs, quotas, backup restore and rehearse recovery |
| Production merge | Not authorized | Client and AGM signoff |

## Hard blockers

**Phase 6 CI passing is not production sign-off.** Review each stacked PR and execute integration tests in a dedicated client-owned Supabase project. Release remains blocked until the independent Vercel staging acceptance, private/public Storage lifecycle, role revocation, scale benchmarking, and backup restoration are evidenced.

Do not publish if the new Nomaan-owned Supabase project is not configured, if RLS fails any negative test, if owner's role is not properly provisioned, or if photographs/WhatsApp details have not been approved.

The source code intentionally does not display an invented product catalogue or prices/discounts. Missing backend credentials show the public site without fake inventory.

## Manual smoke test

1. Open homepage and scroll on a low-end phone; verify reduced motion works.
2. Open Men's Wear > Sherwani > Handwork and Kids Wear > Sherwani; deep links and Back work.
3. Sign in as editor; upload an image and save a garment draft. Verify public does not change.
4. Sign in as owner; approve image and publish the product. Verify product appears in its correct category and gallery video loads.
5. Edit homepage imagery in studio; verify publication creates a revision and customers receive the published content only.
6. Verify no anonymous access to drafts, private accounts or uploads, and no browser-shipped privileged credentials.
7. Verify real product imagery/ownership, contact number and region labels; review database advisor warnings.
8. Verify production rollback plan and secure the deployed legacy Firebase project after export.

A Vercel READY status or successful CI alone never establishes that customer data is safe for production.


## Definitive release ledger (Phase 6)

Implementation in development branches is not proof of production readiness. See docs/RELEASE_ACCEPTANCE.md for authoritative go/no-go criteria. Real client Auth/RLS/Storage tests, private media promotion, 10k/100k load qualification, live SSR/sitemap/404 checks, backups, verified catalogue assets, and owner release sign-off are still mandatory. A GitHub CI success or Vercel READY status is insufficient.
