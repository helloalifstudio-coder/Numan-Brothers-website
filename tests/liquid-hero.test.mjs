import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';

const source=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('water-reflection is visual only; editable hero title stays a real accessible heading',()=>{
  const home=source('src/components/V2Home.tsx');
  assert.match(home,/<h1 id="v2-home-title" className="nb-liquid-hero/);
  assert.match(home,/\{home\.heroTitle\}/);
  assert.doesNotMatch(home,/data-text=\{home\.heroTitle\}|dangerouslySetInnerHTML/);
  const css=source('src/index.css');
  assert.match(css,/@keyframes nb-liquid-caustics/);
  assert.match(css,/background-clip: text/);
  assert.match(css,/prefers-reduced-motion: reduce/);
  assert.match(css,/-webkit-text-fill-color: currentColor/);
});

test('home quick-explore routes are preserved exactly',()=>{
  const home=source('src/components/V2Home.tsx');
  for(const path of ['/men/sherwani','/men/kurta-pyjama','/men/marriage','/kids'])
    assert.ok(home.includes('href="'+path+'"'),path);
  assert.match(home,/aria-label="Explore popular collections"/);
});

test('hero film occupies its own right-side panel and respects reduced motion',()=>{
  const home=source('src/components/V2Home.tsx');
  assert.match(home,/lg:grid-cols-\[minmax\(0,1\.1fr\)_minmax\(0,\.9fr\)\]/);
  assert.match(home,/home\.sectionVideos\.hero\s*\?/);
  assert.match(home,/autoPlay=\{!reduce\} muted loop playsInline/);
  assert.match(home,/controls autoPlay=\{!reduce\} muted loop playsInline/);
  assert.match(home,/poster=\{photo\|\|undefined\}/);
  assert.match(home,/aria-label="Nomaan Brothers brand film"/);
});

test('secondary product and collection page modules are split by route',()=>{
  const app=source('src/App.tsx');
  assert.match(app,/const V2Collection = React\.lazy/);
  assert.match(app,/const V2ProductGrid = React\.lazy/);
  assert.match(app,/const V2Product = React\.lazy/);
  assert.match(app,/<Suspense fallback=/);
  assert.doesNotMatch(app,/^import V2Collection/m);
});

test('mobile catalogue, contact, discovery and footer layouts preserve narrow widths',()=>{
  assert.match(source('src/components/V2Footer.tsx'),/sm:grid-cols-2/);
  assert.match(source('src/components/V2Collection.tsx'),/mb-7 flex flex-wrap/);
  assert.match(source('src/components/V2HomeDiscovery.tsx'),/break-words text-\[clamp\(2\.3rem/);
  assert.match(source('src/App.tsx'),/max-w-\[12ch\] break-words font-serif/);
});
