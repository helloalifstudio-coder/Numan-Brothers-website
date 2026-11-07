# Nomaan Brothers — Studio owner handbook & implementation report

**Source of truth:** GitHub `main` · **Hosting:** Main website and CMS Showroom on Vercel · **Backend:** dedicated Noman Supabase project `zazdxmukmcayblsteulk`.

## Studio navigation
1. **Dashboard** — counts for published garments, drafts and media, with a six-step walkthrough below.
2. **Products** — guided department/category-first garment creation, automatic SKU, direct image/video upload, editing, publishing, draft discard and archive.
3. **Collections** — edit existing collection labels, descriptions, banners, display ranking, visibility and associated artwork. Route paths remain stable.
4. **Media & Bulk uploads** — one central place for photographs, videos, CSV imports, organized tags, batch uploads, private approval, archiving and permanent deletion.
5. **Website CMS** — page tabs, editable copy, homepage imagery and video, rearrangeable homepage sections and featured cards, revert/reset, publishing history and social links.

## Remove or replace the live hero photograph
1. Open **Studio → Website CMS → Homepage**.
2. Find **Hero background photograph**. The selected thumbnail offers a **trash icon** (remove *from this page*) and **Delete from Supabase** (remove the original file permanently). **Choose / replace** lets you select a different approved photograph. You may also drag a local photograph onto the dropzone.
3. Click the small **trash icon** to unlink the image from the draft. This does *not* delete its original file. Optionally drop/select another photograph.
4. Click **Save draft**, then **Publish website changes**. The public homepage will now show the replacement or its background styling.
5. **Only after publishing** (and removing it from any other saved drafts, products or collections), go to **Media & Bulk uploads** and use **Archive** or **Delete**. The in-place **Delete from Supabase** button also works at this point. It calls the JWT-verified server function, which deletes both the Storage object copies and the media database row.
6. If deletion says the asset is still used, do not force it: unlink it from all relevant drafts/pages, save and publish, then try again. Approved media cannot be erased while it remains referenced.
7. To restore wording/images from a previous draft without going live, use **Revert section to live** or **Restore original**. Save/Publish to apply a reset.

## Add a new garment — without visiting Media first
1. Go to **Products → New product**.
2. In **Step 1**, choose **Men’s Wear** or **Kids Wear**, then choose the **required garment category**. Category keys are fixed; public display names are editable in Collections.
3. The CMS uses `nb_next_sku` to reserve a category-coded SKU, e.g. **NB-KP-00001** for Kurta Pyjama, **NB-PA-00001** for Pathani and **NB-JP-00001** for Jodhpuri. The SKU can also be edited manually. Counter increments are reserved and are not guaranteed gapless.
4. Add the garment name (title) and confirm the automatically suggested **URL slug**—the readable address segment. Set fabric, size(s), display order and description.
5. Optional merchandising: **Original price**; **Offer price**, which must be less than original; and **Can be customized**, which displays tailoring availability in public product views.
6. Under **Step 2**, drag/drop photos directly from your laptop or use **Choose / replace** to search approved images in the garment’s category. The first image is the cover; reorder or remove thumbnail selections. Add optional MP4/WebM video the same way.
7. Admin/owner direct uploads go into private staging, then through the server approval workflow before being attached. Editors can upload pending assets but cannot approve or publish.
8. Choose **Save private draft**; when satisfied choose **Publish approved version**. SQL validates approved media and category membership. Check the storefront at the garment's collection and detail route.
9. Open the garment again to edit and republish. **Archive garment** hides it without destroying its history; **Discard private draft** deletes unpublished changes only.

## Media organization and batch uploads
- Before uploading, choose **General**, **Men’s**, or **Kids’**, then the garment category. Media stores department/category tags independently of the filename.
- Rename a media display name to something recognizable such as **Sherwani 1**, **Sherwani 2** or `NB-SH-00001_01.jpg`; add meaningful alt text. Tag/name/description metadata can be edited in the library.
- Search and filter by department, garment category, approval status, archived status and name. Pickers page the results rather than trying to render thousands of images.
- To import many products, open **Media & Bulk uploads → Bulk upload & product CSV imports**. CSV required fields: `sku,title,department,category`; optional `sizes,fabric,description,price`. Validate, upload drafts, import photos labeled by SKU, approve them and use SKU matching. Existing SKUs are not overwritten silently.
- Photos/videos are restricted to approved formats and a **50 MB per-file** limit. Product imports support bounded batches; refresh/search instead of relying on an unbounded all-assets list.
- **Archive** keeps Storage bytes + database metadata, removes the item from pickers and permits recovery. **Restore** makes it available again.
- **Delete** is permanent: server permission rechecked from current Supabase Auth `app_metadata.nb_role`. All *published* and *saved-draft* dependencies are checked before erasing the Storage and database record. If storage cleanup partially fails, the server returns a reconciliation error rather than claiming success.

## Website CMS and storefront
- **Page tabs:** Homepage, Navbar & Announcement, Collection pages, Product pages, Search, Contact, Footer and SEO.
- Text fields are plain text, not raw HTML. Menus keep validated route destinations.
- Homepage layout has **8 reorderable sections**, including Custom tailoring, plus 3 reorderable featured cards. Use drag handles or Up/Down buttons; optional sections may be hidden.
- Upload, swap or clear the hero, Men/Kids tile, story and tailoring images inside Website CMS. Every homepage section has a video picker. Section resets can return to last published or initial content.
- Contact settings accept a verified WhatsApp number and phone number, enabling direct **WhatsApp** and **Call** CTAs. The tailoring section describes fabric selection, sizing, and made-to-measure consultation; individual garments may opt into customization.
- Footer tab accepts HTTPS Instagram, Facebook and YouTube URLs; icons appear only where links are supplied. The agency footer attribution links to [Alif Growth Media](https://alif-growth-media.vercel.app/) and uses its favicon graphic.
- **Save draft** writes to `nb_home_drafts`. **Publish website changes** validates referenced approved media, updates `nb_home_public` and records a numbered revision.
- Published product listings are paginated; each garment has a detailed gallery, optional video, offer/original price, customizing flag and WhatsApp/call enquiry flow.

## Security, deployment and limitations
- Staff permissions: `editor` may draft/upload; `admin` and `owner` may approve, publish, archive and delete. The media Edge Function rechecks fresh Auth app metadata on every privileged call; client role badges alone do not authorize Storage mutation.
- A published homepage or saved unpublished draft that uses an image **must be updated before permanent removal**. Do not manually delete rows from Supabase Table Editor or objects from Storage as that can bypass the coordinated workflow.
- Original routes `/men/tope`, `/men/marriage/jutti`, `/men/marriage/sadi` etc. are preserved for backward compatibility even when user-facing display names are corrected to Tobh, Jooti and Sadiri.
- An advanced free-layout page builder (arbitrary new component types), fully visual revision diff/rollback, and browser automation of actual signed-in staff upload/publish flows are **not yet fully certified**. Automated CI and public API reachability are separate checks.
- The original Supabase schema was installed by SQL Editor; newer forward migrations are tracked. Reconcile schema migration history before applying new CLI migrations. Never rerun the fresh-project installer on this existing live database.
