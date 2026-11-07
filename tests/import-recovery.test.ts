import { describe, expect, test } from 'bun:test';
import { stableImportId } from '../src/lib/importEngine';

describe('Import retry identities',()=>{
  test('uses a deterministic RFC4122 UUID for a given job and row',async()=>{
    const job='11111111-1111-4111-8111-111111111111';
    const id=await stableImportId(job,42);
    expect(id).toBe(await stableImportId(job,42));
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
  test('changes identity for different rows or separate importer jobs',async()=>{
    const a='11111111-1111-4111-8111-111111111111';
    const b='22222222-2222-4222-8222-222222222222';
    const ids=await Promise.all([stableImportId(a,2),stableImportId(a,3),stableImportId(b,2)]);
    expect(new Set(ids).size).toBe(3);
  });
  test('rejects malformed or negative row references',async()=>{
    await expect(stableImportId('not-a-uuid',1)).rejects.toThrow();
    await expect(stableImportId('11111111-1111-4111-8111-111111111111',-2)).rejects.toThrow();
  });
});
