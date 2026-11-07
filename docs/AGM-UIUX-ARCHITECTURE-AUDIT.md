# Nomaan Brothers - UI/UX & architecture audit
**Audit date:** 7 November 2026  
**Base reviewed:** `main` at `0691a7f63c6fb684dacaff6d70cb48dcfad0636b`  
**Scope:** Repository/architecture review and conservative UI improvements. No production security validation or live Lighthouse run was possible.

## Executive priority
1. **CRITICAL**: `firestore.rules` currently says `allow read, write: if true` on products, users, global orders, returns and settings. It is a repository finding; inspect deployed rules immediately. No client data should be loaded before authorization is repaired.
2. **CRITICAL**: `src/components/AdminPortal.tsx` includes a fixed client-side PIN and uses `localStorage` to mark authenticated. Replace this with Firebase Authentication / server-side policies, or a client-owned backend with real role-based access.
3. **HIGH**: `src/lib/firestoreService.ts` allows direct browser writes to product, order and return collections and seeds static products during site boot. Separate public reads, authenticated mutations and one-time migrations.
4. **HIGH**: `src/data.ts`, `ProductCard.tsx`, `PDP.tsx` and `PLP.tsx` contain sample reviews, ratings and ranking rules. Only surface real customer reviews with proof and consent. Review every sales/discount/delivery claim.
5. **HIGH**: `CartDrawer.tsx`, `ReturnsPortal.tsx` and `App.tsx` calculate order, coupon, rewards and credits in the browser. Financially authoritative operations must run on a controlled server with validation and transaction logs.
6. **HIGH**: `src/App.tsx` (~57KB), `src/components/AdminPortal.tsx` (~74KB), `CartDrawer.tsx` (~34KB) and `ReturnsPortal.tsx` (~52KB) combine too many responsibilities. Extract routes/features, validation schemas, reusable components and service boundaries.
7. **HIGH**: Site currently generates a random browser-side guest identifier, not a real authenticated user identity. Do not treat it as access control.
8. **MEDIUM**: Current Vite SPA has a single `index.html` and dynamic title rendering with React Helmet. For product-specific indexable URLs, implement route-based canonical tags, prerender/SSR strategy, sitemap and individual product URLs.
9. **MEDIUM**: The original above-the-fold hero used `loading="lazy"` and large remote images. The new hero requests the image eagerly; still validate source image dimensions, ownership, AVIF/WebP delivery, and fallback for unavailable remote assets.
10. **MEDIUM**: No dedicated tracked unit/e2e tests or CI workflow was found in the repository tree. `npm run lint` runs only TypeScript `tsc --noEmit`; add ESLint, Vitest, Testing Library, Playwright, dependency audit and CI gates.
11. **MEDIUM**: Header announcements auto-rotate every four seconds and some navigation actions are non-semantic. Prefer a stable promise, keyboard-focusable branding, Escape-to-close search and reduced-motion support.
12. **MEDIUM**: There is no authoritative size/colour stock ledger or merchant-governed publication status. The upcoming ERP/POS must own inventory; web catalogue displays only published SKUs.

## Recommended design system
- **Identity:** Modern Heritage Luxury, editorial rather than generic discount-heavy marketplace.
- **Palette:** warm ivory #fcfbfa; midnight ink #1c1917; antique brass #967143; champagne #ead9b7.
- **Type:** editorial serif headings (existing Playfair Display); Inter utility copy; strong hierarchy, careful line length.
- **Motion:** reveal content 300-450ms; hero entrance ~650ms; gentle scroll parallax at most 45px; transform/opacity only, no scroll hijacking; always respect `prefers-reduced-motion`.
- **Navigation:** stable message, keyboard-accessible home and search; clearly visible separate collections for groom sherwanis, festive kurtas, jubbas and kidswear (subject to the owner's actual catalogue).
- **Product page:** full-bleed but efficient photos; visible size choices and availability; clearly stated fabric, embroidery, tailoring and consultation information; mobile sticky primary CTA only if useful.
- **Trust:** real showroom address and approved phone, actual photos, accurate delivery/returns policy, no invented reviews or promotions.

## Progressive implementation
**Phase A / visual proof:** Editorial hero component, reduced-motion safeguards, keyboard card navigation, stable header and collection anchor (included on this branch).  
**Phase B / content:** Owner-approved images, authentic brand story, kidswear category, genuine prices, independent product URLs, responsive imagery and WhatsApp first enquiry.  
**Phase C / production security:** New client-owned Firebase/Supabase/ERP infrastructure; auth, roles, security rules, tenant scoping, server-validated mutations, sample-data removal; verified backups and restore drills.  
**Phase D / integration:** ERPNext (or approved ERP) authoritative products, variants, barcodes, stock, prices; explicit web publication; rate-limited read-only public API.  
**Phase E / quality gates:** mobile Lighthouse + Web Vitals, real-browser keyboard/screen reader, E2E catalogue/search/enquiry, security emulator tests, accessibility WCAG 2.2 AA, rollbacks and analytics.

## Architecture
```
apps/storefront (Vite + React, public catalogue and enquiry)
        |
        v
backend-for-frontend (public published catalogue; no admin secrets in browser)
        |
        +-- CMS (editorial pages and approved media)
        +-- ERP integration adapter (read-only public SKU projections)
                         |
                         v
                 ERPNext / stock + POS
```
Do not introduce three independent product databases. The current app uses Firestore; introduce the ERP integration behind an adapter after the business workflows are agreed. Do not migrate transactional data casually.

## Acceptance checks for this visual branch
- Desktop/mobile hero layout without text overlap and with valid image URL.
- Keyboard focus reaches home, search and every product card.
- Search overlay closes with Escape.
- No timed rotating announcement; reduced-motion removes unnecessary movement.
- Product grid still filters and opens detail pages; hero actions route to appropriate categories.
- Source builds with `npm run lint && npm run build`. **Not run in this review environment**; must pass before merging.
- Vercel preview and production audit should confirm LCP <2.5s, INP <200ms, CLS <0.1 at p75, subject to measured field data.

## Sources
- Baymard product page research (updated 18 March 2026): https://baymard.com/research-articles/current-state-ecommerce-product-page-ux
- Baymard homepage/category UX (updated 13 October 2026): https://baymard.com/research-articles/ecommerce-navigation-best-practice
- Shopify 2026 ecommerce UX: https://www.shopify.com/in/blog/ux-design-trends
- Motion scroll patterns: https://motion.dev/docs/react-use-scroll
- W3C reduced motion: https://www.w3.org/WAI/WCAG22/Techniques/css/C39
- Google CWV: https://developers.google.com/search/docs/appearance/core-web-vitals
- Vercel Hobby commercial limitation: https://vercel.com/legal/terms
