import { describe, expect, test } from 'bun:test';
import { PUBLIC_PAGE_SIZE, collectionFilterPaths, safeCatalogueSearch } from '../src/lib/catalogQueries';

describe('Scalable public catalogue query contract', () => {
  test('pages are bounded to 24 products', () => {
    expect(PUBLIC_PAGE_SIZE).toBe(24);
  });
  test('all sherwani subcollections appear in a parent collection filter', () => {
    expect(collectionFilterPaths('/men/sherwani')).toContain('/men/sherwani/handwork');
    expect(collectionFilterPaths('/men/sherwani')).toContain('/men/sherwani/plain');
    expect(collectionFilterPaths('/men/sherwani')).not.toContain('/kids/sherwani');
  });
  test('removes PostgREST query grammar and limits search length', () => {
    expect(safeCatalogueSearch('silk %, (title.ilike.*), sherwani')).not.toContain('%');
    expect(safeCatalogueSearch('b'.repeat(200))).toHaveLength(72);
    expect(safeCatalogueSearch('  Ivory   Sherwani  ')).toBe('Ivory Sherwani');
  });
});
