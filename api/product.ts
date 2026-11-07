import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { canonicalOrigin, renderNotFoundHtml, renderProductHtml } from './_seo.mjs';

let cachedTemplate:string|null=null;
function template():string {
  if(cachedTemplate)return cachedTemplate;
  // Bundled by Vercel functions.includeFiles; never use source index.html,
  // which points to unhashed development JavaScript assets.
  cachedTemplate=readFileSync(resolve(process.cwd(),'dist/index.html'),'utf8');
  return cachedTemplate;
}
export default {
  async fetch(request:Request):Promise<Response>{
    if(request.method!=='GET')return new Response('Method not allowed',{status:405});
    const id=new URL(request.url).searchParams.get('id')||'';
    const headers={
      'Content-Type':'text/html; charset=utf-8',
      'X-Content-Type-Options':'nosniff',
      'Cache-Control':'public, s-maxage=90, stale-while-revalidate=600',
    };
    if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
      return new Response('Invalid product',{status:404,headers});
    const api=process.env.VITE_SUPABASE_URL||'';
    const key=process.env.VITE_SUPABASE_PUBLISHABLE_KEY||'';
    if(!/^https:\/\/[a-z0-9-]+[.]supabase[.]co$/.test(api)||!key.startsWith('sb_publishable_'))
      return new Response('Public catalogue unavailable',{status:503,headers:{...headers,'Cache-Control':'no-store'}});
    let html:string;
    try{html=template()}
    catch{return new Response('Build template unavailable',{status:503,headers:{...headers,'Cache-Control':'no-store'}})}
    try{
      const url=new URL(api+'/rest/v1/nb_products');
      url.searchParams.set('id','eq.'+id);
      url.searchParams.set('status','eq.published');
      url.searchParams.set('select','id,sku,title,department,description,fabric,image_urls,status');
      url.searchParams.set('limit','1');
      const response=await fetch(url,{headers:{apikey:key,Accept:'application/json'},
        signal:AbortSignal.timeout(10000),redirect:'error'});
      if(!response.ok)throw new Error('CMS data unavailable');
      const items=await response.json() as Record<string,unknown>[];
      if(!Array.isArray(items)||items.length===0)
        return new Response(renderNotFoundHtml(html),{status:404,headers:{...headers,'Cache-Control':'public, s-maxage=30'}});
      const body=renderProductHtml(html,items[0],canonicalOrigin(process.env.SITE_CANONICAL_URL||''));
      return new Response(body,{status:200,headers});
    }catch{
      return new Response('Catalogue temporarily unavailable',{status:503,headers:{...headers,'Cache-Control':'no-store'}});
    }
  },
};
