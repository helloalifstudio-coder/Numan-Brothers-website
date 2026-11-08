import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, canonicalOrigin, renderProductHtml, renderNotFoundHtml } from '../api/_seo.mjs';
import { seoRoutes } from '../scripts/seo-routes.mjs';

const template='<!doctype html><html><head><title>Original</title><meta name="description" content="Original"/></head><body><div id="root"></div><script src="/assets/app.js"></script></body></html>';
describe('SEO HTML safety and crawlability',()=>{
  it('escapes markup and user-entered product content',()=>{
    const html=renderProductHtml(template,{id:'abc',sku:'NB-1',title:'<script>alert("x")</script>',description:'<img src=x onerror=alert(1)>',department:'men',fabric:'silk',image_urls:['https://img.example/a.webp']},'https://nomaan.example');
    assert.match(html,/<h1>&lt;script&gt;/);
    assert.doesNotMatch(html,/<script>alert\("x"\)<\/script>/);
    assert.match(html,/application\/ld\+json/);
    assert.match(html,/<link rel="canonical" href="https:\/\/nomaan\.example\/products\/abc"/);
    assert.match(html,/<script src="\/assets\/app\.js"><\/script>/);
    assert.ok(html.includes('\\u003cscript')); // JSON-LD must not terminate script tag.
  });
  it('rejects unsafe canonical host values',()=>{
    assert.equal(canonicalOrigin('https://nomaan.example'),'https://nomaan.example');
    for(const value of ['javascript:alert(1)','http://example.com','https://user:pass@example.com','https://example.com/unsafe','https://example.com/?p=1']){
      assert.equal(canonicalOrigin(value),null,value);
    }
  });
  it('provides noindex and a semantic 404',()=>{
    const html=renderNotFoundHtml(template);
    assert.match(html,/noindex/);
    assert.match(html,/<h1>Product not found<\/h1>/);
  });
  it('does not echo unsafe entities into titles',()=>{
    assert.equal(escapeHtml('<img src="x">'),'&lt;img src=&quot;x&quot;&gt;');
  });
  it('contains a unique meaningful home and collection sitemap manifest',()=>{
    assert.ok(seoRoutes.find(x=>x.path==='/'));
    assert.ok(seoRoutes.find(x=>x.path==='/men/sherwani'));
    assert.ok(seoRoutes.find(x=>x.path==='/kids/sherwani'));
    assert.equal(new Set(seoRoutes.map(x=>x.path)).size,seoRoutes.length);
    assert.ok(seoRoutes.every(x=>x.title&&x.description));
  });
});

describe('Per-product SEO metadata',()=>{
  it('uses the published slug and true INR price',()=>{
    const html=renderProductHtml(template,{
      id:'11111111-1111-4111-8111-111111111111',slug:'royal-ivory-sherwani',
      sku:'NB-SH-00001',title:'Royal Ivory Sherwani',department:'men',
      description:'Hand finished',image_urls:['https://cdn.example.com/royal.webp'],
      price:12000,offer_price:9900,
    },'https://nomaan.example');
    assert.match(html,/<link rel="canonical" href="https:\/\/nomaan\.example\/products\/royal-ivory-sherwani"/);
    assert.match(html,/"priceCurrency":"INR"/);
    assert.match(html,/"price":9900/);
  });
});
