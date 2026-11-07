import { canonicalOrigin, escapeHtml } from './_seo.mjs';
import { seoRoutes } from '../scripts/seo-routes.mjs';
export default {
 fetch(req:Request):Response {
  if(req.method!=='GET')return new Response('Method not allowed',{status:405});
  const site=canonicalOrigin(process.env.SITE_CANONICAL_URL||'');
  if(!site)return new Response('Canonical origin not configured',{status:503});
  const xml='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+
    seoRoutes.map(route=>'<url><loc>'+escapeHtml(site+route.path)+'</loc></url>').join('')+'</urlset>';
  return new Response(xml,{status:200,headers:{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'public, s-maxage=3600'}});
 },
};
