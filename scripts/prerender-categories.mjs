#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { seoRoutes } from './seo-routes.mjs';
import { canonicalOrigin, escapeHtml } from '../api/_seo.mjs';

const dist=resolve(process.cwd(),'dist');
const template=readFileSync(resolve(dist,'index.html'),'utf8');
const raw=process.env.SITE_CANONICAL_URL||'';
const site=raw?canonicalOrigin(raw):null;
if(raw&&!site)throw new Error('SITE_CANONICAL_URL must be a verified HTTPS origin');
for(const item of seoRoutes){
  const docTitle=escapeHtml(item.title+' | Nomaan Brothers');
  const description=escapeHtml(item.description);
  const head=[
    '<title>'+docTitle+'</title>',
    '<meta name="description" content="'+description+'"/>',
    '<meta property="og:title" content="'+docTitle+'"/>',
    '<meta property="og:description" content="'+description+'"/>',
    ...(site?['<link rel="canonical" href="'+escapeHtml(site+item.path)+'"/>']:[]),
  ].join('\n');
  const links=seoRoutes.filter(other=>other.path!==item.path && other.path!=='/')
    .slice(0,12).map(other=>'<a href="'+escapeHtml(other.path)+'">'+escapeHtml(other.title)+'</a>')
    .join(' · ');
  const html=template.replace(/<title>[\s\S]*?<\/title>/i,'')
    .replace(/<meta\s+name="description"[^>]*>/i,'')
    .replace(/<meta\s+property="og:(?:title|description)"[^>]*>/gi,'')
    .replace('</head>',head+'\n</head>')
    .replace(/<div\s+id="root"\s*><\/div>/i,
      '<div id="root"><main style="max-width:1080px;margin:3rem auto;padding:1rem">'+
      '<h1>'+escapeHtml(item.title)+'</h1><p>'+description+'</p><nav>'+links+'</nav></main></div>');
  const file=item.path==='/'?resolve(dist,'index.html'):resolve(dist,item.path.slice(1),'index.html');
  mkdirSync(dirname(file),{recursive:true});
  writeFileSync(file,html);
}
if(site){
  writeFileSync(resolve(dist,'robots.txt'),
    'User-agent: *\nDisallow: /studio\nDisallow: /api/\nSitemap: '+site+'/sitemap.xml\n');
}
console.log('Prerendered '+seoRoutes.length+' public category/home pages.');
