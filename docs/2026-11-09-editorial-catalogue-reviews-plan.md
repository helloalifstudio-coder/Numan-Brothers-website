# Noman Brothers — Editorial, Catalogue Sharing & Trust Release Plan
**Created:** 9 November 2026 | **Branch:** `agm/editorial-catalogue-reviews-2026-11-09` | **PR:** #21

## Business outcome
Create a luxury ethnicwear catalogue that the showroom owner can manage through Studio, show on mobile and desktop, and share directly with shoppers on WhatsApp. Never invent stock, prices, ratings, social accounts, or legal commitments.

## Phase 1 — Editorial homepage and brand film
**Implemented in PR:** A split hero has branded copy left and a large portrait film panel right on desktops, stacking on phones. An optional owner-approved video plays muted, loops, has native user controls, and respects reduced-motion preferences. Before upload, an editorial artwork/poster is shown. The three featured cards have their own Studio image editors; Men’s/Kids’ covers and story photography remain editable. Four original SVG illustrations are labeled as **illustrations rather than current inventory**; approved photographs override them. Real brand photo/video uploads still need the owner.

## Phase 2 — Shareable catalogues
**Implemented in PR:** Every product, Men’s Wear, Kids Wear, and each category URL has a WhatsApp sharing control plus copy-link fallback. Real garment links render exact title, SKU and leading product photo through the existing server-side SEO page. Up to four approved HTTPS photos are included as text URLs for sharing when available; recipients can view the full gallery on the product page. Do not claim WhatsApp has automatically attached photos, created PDFs, or sent any messages. Large catalogues are paginated in the app, avoiding huge message payloads.

## Phase 3 — Trust information and social profiles
**Implemented in PR:** Official HTTPS social profiles can be managed for Instagram, Facebook, YouTube, Pinterest, Threads, X, TikTok, Snapchat and LinkedIn. Only populated profiles appear in footer and contact page. Privacy, Terms, and Returns/Exchanges each have a dedicated public page editable in Studio. If not confirmed by the client, pages clearly state policy text is pending; no invented refunds, returns, customer-data obligations or deadlines. Legal review/owner approval remain necessary.

## Phase 4 — Genuine reviews
**Implemented in PR:** Matching directory evidence is the Justdial `Nomans Bros` listing opposite Madrasi Masjid, Mandi Bazaar, Warangal; sources vary, so the site does not cherry-pick a positive rating. See: https://www.justdial.com/Warangal/Nomans-Bros-Opp-Madrasi-Masjid-Mandi-Bazaar/9999PX870-X870-131215171002-P7L6_BZDET.
Public website submissions are stored with `pending` status. Only approved first-party customer reviews render in the homepage section before the footer. Studio has moderation actions available to the owner/admin role; no automated web scraping or copying of third-party review text. The initial public form is guarded by validation, honeypot and duplicate suppression, but additional IP-level throttling or CAPTCHA should be enabled before high-volume public campaigns.

## Phase 5 — Test Plain Sherwani
**Implemented in PR:** A clear `Demo Only / Not for Sale` preview at `/products/sample-plain-sherwani` has three illustration images, sizing, SKU and share controls. It is intentionally not inserted into the live Supabase inventory. In Studio → Products, an admin can prepare an editable draft with auto-generated SKU, category `/men/sherwani/plain`, and all product fields. The draft requires verified photos before publication. The category label is updated from an incorrect `Plain Suits` heading.

## Phase 6 — Security, releases, and operations
- Published homepage asset references require approved Supabase media; featured-card assets are also protected from premature archive/delete.
- Policies and contact details use the existing versioned Website CMS publish workflow.
- SQL migration files and the fresh-project one-shot installer are kept synchronized, with RLS contract tests.
- All local unit, SQL, TypeScript, production build, and 18-breakpoint Chromium browser checks must pass before merging to `main`.
- Apply additive database migration, verify grants and RLS, then merge and confirm both **Vercel** production deployments.
- **Do not create Netlify previews**; leave the existing Netlify release untouched.

## Owner handoff required
Verified WhatsApp/phone numbers, official social profile URLs, brand film, photos of actual garments, legal policy wording, and genuine reviews or permission to quote them. Public customer reviews also need ongoing Studio moderation. Owner-provided materials are required before any illustrative visuals can be presented as photographed stock.

## Acceptance checklist
- [ ] Latest PR quality CI passes
- [ ] New review and asset-guard migrations verified in Supabase
- [ ] Public review submission visible as pending, not publicly readable until approved
- [ ] Product share and category share open valid WhatsApp URLs
- [ ] 280px–2560px layout matrix and live Vercel smoke checks pass
- [ ] Both Vercel projects ready on the same main SHA
- [ ] Client-approved content uploaded and published by authorized CMS staff
