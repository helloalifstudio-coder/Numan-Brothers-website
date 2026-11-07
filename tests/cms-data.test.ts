import { describe, expect, test } from 'bun:test';
import { cleanHome, HOME_TEMPLATE, isSafeHttps, rowToProduct } from '../src/lib/cmsData';
import { inCollection } from '../src/storefront/catalog';
describe('CMS content mapping', () => {
  test('sanitizes homepage JSON and handles unset fields', () => {
    expect(cleanHome({ heroTitle: 'New campaign', heroImage: false }).heroTitle).toBe('New campaign');
    expect(cleanHome({ heroImage: false }).heroImage).toBe('');
    expect(cleanHome(null)).toEqual(HOME_TEMPLATE);
  });
  test('rejects unsafe media URLs', () => {
    expect(isSafeHttps('https://example.com/media.jpg')).toBe(true);
    expect(isSafeHttps('javascript:alert(1)')).toBe(false);
    expect(isSafeHttps('https://user:pass@example.com/a')).toBe(false);
  });
  test('maps published database rows into correct department', () => {
    const p = rowToProduct({
      id: 'abc', sku: 'NB-001', slug: 'kids-sherwani', title:'Kids Sherwani',
      department:'kids', category_paths:['/kids/sherwani'], description:'',fabric:'',
      sizes:[],image_urls:['javascript:invalid','https://example.com/a.webp'],video_url:null,
      price:null,status:'published',sort_rank:0,created_at:'',updated_at:'',
    });
    expect(inCollection(p, '/kids')).toBe(true);
    expect(inCollection(p, '/men')).toBe(false);
    expect(p.images).toEqual(['https://example.com/a.webp']);
  });
});
