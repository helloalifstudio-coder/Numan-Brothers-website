import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { RELEASE_GATES, evaluateReleaseEvidence } from '../scripts/release-gate.mjs';

const releaseSha='a'.repeat(40);
const base={
  releaseSha,clientProjectRef:'clientproject123',stagingProjectRef:'stagingproject456',
  canonicalDomain:'https://nomaan.example',stagingDeployment:'https://staging.example',
};
const signed=()=>({
  ...base,gates:Object.fromEntries(Object.keys(RELEASE_GATES).map(k=>[k,{
    status:'passed', releaseSha,reviewer:'Release reviewer',
    verifiedAt:'2026-11-07T12:00:00Z',
    evidenceUrl:'https://github.com/helloalifstudio-coder/Numan-Brothers-website/actions',
  }]))
});
describe('Phase 6 release acceptance gate',()=>{
  it('defaults to no-go for missing evidence',()=>{
    const result=evaluateReleaseEvidence({});
    assert.equal(result.ready,false);
    assert.equal(result.passed,0);
    assert.ok(result.blockers.length>Object.keys(RELEASE_GATES).length);
  });
  it('rejects an acceptance made against another commit',()=>{
    const manifest=signed();
    manifest.gates.media_lifecycle.releaseSha='b'.repeat(40);
    assert.equal(evaluateReleaseEvidence(manifest).ready,false);
  });
  it('requires independent staging and an owner-approved HTTPS origin',()=>{
    const manifest=signed();
    manifest.stagingProjectRef=manifest.clientProjectRef;
    manifest.canonicalDomain='http://example.com';
    assert.equal(evaluateReleaseEvidence(manifest).ready,false);
  });
  it('rejects unverified pending evidence and non-HTTPS links',()=>{
    const manifest=signed();
    manifest.gates.csv_recovery.status='pending';
    manifest.gates.storage_restore.evidenceUrl='javascript:alert(1)';
    assert.equal(evaluateReleaseEvidence(manifest).ready,false);
  });
  it('recognizes a structurally complete manual evidence ledger',()=>{
    const result=evaluateReleaseEvidence(signed());
    assert.equal(result.ready,true);
    assert.equal(result.passed,result.total);
  });
});
