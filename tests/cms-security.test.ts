import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
const sql = readFileSync(new URL('../supabase/migrations/20261107060000_nomaan_cms.sql', import.meta.url),'utf8');
describe('CMS migration guardrails (static checks; deploy requires live RLS verification)', () => {
  test('has RLS on every public CMS table', () => {
    for (const table of ['nb_products','nb_categories','nb_media','nb_product_drafts','nb_product_revisions','nb_home_drafts','nb_home_public','nb_home_revisions']) {
      expect(sql).toContain('alter table public.'+table+' enable row level security');
    }
  });
  test('does not allow anonymous writes', () => {
    expect(sql).not.toMatch(/for (insert|update|delete)\s+to anon/i);
    expect(sql).not.toMatch(/allow read, write: if true/i);
    expect(sql).not.toMatch(/security definer/i);
  });
  test('requires server-controlled role for writes and draft-before-publish', () => {
    expect(sql).toContain("auth.jwt()) -> 'app_metadata'");
    expect(sql).toContain('nb_product_drafts_editor_insert');
    expect(sql).toContain('nb_products_publisher_update');
    expect(sql).toContain("public.nb_can_publish()");
    expect(sql).toContain('returns integer language plpgsql security invoker');
    expect(sql).toContain('public.nb_publish_product');
  });
  test('requires controlled publishing transactions for revision history', () => {
    expect(sql).toContain('create trigger nb_product_revision_guard before insert');
    expect(sql).toContain("public.nb_require_publish_scope('product')");
    expect(sql).toContain('create trigger nb_home_revision_guard before insert');
    expect(sql).toContain("public.nb_require_publish_scope('home')");
    expect(sql).not.toMatch(/grant delete on public\.nb_products/i);
    expect(sql).not.toMatch(/grant delete on public\.nb_media/i);
  });
  test('scopes storage uploads to authenticated user and dedicated bucket', () => {
    expect(sql).toContain("bucket_id = 'nb-media'");
    expect(sql).toContain("(storage.foldername(name))[1] = (select auth.uid())::text");
  });
});
