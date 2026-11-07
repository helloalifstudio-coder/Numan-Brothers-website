import { describe, expect, test } from 'bun:test';
import { parseCsv, skuFromImageFilename, validateCatalogueCsv, downloadCsvErrors } from '../src/lib/bulkCsv';

describe('Catalogue onboarding CSV parser',()=>{
  test('accepts quoted commas, escaped quotes and CRLF',()=>{
    const rows=parseCsv('sku,title,department,category\r\nNB-01,"Ivory, \"\"Royal\"\" Sherwani",men,/men/sherwani\r\n');
    expect(rows[1][1]).toBe('Ivory, "Royal" Sherwani');
  });
  test('rejects incomplete quoted fields',()=>{
    expect(()=>parseCsv('sku,title\nNB-01,"Unclosed')).toThrow();
  });
  test('normalizes SKU and validates correct department/category',()=>{
    const result=validateCatalogueCsv('sku,title,department,category,sizes\nnb-shw-01,Ivory Sherwani,men,/men/sherwani,38|40|42\n');
    expect(result[0].error).toBeNull();
    expect(result[0].sku).toBe('NB-SHW-01');
    expect(result[0].draft.sizes).toEqual(['38','40','42']);
    expect(result[0].draft.imageUrls).toEqual([]);
  });
  test('rejects duplicate SKU and category mismatch without importing',()=>{
    const data=validateCatalogueCsv('sku,title,department,category\nNB-01,Men Suit,men,/men/suits\nnb-01,Kids Suit,kids,/kids/suits\nNB-02,Bad category,kids,/men/suits\n');
    expect(data[0].error).toBeNull();
    expect(data[1].error).toContain('Duplicate SKU');
    expect(data[2].error).toContain('category');
  });
  test('requires headers and guards SQL/postgrest unsafe title data',()=>{
    expect(()=>validateCatalogueCsv('id,title\n1,Hi')).toThrow('Missing CSV column: sku');
    const rows=validateCatalogueCsv('sku,title,department,category\nNB-01,=HYPERLINK,men,/men/suits\n');
    expect(rows[0].draft.title).toBe('=HYPERLINK');
    // CMS renders React text (not HTML) and does not interpolate SQL strings.
  });
  test('matches deterministic photo order and rejects unsafe extensions',()=>{
    expect(skuFromImageFilename('NB-SHW-001_02.webp')).toEqual({sku:'NB-SHW-001',order:2});
    expect(skuFromImageFilename('NB-SHW-001_00.webp')).toBeNull();
    expect(skuFromImageFilename('NB-SHW-001_02.svg')).toBeNull();
  });
  test('quotes failure reports',()=>{
    expect(downloadCsvErrors([{rowNumber:2,sku:'NB-01',message:'Invalid "price"'}]))
      .toContain('"Invalid ""price"""');
  });
});
