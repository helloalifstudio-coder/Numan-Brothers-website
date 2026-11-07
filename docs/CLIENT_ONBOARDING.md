# Nomaan Brothers — Clean-Fork Client Onboarding (Phase 1)

> **Release gate: NOT production-ready.** This procedure is a commissioning contract, not an instruction to migrate the current live website. The new CMS is still on a DRAFT candidate PR. Fork the approved release on `main` **only after** review, migrations, live security tests and the release gate are complete.

## Ownership and separation

- The store owner creates and controls their own GitHub, Supabase, Vercel and domain accounts. AGM receives only the least-privilege collaborator access required; never obtain a client's Gmail password.
- Use a **new, dedicated Supabase project**. The connected `gym` project is unrelated and MUST NOT be used.
- Each client installation has its own GitHub repository, database, Storage and Vercel project. Do not share production environments or privileged keys between clients.
- Never fork an unreviewed feature branch or PR #3 and treat it as a production release. A tagged release from approved `main` will be the install source.
- No demo inventory, fabricated photographs, unapproved contact information or browser hardcoded administrator PIN.

## Step 1: Client GitHub repository

1. Client signs in to GitHub using their account; fork the approved release repository into their account and verify its owner, default branch and latest release commit.
2. Disable accidental production writes from test branches using GitHub branch protection/rulesets when account capabilities permit: require CI, code review, no force push and no bypass without authorization.
3. Create the production Vercel project **only from the client's fork**, not the agency's demonstration project.
4. Verify the production branch is `main` and previews use non-production branches. Do not assume GitHub CI alone prevents Vercel auto-deployment; configure production deployment protection/checks.

## Step 2: Dedicated Supabase project

1. Client creates a **new** Supabase project in their organization, with the desired region. Record the exact project ref locally.
2. In the reviewed repository clone, install an approved Supabase CLI version. Run `supabase --version` and `supabase db push --help`; CLI flags can change.
3. Link to the **exact client ref** using `supabase link --project-ref <CLIENT_PROJECT_REF>`. Re-check that the linked ref is the one just created.
4. Inspect pending migrations: `supabase db push --dry-run`. Independently review the SQL and confirm the target before applying. Use only the explicitly linked **new project**; do not apply to any agency/demo/legacy database.
5. Once migration tests pass and the new project is confirmed, apply via the reviewed CLI's remote-push workflow. Confirm migration history and tables. The current initial migration is `supabase/migrations/20261107060000_nomaan_cms.sql`; later phases may add migrations.
6. In the dashboard, verify RLS and Data API table grants, inspect Security Advisor and validate Storage buckets and policies. A table existing is not proof the API is secure.
7. Turn off public signup for a staff-only CMS. Configure MFA/strong passwords where available, rate limits and approved email/auth settings.

**IMPORTANT:** At Phase 1, the candidate still uses public `nb-media` storage. An unapproved upload is directly accessible if its URL is known. This MUST be replaced by private staging and controlled publication before a client uses the CMS or uploads confidential media. The current upload implementation must also be updated to use the final bucket names.

## Step 3: Owner account

1. Invite or create the verified owner in the **new** project's Supabase Auth. Verify identity through the client's own approved channel.
2. With privileged Supabase Auth administration, assign `app_metadata.nb_role = "owner"`. This must NEVER be editable through `user_metadata`, browser code or a public RPC.
3. Have the owner refresh their session or sign in again. Verify `/studio` works and an unprivileged user has no access to protected content. Prove editor cannot approve/publish.
4. Keep a documented role-revocation and session-expiry procedure; stale JWTs can retain prior claims until expiration.

## Step 4: Environment variables and Vercel

Set these **public client** environment variables inside the CLIENT-owned Vercel project, scoped to the correct Preview/Production environments:

```dotenv
VITE_SUPABASE_URL=https://CLIENT_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_CLIENT_PUBLIC_KEY
```

Never use `VITE_` for a service-role/secret key, database password, private API token or server-side signing key. They are embedded in browser assets. Do not commit a real `.env` file or publish environment dumps.

- Prefer a separate staging Supabase project for Preview; do not point untrusted PR previews to live customer data.
- Deploy the fork only after Vercel environment settings are in place. The production Vite build intentionally fails closed if the CMS URL/key are absent.
- Record the generated Vercel HTTPS URL; after owner approval, configure the custom domain, canonical URL, search metadata and Supabase Auth site URL/allowed redirects where needed. Never hardcode another shop's domain.
- Test direct refresh of `/studio`, `/men`, and a product detail URL, HTTPS headers, browser login/logout, preview noindex behavior and public media access.

## Step 5: Read-only commissioning probes

With the two public Vite variables loaded in the local shell and the **additional expected project reference**, run:

```bash
EXPECTED_SUPABASE_PROJECT_REF=<CLIENT_PROJECT_REF> node scripts/check-client-cms.mjs
node scripts/smoke-deployment.mjs https://YOUR-CLIENT-VERCEL-DOMAIN.example
```

The first command only reads the public Supabase REST API and confirms anonymous access to required published tables while private draft/media/revision table reads are denied. It rejects mismatched projects, non-HTTPS origins and non-publishable keys. It **does not mutate the database**, nor does it validate live staff Auth or Storage policies.

The second verifies deployment routes and headers. Its output cannot substitute for real UI, API, negative-role, upload or backup tests. A Vercel authentication-protected preview might not be accessible to the HTTP probe; use a properly authorized test setup rather than disabling production protections.

## Step 6: Mandatory production sign-off (not completed)

- Fresh client-owned Supabase project, migrations, Security Advisor, negative RLS/role tests and Storage policies pass.
- Private staging/public media promotion implemented and tested. Test MIME/path policies, media approval, TUS resume and orphan cleanup.
- Owner/editor/anon accounts perform only authorized actions. Published history cannot be forged and routine hard deletes are forbidden.
- Publish real test product and homepage revisions; test archive/restore, category deep links, search, mobile, SEO, and error handling.
- Catalogue scale tests with synthetic data and import replay are completed in later phases.
- Firebase deployed rules/data have been reviewed/exported; legacy access is retired only through a controlled change.
- Business spelling, location, photos, category labels, WhatsApp number and domain are approved by the owner.
- Backup AND restoration rehearsed; cost/quotas/monitoring/recovery steps documented.
- AGM/client sign off the exact tested commit before PR merge, production deployment or domain promotion.

**Rollback:** Preserve the existing deployment until replacement acceptance and rollback rehearsal. A preview deploy or SQL migration in a dedicated staging project must not change the existing production database or domain.
