import { canonicalOrigin, escapeHtml } from './_seo.mjs';
export default {
 async fetch(req:Request):Promise<Response>{
  if(req.method!=='GET')return new Response('Method not allowed',{status:405});
  const pageString=new URL(req.url).searchParams.get('page')||'';
  if(!/^(0|[1-9][0-9]{0,3})$/.test(pageString))return new Response('Invalid sitemap page',{status:404});
  const page=Number(pageString);
  const site=canonicalOrigin(process.env.SITE_CANONICAL_URL||'');
  const api=process.env.VITE_SUPABASE_URL||'',key=process.env.VITE_SUPABASE_PUBLISHABLE_KEY||'';
  if(!site||!api||!key)return new Response('Sitemap unavailable',{status:503});
  try{
    const params=new URLSearchParams({select:'id',status:'eq.published',order:'id.asc',limit:'1000',offset:String(page*1000)});
    const response=await fetch(api+'/rest/v1/nb_products?'+params,
      {headers:{apikey:key,Accept:'application/json'},signal:AbortSignal.timeout(9000)});
    if(!response.ok)throw new Error('Database unavailable');
    const rows=await response.json() as {id:string}[];
    if(!Array.isArray(rows)||!rows.length)return new Response('Sitemap not found',{status:404});
    const xml='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+
      rows.map(row=>'<url><loc>'+escapeHtml(site+'/products/'+encodeURIComponent(row.id))+'</loc></url>').join('')+'</urlset>';
    return new Response(xml,{status:200,headers:{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'public, s-maxage=900'}});
  }catch{return new Response('Sitemap temporarily unavailable',{status:503,headers:{'Cache-Control':'no-store'}})}
 },
};
