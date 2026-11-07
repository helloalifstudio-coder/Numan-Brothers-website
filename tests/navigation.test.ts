import { describe, expect, test } from 'bun:test';
import { COLLECTION_ROUTES, DEPARTMENTS, getCollection, normalizePath } from '../src/storefront/navigation';
import { inCollection, productPaths } from '../src/storefront/catalog';
import type { Product } from '../src/types';

const makeProduct = (id: string, title: string, category = 'other'): Product => ({
  id, title, category, price: 0, mrp: 0, images: [],
  fabric: '', length: '', sizes: [], description: '', specs: [], badges: [],
  colors: [], rating: 0, reviewsCount: 0, type: 'Set', hasBottom: true,
  sizeChart: { top: [] }, reviews: [],
});
describe('approved website taxonomy', () => {
  test('has exactly two departments with unique routes', () => {
    expect(DEPARTMENTS.map((department) => department.id)).toEqual(['men', 'kids']);
    expect(new Set(COLLECTION_ROUTES.map((route) => route.path)).size).toBe(COLLECTION_ROUTES.length);
  });
  test('keeps every user-requested label, including unresolved names', () => {
    expect(getCollection('/men/sherwani/handwork')?.title).toBe('Handwork Sherwani');
    expect(getCollection('/men/sherwani/plain')?.title).toBe('Plain Suits');
    expect(getCollection('/men/suits/plain')?.title).toBe('Plain Suits');
    expect(getCollection('/men/marriage/sadi')?.title).toBe('Sadi');
    expect(getCollection('/kids/sadi')?.title).toBe('Sadi');
    expect(getCollection('/kids/tope')?.title).toBe('Tope');
  });
  test('normalizes slash and query suffix', () => {
    expect(normalizePath('/men/sherwani/?ref=nav')).toBe('/men/sherwani');
  });
  test('does not misclassify unrelated garments', () => {
    expect(productPaths(makeProduct('1', 'Arabic Thoob', 'thoobs'))).toEqual([]);
    expect(inCollection(makeProduct('2', 'Kids Kurta Pyjama', 'kurtas'), '/men')).toBe(false);
  });
  test('maps legacy products to relevant collections and supports explicit ERP paths', () => {
    expect(inCollection(makeProduct('3','Hand-embroidered Groom Sherwani','sherwanis'),'/men/sherwani/handwork')).toBe(true);
    expect(inCollection(makeProduct('4','Jodhpuri Bandhgala Suit','indo-western'),'/men/jodhpuri')).toBe(true);
    expect(productPaths({ ...makeProduct('5','New Occasionwear'), collectionPaths: ['/kids/suits'] })).toEqual(['/kids/suits']);
  });
  test('unpublished products do not appear in public catalogue', () => {
    expect(productPaths({ ...makeProduct('6','Sherwani'), published: false })).toEqual([]);
  });
});
