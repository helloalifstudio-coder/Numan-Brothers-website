import { canonicalOrigin, escapeHtml } from './_seo.mjs';
const headers={ 'Content-Type':'application/xml; charset=utf-8','Cache-Control':'public, s-maxage=1800, stale-while-revalidate=3600' };
export default {
 async fetch(req:Request):Promise<Response>{
  if(req.method!=='GET')return new Response('Method not allowed',{status:405});
  const site=canonicalOrigin(process.env.SITE_CANONICAL_URL||'');
  const api=process.env.VITE_SUPABASE_URL||'',key=process.env.VITE_SUPABASE_PUBLISHABLE_KEY||'';
  if(!site||!api||!key)return new Response('Sitemap not configured',{status:503});
  try{
    const params=new URLSearchParams({select:'id',status:'eq.published',limit:'1'});
    const r=await fetch(api+'/rest/v1/nb_products?'+params,{headers:{apikey:key,Prefer:'count=exact',Accept:'application/json'},signal:AbortSignal.timeout(9000)});
    if(!r.ok)throw new Error('No catalogue');
    const total=Number(r.headers.get('content-range')?.split('/').at(-1));
    if(!Number.isFinite(total)||total<0)throw new Error('No count');
    const locations=[site+'/sitemap-static.xml',...Array.from({length:Math.ceil(total/1000)},(_,i)=>site+'/sitemap-products/'+i+'.xml')];
    const xml='<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+
      locations.map(url=>'<sitemap><loc>'+escapeHtml(url)+'</loc></sitemap>').join('')+'</sitemapindex>';
    return new Response(xml,{status:200,headers});
  }catch{return new Response('Sitemap unavailable',{status:503,headers:{'Cache-Control':'no-store'}})}
 },
};
