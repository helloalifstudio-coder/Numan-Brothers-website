import { describe, expect, test } from 'bun:test';
import { COLLECTION_ROUTES } from '../src/storefront/navigation';
import { seoRoutes } from '../scripts/seo-routes.mjs';

describe('Prerender manifest consistency',()=>{
  test('every registered public collection is included in the crawlable build',()=>{
    const defined=[...new Set(['/',...COLLECTION_ROUTES.map(x=>x.path)])].sort();
    const rendered=seoRoutes.map(x=>x.path).sort();
    expect(rendered).toEqual(defined);
  });
});
