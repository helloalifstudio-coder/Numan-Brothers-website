import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';

describe('public HTML release metadata', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

  test('does not publish an unverified domain, telephone or postal address', () => {
    expect(html).not.toContain('nomaanbrothers.com');
    expect(html).not.toContain('+919908597337');
    expect(html).not.toContain('506002');
    expect(html).not.toMatch(/<script[^>]+application\/ld\+json/);
    expect(html).not.toMatch(/<meta[^>]+property="og:url"/);
  });

  test('provides accurate fallback metadata for non-JavaScript crawlers', () => {
    expect(html).toContain('Men\'s & Kids\' Occasionwear in Warangal');
    expect(html).toMatch(/<meta[^>]+name="description"/);
    expect(html).toMatch(/<div id="root"><\/div>/);
  });
});
