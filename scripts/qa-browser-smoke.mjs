/**
 * Browser smoke suite for the public shop and (unauthenticated) private Studio.
 * Uses a separately installed pinned Playwright package via NODE_PATH so the
 * application's frozen Bun dependency lockfile remains untouched.
 */
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');

const base=(process.env.NB_TEST_URL||'http://127.0.0.1:4173').replace(/\/$/,'');
const live=process.env.NB_MODE==='live';
const screenshots='artifacts/browser';
mkdirSync(screenshots,{recursive:true});

const mockProduct={
  id:'11111111-1111-4111-8111-111111111111',slug:'ivory-sherwani-nb-sh-00001',
  sku:'NB-SH-00001',title:'Ivory Heritage Sherwani',department:'men',
  category_paths:['/men/sherwani'],description:'An elegant sherwani for celebrations.',
  fabric:'Silk blend',sizes:['40','42','44'],image_urls:[],video_url:null,
  price:12000,offer_price:9900,customizable:true,status:'published',sort_rank:1,
  created_at:'2026-10-01T00:00:00Z',updated_at:'2026-10-01T00:00:00Z'
};
async function mockCmsRoutes(page,{emptyContacts=false}={}){
  if(process.env.NB_MOCK_CMS!=='1')return;
  await page.route('https://fixture.supabase.co/**',async route=>{
    const url=new URL(route.request().url());
    const path=url.pathname;
    const json=(body,extra={})=>route.fulfill({status:200,contentType:'application/json',
      headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'apikey,authorization,content-type,x-client-info,prefer,accept,accept-profile,content-profile','Access-Control-Allow-Methods':'GET,POST,OPTIONS,HEAD','content-range':'0-0/1',...extra},body:JSON.stringify(body)});
    if(path.endsWith('/nb_home_public'))return json({content:emptyContacts?{}:{
      contactWhatsapp:'919876543210',contactPhone:'919876543211'
    }});
    if(path.endsWith('/nb_categories'))return json([]);
    if(path.endsWith('/nb_products')){
      const singleton=(route.request().headers()['accept']||'').includes('vnd.pgrst.object');
      if(singleton){
        const match=url.searchParams.get('slug')==='eq.'+mockProduct.slug ||
          url.searchParams.get('id')==='eq.'+mockProduct.id;
        return match?json(mockProduct):route.fulfill({status:406,contentType:'application/json',body:JSON.stringify({code:'PGRST116'})});
      }
      if(url.searchParams.get('id')==='neq.'+mockProduct.id)return json([],{'content-range':'*/0'});
      const dept=url.searchParams.get('department');
      const hasKids=dept==='eq.kids'||(url.searchParams.get('category_paths')||'').includes('/kids/');
      const search=url.searchParams.get('or')||'';
      const rows=hasKids||(search&&!search.toLowerCase().includes('sherwani'))?[]:[mockProduct];
      return json(rows,{'content-range':rows.length?'0-0/1':'*/0'});
    }
    return json([]);
  });
}

const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const failures=[];
const results=[];
let skipped=false;

async function inspect(route,width=390,height=844,opts={}){
  const context=await browser.newContext({viewport:{width,height},reducedMotion:opts.reduce?'reduce':'no-preference'});
  const page=await context.newPage();
  const runtimeErrors=[];
  page.on('pageerror',error=>runtimeErrors.push(String(error.message)));
  await mockCmsRoutes(page);
  try{
    const response=await page.goto(base+route,{waitUntil:'domcontentloaded',timeout:25000});
    const status=response?.status()||0;
    if(live && [401,403,429].includes(status)){
      skipped=true;console.log('DEPLOYMENT_ACCESS_LIMITED',base,route,status);return;
    }
    assert.equal(status,200,'HTTP '+status+' at '+route);
    await page.locator('h1').first().waitFor({state:'visible',timeout:25000});
    await page.waitForTimeout(150);
    const layout=await page.evaluate(()=>{
      const heading=document.querySelector('h1');
      const rect=heading?.getBoundingClientRect();
      const nav=Array.from(document.querySelectorAll('header button[aria-label="Open navigation"],header button[aria-label="Search collections"]'))
        .filter(el=>el.getClientRects().length>0)
        .map(el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width,height:r.height}});
      return {
        screen:innerWidth,
        documentWidth:document.documentElement.scrollWidth,
        bodyWidth:document.body.scrollWidth,
        h1:heading?.textContent?.trim()||'',
        h1Bounds:rect?{left:rect.left,right:rect.right}:null,
        nav,
      };
    });
    assert.ok(layout.documentWidth<=width+2,
      'horizontal page overflow at '+route+' '+width+'px: '+layout.documentWidth);
    assert.ok(layout.bodyWidth<=width+2,
      'body overflow at '+route+' '+width+'px: '+layout.bodyWidth);
    assert.deepEqual(runtimeErrors,[],'page JavaScript errors on '+route+' '+width+'px');
    assert.ok(layout.h1Bounds&&layout.h1Bounds.left>=-2&&layout.h1Bounds.right<=width+2,
      'main heading clipped on '+route+' '+width+'px');
    for(const target of layout.nav) {
      assert.ok(target.left>=-2&&target.right<=width+2,'header control outside viewport '+route+' '+width+'px');
      assert.ok(target.width>=40&&target.height>=40,'header control below usable touch size');
    }
    if(opts.matrix&&route==='/studio'&&width<=820){
      const authInput=page.getByRole('textbox',{name:'Staff email'});
      if(await authInput.count())assert.ok(await authInput.isVisible(),'Studio login must fit');
    }
    if(route==='/'){
      const hero=page.locator('#v2-home-title');
      assert.equal(await hero.count(),1,'one semantic hero heading');
      assert.ok((await hero.getAttribute('class'))?.includes('nb-liquid-hero'));
      const menu=page.locator('nav[aria-label="Explore popular collections"]');
      for(const route of ['/men/sherwani','/men/kurta-pyjama','/men/marriage','/kids'])
        assert.equal(await menu.locator('a[href="'+route+'"]').count(),1,'quick link '+route);
      const effect=await hero.evaluate(el=>{
        const style=getComputedStyle(el);
        return {animation:style.animationName,gradient:style.backgroundImage};
      });
      if(opts.reduce)assert.equal(effect.animation,'none','reduced motion must disable shimmer');
      else assert.match(effect.gradient,/gradient/,'water reflection has CSS gradient');
      if(opts.matrix&&[280,375,820,1280].includes(width)){
        await page.getByRole('button',{name:'Search collections'}).click();
        await page.getByRole('dialog',{name:'Search clothing collections'}).waitFor({state:'visible',timeout:5000});
        await page.keyboard.press('Escape');
        await page.getByRole('dialog',{name:'Search clothing collections'}).waitFor({state:'hidden',timeout:5000});
      }
      if(width<=768 && !opts.reduce){
        await page.getByRole('button',{name:'Open navigation'}).click();
        await page.getByRole('dialog',{name:'Browse collections'}).waitFor({state:'visible',timeout:5000});
        await page.keyboard.press('Escape');
        await page.getByRole('dialog',{name:'Browse collections'}).waitFor({state:'hidden',timeout:5000});
      }
    }
    if(route==='/'&&live&&width===390){
      await page.locator('[data-nb-contact-hero]')
        .evaluate(el=>window.scrollTo(0,el.getBoundingClientRect().bottom+window.scrollY+160));
      const dock=page.getByTestId('floating-contact-dock');
      await dock.waitFor({state:'visible',timeout:8000});
      assert.ok(await dock.locator('a').count()>0,'production must always expose a real contact action');
      console.log('PASS_LIVE_CONTACT_DOCK',JSON.stringify({base,width,links:await dock.locator('a').count()}));
    }
    if(!opts.reduce && (!opts.matrix || [280,390,768,1024,1920].includes(width)) && (route==='/' || route==='/studio' || (width===390 && route==='/men/sherwani'))){
      const name=(live?'live-':'local-')+route.replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').replace(/^$/,'home')+'-'+width+'.png';
      await page.screenshot({path:join(screenshots,name),animations:'disabled'});
    }
    const metric={url:base+route,width,status,documentWidth:layout.documentWidth,h1:layout.h1.slice(0,72)};
    results.push(metric);console.log('PASS',JSON.stringify(metric));
  }catch(error){
    failures.push({route,width,error:String(error?.stack||error)});
    console.error('FAIL',base+route,width,String(error?.message||error));
  }finally{await context.close();}
}


async function inspectUnconfiguredContactFallback(){
  if(process.env.NB_MOCK_CMS!=='1')return;
  for(const width of [320,375,390,768,1440]){
    const context=await browser.newContext({viewport:{width,height:844}});
    const page=await context.newPage();
    await mockCmsRoutes(page,{emptyContacts:true});
    try{
      await page.goto(base+'/',{waitUntil:'domcontentloaded'});
      await page.locator('#v2-home-title').waitFor({state:'visible',timeout:7000});
      const dock=page.getByTestId('floating-contact-dock');
      assert.equal(await dock.count(),0,'dock is hidden before hero is passed');
      await page.locator('[data-nb-contact-hero]')
        .evaluate(el=>window.scrollTo(0,el.getBoundingClientRect().bottom+window.scrollY+160));
      await dock.waitFor({state:'visible',timeout:7000});
      const fallback=dock.getByRole('link',{name:'Contact Nomaan Brothers showroom'});
      assert.equal(await fallback.getAttribute('href'),'/contact');
      assert.equal(await dock.locator('a[href^="https://wa.me/"]').count(),0,'no invented WhatsApp number');
      assert.equal(await dock.locator('a[href^="tel:"]').count(),0,'no invented phone number');
      const rect=await fallback.boundingBox();
      assert.ok(rect&&rect.width>=44&&rect.height>=44,'fallback is easy to tap');
      const extent=await page.evaluate(()=>document.documentElement.scrollWidth);
      assert.ok(extent<=width+2,'no horizontal overflow at '+width+'px');
      console.log('PASS_EMPTY_CONTACT_FALLBACK',JSON.stringify({width,href:'/contact',tapHeight:rect.height}));
    }catch(error){
      failures.push({route:'empty-contact',width,error:String(error?.stack||error)});
      console.error('FAIL_EMPTY_CONTACT_FALLBACK',width,String(error?.message||error));
    }finally{await context.close();}
  }
}

async function inspectFloatingContactsAndProduct(){
  if(process.env.NB_MOCK_CMS!=='1')return;
  const context=await browser.newContext({viewport:{width:375,height:812}});
  const page=await context.newPage();
  await mockCmsRoutes(page);
  try{
    await page.goto(base+'/',{waitUntil:'domcontentloaded'});
    await page.locator('#v2-home-title').waitFor({state:'visible'});
    const dock=page.getByTestId('floating-contact-dock');
    assert.equal(await dock.count(),0,'contact dock starts hidden above the hero');
    await page.locator('[data-nb-contact-hero]').evaluate(el=>window.scrollTo(0,el.getBoundingClientRect().bottom+window.scrollY+160));
    await dock.waitFor({state:'visible',timeout:7000});
    const whatsapp=dock.getByRole('link',{name:/WhatsApp/});
    const call=dock.getByRole('link',{name:/Call Nomaan Brothers/});
    assert.match(await whatsapp.getAttribute('href'),/^https:\/\/wa\.me\/919876543210\?text=/);
    assert.equal(await call.getAttribute('href'),'tel:+919876543211');
    const target=await call.boundingBox();
    assert.ok(target?.height>=44&&target?.width>=44,'touch target must be 44px minimum');
    console.log('PASS_FLOATING_CONTACT_DOCK',JSON.stringify({width:375,hiddenAboveHero:true,links:2,touchTarget:target?.height}));
    await page.goto(base+'/products/'+mockProduct.slug,{waitUntil:'domcontentloaded'});
    await page.getByRole('heading',{level:1,name:mockProduct.title}).waitFor({state:'visible',timeout:7000});
    assert.equal(await page.getByText('Style code · '+mockProduct.sku).count(),1);
    const size=page.getByRole('button',{name:'42',exact:true});
    await size.click();
    assert.equal(await size.getAttribute('aria-pressed'),'true');
    const enquire=page.getByRole('link',{name:/Enquire about this design/i}).first();
    assert.match(await enquire.getAttribute('href'),/Requested%20size%3A%2042/);
    await page.getByRole('button',{name:/Share this design/}).click();
    await page.getByRole('status').filter({hasText:/Link copied|browser address|Shared successfully/})
      .first().waitFor({state:'visible',timeout:5000});
    const gridLinks=await page.locator('a[href="/products/'+mockProduct.slug+'"]').count();
    assert.equal(gridLinks,0,'current item must not appear as a related product');
    console.log('PASS_UNIQUE_PRODUCT_PAGE',JSON.stringify({slug:mockProduct.slug,size:'42',share:true,wa:true}));
  }catch(error){
    failures.push({route:'floating-and-product',width:375,error:String(error?.stack||error)});
    console.error('FAIL_FLOATING_CONTACT_PRODUCT',String(error?.message||error));
  }finally{await context.close();}
}


/** Screenshot-worthy but bounded layout matrix. UI navigation stays a single
 * source of truth: no viewport-dependent duplicate route implementations. */
async function inspectViewportMatrix(){
  if(live||process.env.NB_MOCK_CMS!=='1')return;
  const viewports=[
    [280,653],[320,568],[344,720],[360,740],[375,667],
    [390,844],[414,896],[430,932],[480,800],[640,800],
    [768,1024],[820,1180],[1024,768],[1180,820],
    [1280,800],[1440,900],[1920,1080],[2560,1440]
  ];
  const routes=['/','/men/sherwani','/men/kurta-pyjama','/kids',
    '/contact','/search?q=sherwani','/products/'+mockProduct.slug,'/studio'];
  for(const [width,height] of viewports){
    for(const route of routes)await inspect(route,width,height,{matrix:true});
  }
  console.log('RESPONSIVE_MATRIX_COMPLETE',JSON.stringify({viewports:viewports.length,routes:routes.length,planned:viewports.length*routes.length}));
}

try{
  const routes=['/','/men','/kids','/men/sherwani','/men/kurta-pyjama','/men/marriage','/contact','/search?q=sherwani','/studio'];
  for(const route of routes)await inspect(route);
  if(!skipped)for(const width of [320,375,768,1024,1440]){
    await inspect('/',width,width<=375?740:900);
  }
  if(!skipped)await inspect('/',390,844,{reduce:true});
  if(!skipped)await inspectFloatingContactsAndProduct();
  if(!skipped)await inspectUnconfiguredContactFallback();
  if(!skipped)await inspectViewportMatrix();
}finally{await browser.close();}
if(skipped)console.log('LIVE_CHECK_INCOMPLETE: external deployment is not publicly accessible from this runner.');
console.log('BROWSER_SMOKE_SUMMARY',JSON.stringify({base,live,checks:results.length,failures:failures.length,skipped}));
if(failures.length)process.exitCode=1;
