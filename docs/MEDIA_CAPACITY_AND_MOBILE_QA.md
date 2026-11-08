# Nomaan Brothers — Studio organization & media capacity

## Studio workspaces

The Studio is organized into six navigation destinations:

1. **Dashboard:** Read-only counts for published garments, saved drafts and media (images/videos tracked separately).
2. **Products:** Add garments with SKU, photos, video, descriptions and pricing. Save private drafts before publishing.
3. **Collections:** Edit garments' collection labels, banners, visibility and order.
4. **Media library:** Search/approve/archive/delete with independent image/video filtering and server-side pagination (30 records/page).
5. **Bulk imports:** Import product CSV drafts, batch-upload SKU-named photographs and reconcile image links (up to 250 images per batch).
6. **Website CMS:** Update homepage, category assets, banners, hero, contact information and page content.

Authentication still requires authorized Supabase Auth users and `app_metadata.nb_role`. The staff-facing login no longer exposes developer diagnostics or SQL instructions. Private access control is unchanged.

## Scale target: 10,000 images and 500 videos

The library does **not** download or render 10,500 media records at once. Metadata queries are paginated, media-search indexes already exist, and the asset chooser requests records only when opened. The main Studio no longer loads its former 300-row media cache on section changes.

Images/videos are stored in Supabase Storage objects, with `nb_media` rows containing metadata. Existing `nb-media-staging`, `nb-media-public` and legacy `nb-media` buckets have **50 MiB per-file limits**. Larger uploads use 6 MiB TUS chunks and private staging, pending authorized approval. Current image importer uses batches of up to 250, and standard media selection is capped at 100 files to avoid accidental enormous uploads.

This is *application-side preparedness*, not measured capacity at the target scale.

### Illustrative capacity planning

| Asset class | Count | Typical example size | Total |
| --- | ---: | ---: | ---: |
| Photos | 10,000 | 2 MiB | ~19.5 GiB |
| Videos | 500 | 40 MiB | ~19.5 GiB |
| Combined | 10,500 | | ~39.1 GiB |

The connected Supabase organization is on **Free**, with 1 GB included storage. It cannot hold this example workload. Pro currently includes 100 GB of Storage (overages and egress may incur costs). An owner-approved plan/quotas review is necessary before production ingestion. Video encoding, playback delivery and per-file size limits also need evaluation. No automatic subscription upgrade is included in this code change.

### Required staging acceptance before calling it production-scale

- Test 320, 375, 390, 768, 1024 and 1440 pixel viewport widths using live Chrome, Android Chrome, and iOS Safari. Check nav, picker, forms and video controls.
- Use an isolated staging database with 10,000 synthetic *metadata* rows and 500 video entries, then measure median and p95 list/search latency, role-based counts, concurrent editors and page transition delays. Do not insert this data in the client production database.
- Test actual Storage uploads with approved sample files only. Capture retry, interruption, quota, MIME validation, and orphan-recovery outcomes; verify private objects never become public without approval.
- Run security and performance advisors and review access-control behavior, deletion protections and backups.
- Test video bandwidth, caching, seek/range playback, mobile decoding and transcoding requirements.
- Document storage/quota spend cap assumptions with the client before a go-live or upgrade.

References:
- https://supabase.com/docs/guides/storage/uploads/file-limits
- https://supabase.com/docs/guides/storage/uploads/resumable-uploads
- https://supabase.com/docs/guides/storage/pricing
