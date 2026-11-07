# Nomaan Brothers — Staff CMS User Guide (Catalogue-First)

**Who uses this:** store owner, managers and approved editors. The website is a catalogue and WhatsApp/showroom enquiry site; it is not a POS, inventory system, order processor or payment gateway.

## Access

1. Open the client-approved domain and add `/studio`.
2. Sign in with the staff email and password provisioned by the owner via Supabase Auth.
3. Roles: **editor** prepares product/homepage drafts and uploads pending media; **admin/owner** reviews media and publishes approved content. The owner creates or revokes staff access.
4. If access is denied, ask the owner to verify the staff role; never share passwords or use the old demo PIN.

## Add a product (few products at a time)

1. Open **Products > New product**.
2. Enter unique SKU (e.g. `NB-SHW-001`), garment name, URL slug, department, relevant category, sizes, fabric, description and optional price. Sizes describe offerings; no stock counts are tracked.
3. Upload original, authorized garment images in the **Media library**. Pending photographs are private and cannot appear on the public catalogue. The owner/admin reviews and approves them.
4. Reopen the product, search the **approved images** by filename/SKU, choose cover and gallery order (first image is cover), and optionally add an approved video.
5. Click **Save private draft**. Verify the public site remains unchanged.
6. Owner/admin reviews draft details and photographs, then clicks **Publish approved version**. Verify it appears in the correct collection and the customer sees only approved content.

## Bulk catalogue CSV

- Go to **Bulk imports** and choose a CSV up to 8 MB with at most 10,000 rows. Start with the file `templates/products.csv`.
- Required columns: `sku,title,department,category`; optional: `sizes,fabric,description,price`.
- Department must be `men` or `kids`; category must be a valid full category path such as `/men/sherwani`. Sizes are separated by `|` (e.g. `38|40|42`).
- Review the **valid/invalid** count before import. Existing SKUs are skipped, not overwritten. Rows are stored as private drafts; there is **no automatic mass publication**.
- If interrupted, run the same file again. The import fingerprint resumes previously recorded rows. Avoid running the same import concurrently from two staff sessions.
- Download the failed-row CSV when needed, correct the original file and reimport with care (a revised file has a new fingerprint).

## Bulk photographs and SKU matching

1. Rename photographs by SKU and intended gallery order: `NB-SHW-001_01.jpg`, `NB-SHW-001_02.jpg`, etc.
2. Select at most **250 images per batch** in Bulk imports. Accepted images: JPEG, PNG, WebP, AVIF, GIF. 50 MB maximum per file; use smaller optimized files for real customer performance.
3. Files upload to private staging first. Owner/admin reviews and approves in Media library.
4. Open **Bulk imports > Match approved images by SKU** to attach approved photos to product drafts that currently have **empty galleries**. Manual galleries are preserved. Matching processes bounded batches and may require another click to finish.
5. Open a sample of the matched products, verify cover order, sizes and captions, and publish individually through the authorized workflow.

## Homepage and collections

- **Homepage** edits are drafts until owner/admin explicitly publishes a new version.
- **Collections** controls approved category descriptions and banners. Do not rename/change category routes without coordinating website routing.
- Verify all contact numbers, displayed claims, brand wording and gallery rights with the owner.
- Category/public edits can become visible immediately where stated; check before saving.

## Safeguards and support

- Never upload private client documents, customer data, passwords or copyrighted images without permission.
- If a file fails after the Storage upload but before metadata insertion, **do not repeatedly upload blindly**; record the filename/job and ask AGM to reconcile orphan storage objects.
- If an approved image is revoked, verify no published product depends on it; asset removal and CDN caches may require coordinated cleanup.
- Verify product display on a phone after publishing. If an unauthorized person gets access, the owner revokes their Supabase Auth session/role and requests review of any suspicious recent changes.
- Keep product SKUs stable. The future ERP/POS can use these same SKU references without the catalogue claiming live stock.
