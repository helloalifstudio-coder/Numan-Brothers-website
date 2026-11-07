# Noman Brothers Studio — Practical user guide and CMS implementation

This document distinguishes delivered functionality from advanced editing still requiring work. Authoritative code lives on GitHub `main` and both Vercel projects deploy the same commit.

## Studio navigation
1. **Dashboard** — published garment, private draft and media counts; six guided steps to manage the showroom.
2. **Products** — create, edit or discard garment drafts; attach approved imagery; publish a revision; archive published garments without permanently destroying the historical record.
3. **Collections** — edit live collection name, short copy, sort rank and approved artwork. Existing route slugs remain locked. Hide/restore optional collections instead of destructively deleting URLs.
4. **Bulk imports** — CSV import and resumable photo/video batch intake, error report and approved SKU-based matching.
5. **Media** — upload, rename display file, edit alt text, preview privately, approve/revoke, or permanently delete unapproved media with a server-verified admin permission. Approved media must be revoked after dependency checks before deletion.
6. **Website CMS** — page tabs: Homepage, Navbar & Announcement, Collections, Product, Search, Contact, Footer and SEO. Each has allowlisted text/card fields; the homepage has live drag-and-drop ordering and Show/Hide controls. Save draft and Publish are deliberately separate.

## Add your first garment
1. Go to **Collections** and verify the correct Men's Wear or Kids Wear destination is active.
2. Go to **Media** and upload one real, client-approved JPG/WebP garment photograph. Give it an appropriate alt description. Admin/owner chooses **Approve**.
3. Go to **Products** → **New product** and enter a unique SKU, lowercase hyphenated URL slug, product name, department, collection(s), sizes, fabric and garment description.
4. Under **Product photographs**, select the approved uploaded image, choose gallery order (cover first); optionally select an approved video.
5. Click **Save private draft** to persist without changing the website.
6. Admin/owner selects **Publish approved version**. The SQL publishing RPC validates approved media before publication.
7. Open the public website and verify the matching collection, photograph, copy and product URL.
8. To change the product, open **Edit garment**, change the fields and publish a new version. **Archive garment** removes it from public pages but retains audit/history; **Discard private draft** removes only unpublished edits.

## Bulk product import
1. Go to **Bulk imports** and download/open `templates/products.csv`.
2. Provide `sku,title,department,category` for each garment; optionally provide sizes (pipe-separated), fabric, description and price. Use one genuine SKU per row.
3. Upload CSV and resolve validation errors from the preview. Batch limit is shown in the UI; existing SKUs are skipped, not silently overwritten.
4. Click **Import validated drafts**. Nothing is published automatically.
5. Name photos `SKU_01.jpg`, `SKU_02.jpg`, etc. Upload in batches (UI limit 250); each stays private until approved.
6. Approve the images in **Media**. Return to **Bulk imports** and run **Match approved images** to link them by SKU.
7. Check each garment's correct photo order and category in **Products** and publish explicitly.

## Website CMS
- All website text slots are **plain text**, never arbitrary HTML or scripts. Destinations for navigation buttons remain controlled routes.
- The Homepage tab retains existing hero/story text/image fields and WhatsApp contact field plus 7 named layout sections and 3 featured product cards.
- Drag a section/card or use the up/down buttons to change the live rendering order. Hide optional homepage sections without destroying their settings.
- Page tabs organize 99 text fields for the navbar, footer, homepage, shared collection/product templates, search, contact and browser metadata.
- **Save draft** only changes the authenticated `nb_home_drafts` row. **Publish website changes** uses `nb_publish_home` and creates an immutable numbered `nb_home_revisions` snapshot. The published JSON is visible to public readers.
- Use **Collections** for individual category-specific labels/descriptions and banner art. Use **Products** for garment title, description, photography and gallery.

## Access control and deletion
- `editor`: drafts, uploads, own pending-file metadata. `admin`/`owner`: publish and approve/revoke.
- Permanent deletion of **unapproved** media is available only through the `nb-media-approval` JWT-verified Edge Function after checking live Auth app_metadata and existing gallery associations.
- Approved/published images cannot be deleted directly; revoke approval only after removing public product, homepage and collection references.
- Products use archive/restore-by-republishing, not permanent deletion, to preserve references and publication history.
- Collection URL paths are fixed to protect existing inbound links. Hide/restore is the supported removal operation.

## Remaining advanced work / limits
- Arbitrary drag-and-drop **new layout blocks** across all routes and restructuring navbar/footer columns are not yet implemented. Homepage sections and featured cards are reorderable; other page templates use curated layout structures.
- The editable text slots cover major visible copy and shared page templates; a complete line-by-line audit of every decorative microcopy/alt label, SEO server-side prerender and structured data remains to be done.
- Published history is visible; one-click visual rollback, cross-page preview/diff and collaborative editing locks are future phases.
- Real authenticated browser acceptance for upload → approve → publish → archive and mobile accessibility remains required before production signoff.
- The client project was originally installed with the SQL Editor bundle and its nine earlier migrations are **not recorded** in CLI history. The new archive/discard migration was applied using Supabase migrations. Reconcile history before any future `supabase db push` to avoid rerunning existing schema.
