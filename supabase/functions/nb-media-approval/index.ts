/**
 * Privileged media promotion. Client sends its session JWT via functions.invoke().
 * The secret key is supplied by the Supabase runtime, never to browser code.
 * Approval is verified against *fresh* Auth app_metadata on every request.
 *
 * Deploy only after reviewing the Phase 2 migration and Edge Function tests.
 */
import { withSupabase } from 'npm:@supabase/server@1'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}
const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: cors })

const handler = withSupabase({ auth: 'user' }, async (req, ctx) => {
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' })

  let request: { id?: unknown; action?: unknown };
  try { request = await req.json() }
  catch { return json(400, { error: 'Expected JSON body' }) }
  const id = request.id;
  const action = request.action;
  if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id) ||
      (action !== 'approve' && action !== 'revoke' && action !== 'delete')) {
    return json(400, { error: 'Invalid asset or action' })
  }

  const actorId = ctx.jwtClaims?.sub;
  if (typeof actorId !== 'string' || !actorId) return json(401, { error: 'Sign in again' })

  // JWT role claims may be stale after revocation. Always verify current role
  // with the Auth admin endpoint before any RLS-bypassing storage operation.
  const { data: identity, error: identityError } =
    await ctx.supabaseAdmin.auth.admin.getUserById(actorId)
  const role = identity?.user?.app_metadata?.nb_role;
  if (identityError || !identity?.user ||
      (role !== 'owner' && role !== 'admin')) {
    return json(403, { error: 'Owner/admin permission required' })
  }

  const { data: asset, error: assetError } = await ctx.supabaseAdmin
    .from('nb_media').select('id,storage_path,approved').eq('id', id).maybeSingle()
  if (assetError) return json(500, { error: 'Could not inspect the media record' })
  if (!asset) return json(404, { error: 'Media not found' })

  const path = asset.storage_path as string;
  if (!/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|png|webp|avif|gif|mp4|webm)$/i.test(path)) {
    return json(409, { error: 'Media path requires manual review' })
  }

  // Deletion is restricted to unapproved media after checking fresh Auth role
  // and any attached product-gallery associations. Approved media must first
  // pass the existing revocation checks, never a direct browser DELETE.
  if (action === 'delete') {
    if (asset.approved) return json(409, { error: 'Revoke approval before deletion' })
    const refs = await ctx.supabaseAdmin.from('nb_product_media')
      .select('media_id', { count: 'exact', head: true }).eq('media_id', id)
    if (refs.error) return json(503, { error: 'Could not verify references; removal denied' })
    if ((refs.count ?? 0) > 0) return json(409, { error: 'Remove product-gallery references first' })
    const { error: recordError } = await ctx.supabaseAdmin.from('nb_media').delete().eq('id', id)
    if (recordError) return json(500, { error: 'Could not delete media record' })
    const { error: fileError } = await ctx.supabaseAdmin.storage.from('nb-media-staging').remove([path])
    if (fileError) return json(502, { error: 'Metadata removed; staged-file cleanup needs reconciliation' })
    return json(200, { ok: true, deleted: true })
  }

  const publicBucket = ctx.supabaseAdmin.storage.from('nb-media-public');
  if (action === 'approve') {
    // An earlier retry may have copied the object before the DB update failed.
    const { data: existing } = await publicBucket.info(path)
    if (!existing) {
      const { error: copyError } = await ctx.supabaseAdmin.storage
        .from('nb-media-staging').copy(path, path, { destinationBucket: 'nb-media-public' })
      if (copyError) return json(502, { error: 'Media copy failed; approval not recorded' })
    }
    const { error: updateError } = await ctx.supabaseAdmin.from('nb_media')
      .update({ approved: true }).eq('id', id)
    if (updateError) return json(500, { error: 'Object copied but metadata update failed; retry approval' })
    return json(200, { ok: true, approved: true })
  }

  // A published product or homepage must never be left with a broken gallery.
  // Associations are rebuilt transactionally when a product is published.
  const publicUrl = publicBucket.getPublicUrl(path).data.publicUrl
  const [products, homes, collections, legacyImages, legacyVideo] = await Promise.all([
    ctx.supabaseAdmin.from('nb_product_media')
      .select('product_id', { count: 'exact', head: true }).eq('media_id', id),
    ctx.supabaseAdmin.from('nb_home_public').select('content').eq('key', 'home').maybeSingle(),
    ctx.supabaseAdmin.from('nb_categories')
      .select('path', { count: 'exact', head: true }).eq('image_url', publicUrl),
    ctx.supabaseAdmin.from('nb_products')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published').contains('image_urls', [publicUrl]),
    ctx.supabaseAdmin.from('nb_products')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published').eq('video_url', publicUrl),
  ])
  if (products.error || homes.error || collections.error ||
      legacyImages.error || legacyVideo.error) {
    return json(503, { error: 'Cannot verify media references; revocation denied' })
  }
  const homeContent = homes.data?.content as Record<string, unknown> | undefined
  const referencedByHome = homeContent &&
    ['heroImage', 'menImage', 'kidsImage', 'storyImage']
      .some(key => homeContent[key] === publicUrl)
  if ((products.count ?? 0) > 0 || (collections.count ?? 0) > 0 ||
      (legacyImages.count ?? 0) > 0 || (legacyVideo.count ?? 0) > 0 ||
      referencedByHome) {
    return json(409, { error: 'Remove this image from published products, homepage and collections before revoking approval' })
  }

  // No currently published content depends on this image. Unpublish metadata
  // first, then remove the public Storage copy; failures require reconciliation.
  const { error: updateError } = await ctx.supabaseAdmin.from('nb_media')
    .update({ approved: false }).eq('id', id)
  if (updateError) return json(500, { error: 'Could not revoke media approval' })
  const { error: deleteError } = await publicBucket.remove([path])
  if (deleteError) return json(502, { error: 'Approval revoked, public copy removal needs reconciliation' })
  return json(200, { ok: true, approved: false })
})

export default {
  fetch(req: Request) {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
    return handler(req)
  },
}
