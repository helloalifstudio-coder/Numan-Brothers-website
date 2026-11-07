import { describe, expect, test } from 'bun:test';
import { MAX_IMPORT_RECORDS, validateCatalogueCsv, skuFromImageFilename } from '../src/lib/bulkCsv';
import { PUBLIC_PAGE_SIZE } from '../src/lib/catalogQueries';

// Synthetic data is created only in memory, never committed as client inventory.
describe('Offline catalogue-scale qualification',()=>{
  test('validates a complete 10,000-row CSV without accumulating fake database entries',()=>{
    const rows=['sku,title,department,category,sizes,fabric,price'];
    for(let i=1;i<=MAX_IMPORT_RECORDS;i++){
      rows.push('NB-'+String(i).padStart(6,'0')+',Garment '+i+',men,/men/sherwani,38|40,Silk,');
    }
    const records=validateCatalogueCsv(rows.join('\n'));
    expect(records.length).toBe(10000);
    expect(records.every(x=>x.error===null)).toBe(true);
    expect(records[0].draft.categoryPaths).toEqual(['/men/sherwani']);
    expect(records.at(-1)?.sku).toBe('NB-010000');
    expect(PUBLIC_PAGE_SIZE).toBeLessThanOrEqual(50);
  });
  test('rejects an 10,001-row CSV at the bounded import limit',()=>{
    const lines=['sku,title,department,category'];
    for(let i=1;i<=MAX_IMPORT_RECORDS+1;i++)lines.push('NB-'+i+',Garment '+i+',kids,/kids/sherwani');
    expect(()=>validateCatalogueCsv(lines.join('\n'))).toThrow();
  });
  test('recognizes 100k synthetic filenames with unambiguous SKU identifiers',()=>{
    let valid=0;
    for(let i=0;i<100000;i++){
      const id='NB-'+String(i+1).padStart(6,'0');
      const item=skuFromImageFilename(id+'_01.webp');
      if(item?.sku===id&&item.order===1)valid++;
    }
    expect(valid).toBe(100000);
  });
});
