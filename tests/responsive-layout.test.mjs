import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const src = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('mobile navigation remains reachable throughout tablet breakpoints', () => {
  const header = src('src/components/V2Header.tsx');
  assert.match(header, /className="flex items-center lg:hidden"/);
  assert.match(header, /className="hidden items-center gap-2 lg:flex"/);
  assert.match(header, /className="fixed inset-0 z-\[70\] lg:hidden"/);
  assert.doesNotMatch(header, /className="flex items-center md:hidden"/);
});

test('mobile CMS navigation scrolls instead of filling the viewport', () => {
  const studio = src('src/components/CmsStudio.tsx');
  assert.match(studio, /overscroll-x-contain/);
  assert.match(studio, /shrink-0 items-center gap-2 whitespace-nowrap/);
  assert.match(studio, /lg:grid-cols-\[245px_minmax\(0,1fr\)\]/);
});

test('homepage renders an approved menswear image and scales headings down', () => {
  const home = src('src/components/V2Home.tsx');
  assert.match(home, /\{\(home\.menImage \|\| getImage\('\/men'\)\) && <img/);
  assert.match(home, /break-words text-\[clamp\(2\.8rem,10vw,8\.1rem\)\]/);
});

test('CMS product forms and asset controls work on narrow layouts', () => {
  assert.match(src('src/components/studio/CmsProducts.tsx'), /max-h-60 space-y-2/);
  assert.match(src('src/components/studio/AssetEditor.tsx'), /flex flex-wrap items-center justify-between gap-1 bg-white/);
  assert.match(src('src/components/studio/StudioShared.tsx'), /text-base text-stone-900 sm:text-sm/);
});

test('product CTAs keep room for mobile safe areas', () => {
  const product = src('src/components/V2Product.tsx');
  assert.match(product, /pb-24 lg:pb-0/);
  const dock = src('src/components/FloatingContactDock.tsx');
  assert.match(dock, /env\\(safe-area-inset-bottom\\)/);
  assert.match(dock, /min-h-13 min-w-13/);
  assert.doesNotMatch(product, /fixed inset-x-0 bottom-0/);
  assert.match(src('src/components/V2Collection.tsx'), /min-\[360px\]:grid-cols-2/);
});
