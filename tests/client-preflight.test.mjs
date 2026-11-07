import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validatePublicConfig, checksFor, probeAnonymousApi } from '../scripts/check-client-cms.mjs';

const expectedRef = 'clientproject123';
const valid = {
  EXPECTED_SUPABASE_PROJECT_REF: expectedRef,
  VITE_SUPABASE_URL: 'https://' + expectedRef + '.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_' + 'x'.repeat(36),
};

describe('client project commissioning configuration', () => {
  it('accepts only a matched HTTPS Supabase project origin and publishable key', () => {
    const config = validatePublicConfig(valid);
    assert.equal(config.projectRef, expectedRef);
    assert.equal(config.url, valid.VITE_SUPABASE_URL);
  });
  it('rejects missing or mismatched project references', () => {
    assert.throws(() => validatePublicConfig({ ...valid, EXPECTED_SUPABASE_PROJECT_REF: '' }));
    assert.throws(() => validatePublicConfig({ ...valid, EXPECTED_SUPABASE_PROJECT_REF: 'anotherclient123' }));
  });
  it('rejects arbitrary domains, non-TLS URLs and appended URL paths', () => {
    for (const bad of [
      'http://' + expectedRef + '.supabase.co',
      'https://' + expectedRef + '.supabase.co.evil.example',
      'https://' + expectedRef + '.supabase.co/storage',
    ]) assert.throws(() => validatePublicConfig({ ...valid, VITE_SUPABASE_URL: bad }));
  });
  it('rejects secret and legacy JWT keys', () => {
    for (const key of ['sb_secret_' + 'x'.repeat(40), 'eyJhbGciOiJIUzI1NiJ9.e30.signature']) {
      assert.throws(() => validatePublicConfig({ ...valid, VITE_SUPABASE_PUBLISHABLE_KEY: key }));
    }
  });
});

describe('anonymous REST commissioning probe', () => {
  const config = validatePublicConfig(valid);
  it('checks public data and denies private data', async () => {
    const calls = [];
    const fakeFetch = async (url, options) => {
      calls.push(url);
      assert.equal(options.headers.apikey, config.key);
      const isPrivate = /nb_product_drafts|nb_media|nb_product_revisions/.test(url);
      return { status: isPrivate ? 403 : 200, json: async () => [] };
    };
    const results = await probeAnonymousApi(config, fakeFetch);
    assert.equal(calls.length, checksFor(config.url).length);
    assert.ok(results.every(result => result.ok));
  });
  it('fails when a draft or media table becomes publicly accessible', async () => {
    const results = await probeAnonymousApi(config, async () => ({ status: 200, json: async () => [] }));
    assert.ok(results.some(result => !result.ok && result.name === 'Private product drafts'));
    assert.ok(results.some(result => !result.ok && result.name === 'Private media metadata'));
  });
  it('fails when unpublished product rows leak through RLS', async () => {
    const results = await probeAnonymousApi(config, async url => ({
      status: /nb_product_drafts|nb_media|nb_product_revisions/.test(url) ? 403 : 200,
      json: async () => url.includes('status=neq.published') ? [{ id: 'leaked' }] : [],
    }));
    assert.ok(results.some(result => !result.ok && result.name === 'Hidden unpublished products'));
  });
  it('fails when a required public table has not been migrated', async () => {
    const results = await probeAnonymousApi(config, async url => ({
      status: url.includes('nb_categories') ? 404 :
        /nb_product_drafts|nb_media|nb_product_revisions/.test(url) ? 403 : 200,
      json: async () => [],
    }));
    assert.ok(results.some(result => !result.ok && result.name === 'Public categories'));
  });
});
