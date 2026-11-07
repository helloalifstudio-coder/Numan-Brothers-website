# Nomaan Brothers — approved V2 navigation/homepage implementation

**Branch:** agm/nomaan-v2-navigation-homepage  
**Review basis:** Approved 7 November 2026. This is a separate branch; do not merge before visual review, owner signoff, security validation, and catalogue confirmation.

## Implemented
- Men's Wear and Kids Wear department hierarchy from a single config (src/storefront/navigation.ts).
- Desktop click-to-open accessible mega menu and compact mobile departmental drawer.
- Distinct shareable collection routes and working browser Back/Forward via lightweight history adapter. Vercel's existing SPA rewrite supports deep links.
- New editorial homepage: immersive hero, department discovery, curated collections, heritage storytelling, showroom contact.
- New product presentation, no rating/reward claims, and browse-and-enquire rather than unsupported online checkout.
- Removed from active public application: Nomaan Rewards GIF, VIP Circle/newsletter, old PLP filters/sidebar, old MegaMenu, rotating announcements, checkout and insecure PIN-admin UI.
- Read-only Firestore product subscription only. **No auto-seeding or browser writes from the public app.**
- Conservative mapping of existing legacy product categories to requested new routes. Explicit \`collectionPaths\` / \`collectionPath\` fields supported for later CMS/ERP mapping.
- No invented kidswear records: empty collection routes show the honest curated-state message.
- Motion uses scroll-linked parallax and viewport reveals with reduced-motion preference; normal browser scrolling remains enabled.
- Product prices, reviews, discounts and reward claims are not shown pending merchant verification.

## All approved categories
**Men:** Kurta Pyjama, Pathani, Sherwani (Handwork Sherwani; Plain Suits), Suits (Handwork Suits; Plain Suits), Jodhpuri, Marriage Collection (Jutti, Pagdi, Sadi), Tope.  
**Kids:** Kurta Pyjama, Sherwani, Pathani, Sadi, Suits, Jodhpuri, Tope.

**Naming clarification still pending:** "Plain Suits" under Sherwani and "Sadi". Do not silently rename. "Kurta Pyjama" is deduplicated within Kids Wear.

## Architecture and handover
- \`src/storefront/navigation.ts\` owns taxonomy/paths.
- \`src/storefront/catalog.ts\` provides explicit and legacy product mapping, public-product filtering, and stable product paths.
- \`src/storefront/history.ts\` provides a no-new-dependency SPA routing adapter with back/forward.
- \`src/components/V2Header.tsx\` provides desktop + mobile navigation, search and Escape handling.
- \`src/components/V2Home.tsx\` provides the complete new homepage.
- \`src/components/V2Collection.tsx\` and \`src/components/V2Product.tsx\` provide reusable category and product pages.
- \`src/App.tsx\` is now the public browse-only entry point; old admin/cart/rewards modules remain in git history and/or unused legacy modules for later audited migration. Do not reenable them unchanged.

## Release blockers (IMPORTANT)
1. Existing committed Firestore security rules permit public writes to business/customer data if deployed. Current deployed rules must be checked and corrected by creating proper authentication, role-scoped permissions and negative tests. This branch does NOT fix production Firestore security.
2. The old hard-coded admin PIN mechanism is not secure. It is not mounted in V2, but client editing requires a new authenticated admin/CMS before handover.
3. The sample product records and external imagery must be replaced/approved by the store owner. The generated images/legacy photos are only visual references, not proof of ownership or live stock.
4. The contact/WhatsApp number is inherited from the previous site and requires the owner's approval.
5. Confirm exact trade spelling and clarify "Sadi" and the Sherwani "Plain Suits" label.
6. Complete Lighthouse/Core Web Vitals on real devices, keyboard screen-reader testing, responsive image optimization, photo rights review and catalogue route validation.
7. Route-specific SEO in this Vite SPA requires verified prerender/SSR or static export for indexable public category and product pages.
8. Real inventory, website product approval and billing integration belong to later ERP/POS phase and must not be inferred from this UI update.

## Quality gates
\`bun install --frozen-lockfile\` then \`bun run lint\`, \`bun test tests/navigation.test.ts\` and \`bun run build\`. Visual and smoke QA in the branch Vercel preview before any merge.
