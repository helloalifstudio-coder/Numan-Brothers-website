#!/usr/bin/env node
/**
 * HTTP smoke test for the deployed Nomaan Brothers storefront.
 * Usage: node scripts/smoke-deployment.mjs https://your-domain.example
 * This does not replace real Supabase RLS, Auth, Storage or content checks.
 */
const raw = process.argv[2] || process.env.BASE_URL;
if (!raw) {
  console.error('Usage: node scripts/smoke-deployment.mjs https://your-domain.example');
  process.exit(2);
}
let origin;
try {
  const url = new URL(raw);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error('Expected an HTTPS site origin');
  }
  origin = url.origin;
} catch {
  console.error('Provide a valid HTTPS site origin without path, credentials, query or fragment.');
  process.exit(2);
}

const checks = [];
const check = (ok, message) => checks.push({ ok, message });
async function fetchPath(path) {
  const response = await fetch(new URL(path, origin), {
    redirect: 'follow',
    headers: { accept: 'text/html', 'user-agent': 'NomaanReleaseSmoke/1.0' },
    signal: AbortSignal.timeout(15000),
  });
  check(new URL(response.url).origin === origin, `${path}: stays on expected origin`);
  check(response.ok, `${path}: HTTP ${response.status} (expected 2xx; check SSO if 401/403)`);
  return { response, body: await response.text() };
}
try {
  const home = await fetchPath('/');
  check(/<html\b/i.test(home.body) && /id=["']root["']/i.test(home.body), '/: React shell loads');
  check(home.response.headers.get('x-content-type-options')?.toLowerCase() === 'nosniff', '/: nosniff');
  check(home.response.headers.get('x-frame-options')?.toUpperCase() === 'DENY', '/: deny framing');
  check(home.response.headers.get('content-security-policy')?.includes("frame-ancestors 'none'"), '/: restrictive CSP');
  check(home.response.headers.get('strict-transport-security')?.includes('max-age='), '/: HSTS');
  const studio = await fetchPath('/studio');
  check(studio.response.headers.get('x-robots-tag')?.toLowerCase().includes('noindex'), '/studio: noindex');
  check(studio.response.headers.get('cache-control')?.toLowerCase().includes('no-store'), '/studio: no-store');
  check(/<html\b/i.test(studio.body), '/studio: SPA deep-link works');
  const robots = await fetchPath('/robots.txt');
  check(/disallow:\s*\/studio\b/i.test(robots.body), '/robots.txt: disallows studio');
} catch (error) {
  check(false, `Network/response failure: ${error instanceof Error ? error.message : String(error)}`);
}
for (const { ok, message } of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${message}`);
const failures = checks.filter(x => !x.ok);
console.log(`\n${checks.length - failures.length}/${checks.length} HTTP checks passed`);
if (failures.length) {
  console.error('Do not promote this deployment.');
  process.exitCode = 1;
} else {
  console.log('HTTP checks passed; complete live Auth/RLS/Storage and owner signoff before launch.');
}
