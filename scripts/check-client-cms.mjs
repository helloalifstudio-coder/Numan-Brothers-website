#!/usr/bin/env node
/**
 * Read-only commissioning probe for a NEW client-owned Supabase project.
 * It uses only the public publishable key: NEVER use a service-role key here.
 * It cannot certify Auth roles, Storage policies, private media or backups.
 *
 * EXPECTED_SUPABASE_PROJECT_REF=client-ref \
 * VITE_SUPABASE_URL=https://client-ref.supabase.co \
 * VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_... \
 * node scripts/check-client-cms.mjs
 */
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function validatePublicConfig(env) {
  const rawUrl = (env.VITE_SUPABASE_URL || '').trim().replace(/\/$/, '');
  const key = (env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim();
  const expectedRef = (env.EXPECTED_SUPABASE_PROJECT_REF || '').trim();
  if (!/^[a-z0-9-]{10,40}$/.test(expectedRef)) {
    throw new Error('Set EXPECTED_SUPABASE_PROJECT_REF to the new client project ref.');
  }
  let url;
  try { url = new URL(rawUrl); }
  catch { throw new Error('VITE_SUPABASE_URL must be the client project HTTPS origin.'); }
  if (url.protocol !== 'https:' ||
      url.origin !== rawUrl ||
      url.hostname !== expectedRef + '.supabase.co') {
    throw new Error('Supabase URL does not match the expected client project ref.');
  }
  if (!/^sb_publishable_[A-Za-z0-9_-]{12,}$/.test(key)) {
    throw new Error('Use a Supabase publishable key, never a secret/service-role or legacy JWT key.');
  }
  return { url: url.origin, key, projectRef: expectedRef };
}

export function checksFor(projectUrl) {
  const base = projectUrl + '/rest/v1/';
  return [
    { name: 'Public categories', url: base + 'nb_categories?select=path&limit=1', kind: 'public' },
    { name: 'Public products', url: base + 'nb_products?select=id,status&limit=5', kind: 'products' },
    { name: 'Hidden unpublished products', url: base + 'nb_products?select=id&status=neq.published&limit=1', kind: 'empty' },
    { name: 'Published homepage', url: base + 'nb_home_public?select=key&limit=1', kind: 'public' },
    { name: 'Private product drafts', url: base + 'nb_product_drafts?select=product_id&limit=1', kind: 'denied' },
    { name: 'Private media metadata', url: base + 'nb_media?select=id&limit=1', kind: 'denied' },
    { name: 'Private revision history', url: base + 'nb_product_revisions?select=id&limit=1', kind: 'denied' },
  ];
}

export async function probeAnonymousApi(config, fetcher = fetch) {
  const results = [];
  for (const check of checksFor(config.url)) {
    let response;
    try {
      response = await fetcher(check.url, {
        headers: { apikey: config.key, Accept: 'application/json' },
        signal: AbortSignal.timeout(12000),
        redirect: 'error',
      });
    } catch {
      results.push({ name: check.name, ok: false, detail: 'Network/TLS/timeout failure' });
      continue;
    }
    if (check.kind === 'denied') {
      results.push({
        name: check.name,
        ok: response.status === 401 || response.status === 403,
        detail: 'HTTP ' + response.status + ' (expected 401/403)',
      });
      continue;
    }
    if (response.status !== 200) {
      results.push({ name: check.name, ok: false, detail: 'HTTP ' + response.status + ' (expected 200)' });
      continue;
    }
    let data;
    try { data = await response.json(); } catch { data = null; }
    const valid = Array.isArray(data) &&
      (check.kind !== 'empty' || data.length === 0) &&
      (check.kind !== 'products' || data.every(item => item.status === 'published'));
    results.push({
      name: check.name, ok: valid,
      detail: valid ? 'Schema and anonymous read policy look correct' : 'Unexpected anonymous content or response',
    });
  }
  return results;
}

async function main() {
  let config;
  try { config = validatePublicConfig(process.env); }
  catch (error) { console.error('CONFIGURATION FAIL:', error.message); process.exitCode = 1; return; }
  console.log('Checking anonymous API for client project:', config.projectRef);
  const results = await probeAnonymousApi(config);
  for (const result of results) {
    console.log((result.ok ? 'PASS' : 'FAIL') + ' ' + result.name + ': ' + result.detail);
  }
  if (results.some(result => !result.ok)) {
    console.error('Commissioning blocked: review schema exposure, grants and RLS.');
    process.exitCode = 1;
  } else {
    console.log('Read-only anonymous API checks passed.');
    console.log('NOT production approval: verify Auth roles, Storage, private assets, restore and live publishing separately.');
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  void main();
}
