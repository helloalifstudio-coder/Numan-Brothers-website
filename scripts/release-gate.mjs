/**
 * Phase 6: machine-readable, fail-closed release evidence.
 * This evaluates human-recorded acceptance artifacts. It does not execute
 * integration tests or manufacture approval on the user's behalf.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const RELEASE_GATES = Object.freeze({
  protected_branch: 'Protected main branch and reviewed stacked PRs',
  exact_commit_ci: 'Passing CI on the exact planned release SHA',
  no_privileged_secrets: 'Repository and browser bundle secret scan',
  client_database: 'Dedicated client-owned Supabase with reviewed migrations',
  anonymous_rls: 'Live anonymous/editor/owner/revoked-user negative RLS tests',
  media_lifecycle: 'Private staging, approved public copy, revocation tests',
  cms_happy_path: 'Editor draft, owner approve/publish and version history',
  csv_recovery: 'Real CSV concurrency and interruption/recovery tests',
  photo_recovery: 'Real Storage upload/resume/reconciliation tests',
  data_scale: 'Measured 10k-product and 100k-media workload',
  seo_staging: 'Staging product/category HTML, genuine HTTP statuses and sitemap',
  mobile_accessibility: 'Mobile, keyboard, contrast and screen-reader checks',
  storage_restore: 'Database AND Storage backup-restore rehearsal',
  legacy_firebase: 'Deployed legacy Firebase security inspection and transition plan',
  verified_store_content: 'Owner-confirmed brand details, imagery and contact',
  owner_release_approval: 'Store owner approves exact release candidate',
  agency_release_approval: 'AGM reviewer approves exact release candidate',
  deployment_rollback: 'Known-good Vercel rollback target and no-per-commit previews',
});

const validHttps = value => {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password &&
      !url.hash && url.origin.length > 9;
  } catch { return false; }
};
const shaPattern = /^[a-f0-9]{40}$/i;
const refPattern = /^[a-z0-9]{10,40}$/;

export function evaluateReleaseEvidence(manifest) {
  const blockers = [];
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    return {ready:false,blockers:['Release evidence must be a JSON object'],passed:0,total:Object.keys(RELEASE_GATES).length};
  }
  if (!shaPattern.test(manifest.releaseSha || '')) {
    blockers.push('Exact 40-character release commit SHA is missing');
  }
  if (!refPattern.test(manifest.clientProjectRef || '')) {
    blockers.push('Verified client Supabase project reference is missing');
  }
  if (!refPattern.test(manifest.stagingProjectRef || '') ||
      manifest.stagingProjectRef === manifest.clientProjectRef) {
    blockers.push('Independent staging project reference is missing or equals production');
  }
  if (!validHttps(manifest.canonicalDomain)) {
    blockers.push('Owner-approved HTTPS canonical domain is missing');
  }
  if (!validHttps(manifest.stagingDeployment)) {
    blockers.push('Staging deployment URL is missing');
  }
  let passed=0;
  for (const [id,title] of Object.entries(RELEASE_GATES)) {
    const evidence=manifest.gates?.[id];
    const ready=evidence && evidence.status === 'passed' &&
      evidence.releaseSha === manifest.releaseSha &&
      typeof evidence.reviewer === 'string' && evidence.reviewer.trim().length > 2 &&
      validHttps(evidence.evidenceUrl) &&
      !Number.isNaN(Date.parse(evidence.verifiedAt || ''));
    if (ready) passed++;
    else blockers.push(title+' ('+id+') lacks signed-off exact-commit evidence');
  }
  return {ready:blockers.length===0,blockers,passed,total:Object.keys(RELEASE_GATES).length};
}

async function main() {
  const path=process.argv[2];
  if (!path) {
    console.error('Usage: node scripts/release-gate.mjs PATH_TO_APPROVED_EVIDENCE.json');
    process.exitCode=2;return;
  }
  let manifest;
  try {manifest=JSON.parse(readFileSync(path,'utf8'))}
  catch {console.error('NO-GO: Release evidence is missing or invalid JSON');process.exitCode=1;return;}
  const result=evaluateReleaseEvidence(manifest);
  console.log((result.ready?'GO':'NO-GO')+': '+result.passed+'/'+result.total+' signed-off acceptance gates');
  for (const blocker of result.blockers) console.log('BLOCKED: '+blocker);
  if (!result.ready) process.exitCode=1;
  else console.log('Evidence ledger passed; still execute the controlled release procedure and post-deployment smoke tests.');
}

if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  void main();
}
