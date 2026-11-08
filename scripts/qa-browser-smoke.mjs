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
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const failures=[];
const results=[];
let skipped=false;

async function inspect(route,width=390,height=844,opts={}){
  const context=await browser.newContext({viewport:{width,height},reducedMotion:opts.reduce?'reduce':'no-preference'});
  const page=await context.newPage();
  const runtimeErrors=[];
  page.on('pageerror',error=>runtimeErrors.push(String(error.message)));
  try{
    const response=await page.goto(base+route,{waitUntil:'domcontentloaded',timeout:25000});
    const status=response?.status()||0;
    if(live && [401,403,429].includes(status)){
      skipped=true;console.log('DEPLOYMENT_ACCESS_LIMITED',base,route,status);return;
    }
    assert.equal(status,200,'HTTP '+status+' at '+route);
    await page.locator('h1').first().waitFor({state:'visible',timeout:25000});
    await page.waitForTimeout(150);
    const layout=await page.evaluate(()=>({
      screen:innerWidth,
      documentWidth:document.documentElement.scrollWidth,
      bodyWidth:document.body.scrollWidth,
      h1:document.querySelector('h1')?.textContent?.trim()||''
    }));
    assert.ok(layout.documentWidth<=width+2,
      'horizontal page overflow at '+route+' '+width+'px: '+layout.documentWidth);
    assert.ok(layout.bodyWidth<=width+2,
      'body overflow at '+route+' '+width+'px: '+layout.bodyWidth);
    assert.deepEqual(runtimeErrors,[],'page JavaScript errors on '+route+' '+width+'px');
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
      if(width<=768 && !opts.reduce){
        await page.getByRole('button',{name:'Open navigation'}).click();
        await page.getByRole('dialog',{name:'Browse collections'}).waitFor({state:'visible',timeout:5000});
        await page.keyboard.press('Escape');
        await page.getByRole('dialog',{name:'Browse collections'}).waitFor({state:'hidden',timeout:5000});
      }
    }
    if(!opts.reduce && (route==='/' || route==='/studio' || (width===390 && route==='/men/sherwani'))){
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

try{
  const routes=['/','/men','/kids','/men/sherwani','/men/kurta-pyjama','/men/marriage','/contact','/search?q=sherwani','/studio'];
  for(const route of routes)await inspect(route);
  if(!skipped)for(const width of [320,375,768,1024,1440]){
    await inspect('/',width,width<=375?740:900);
  }
  if(!skipped)await inspect('/',390,844,{reduce:true});
}finally{await browser.close();}
if(skipped)console.log('LIVE_CHECK_INCOMPLETE: external deployment is not publicly accessible from this runner.');
console.log('BROWSER_SMOKE_SUMMARY',JSON.stringify({base,live,checks:results.length,failures:failures.length,skipped}));
if(failures.length)process.exitCode=1;
