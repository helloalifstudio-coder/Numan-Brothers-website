# Nomaan Brothers — V2 Storefront & CMS

A luxury ethnic menswear and kidswear browse-and-enquire catalogue for Nomaan Brothers, Warangal. Maintained by Alif Growth Media.

## Current release status
This source branch is a **production-hardening candidate, not a live production launch**. It has not been connected to a client-owned Supabase project; the actual security policies, data and media must be verified on that project before merging or switching traffic.

The separate connected Supabase project named **gym** belongs to another application. It has deliberately **not** been modified or reused.

## Implemented modules
- Responsive storefront with Men's Wear and Kids Wear hierarchy, shareable product/category URLs and accessible navigation.
- Motion-driven editorial homepage with reduced-motion alternatives.
- Authenticated /studio with CMS product drafts, publishing, image/video uploads, media approval, page management and owner/editor role boundaries.
- Supabase PostgreSQL tables, restricted RLS and Storage policies, atomic homepage/product publication and revision history.
- Published-content-only storefront reads. No demo catalogue, legacy PIN login, public write APIs, fake discounts or fake rewards.
- CI: frozen Bun install, TypeScript, Bun unit tests, PostgreSQL role/RLS simulation and Vite build.

## Development

Install Bun 1.4.0 and run:

    bun install --frozen-lockfile
    bun run dev

Checks:

    bun run lint
    bun test
    bun run build

## Environment
Create .env locally using .env.example. For Vercel use the two **frontend public values** of the dedicated Nomaan Supabase project:

    VITE_SUPABASE_URL=https://NEW_PROJECT_REF.supabase.co
    VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_NEW_PROJECT_KEY

Never use a secret key or database password as a VITE_ variable. Do not use another client's project.

## Database and CMS
- Schema: supabase/migrations/20261107060000_nomaan_cms.sql
- Studio: /studio (manual staff provisioning via Supabase Auth)
- Product drafts/versions: nb_product_drafts, nb_product_revisions, nb_products
- Homepage drafts/versions: nb_home_drafts, nb_home_revisions, nb_home_public
- Media: nb_media plus the nb-media Storage bucket
- Categories: nb_categories (seeded with user-requested category names, not inventory).

Full setup and go/no-go instructions:
- docs/CMS_DEPLOYMENT.md
- docs/CMS_RELEASE_GATE.md

## Boundaries and known pending work
The website is *browse and enquire*, not an online payment system. Future ERP/POS is the authoritative stock, prices and tax source. Production SEO requires real indexing tests and an SSR/prerender decision for dynamically generated product routes. Real photography, contact numbers and the meanings of "Sadi" and Sherwani "Plain Suits" need owner confirmation.

The legacy Firebase rules in the repository are deny-all, **but that file is not deployed to Firebase**. Back up and secure the old live Firebase project in a controlled migration.

This CMS uses built-in React components and Supabase rather than integrating external Refine/Puck packages yet. The prior research identified them as candidate enhancements, not current dependencies.
