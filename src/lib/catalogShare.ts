/** Only public canonical pages and approved HTTPS photographs may be forwarded. */
export const absoluteStoreUrl=(path:string,origin:string):string=>{
  const safe=/^\/(?:products\/[a-z0-9-]+|men(?:\/[a-z0-9-]+)*|kids(?:\/[a-z0-9-]+)*)$/.test(path);
  if(!safe)throw new Error('Unsupported catalogue path');
  const url=new URL(origin);
  if(url.protocol!=='https:' && !['localhost','127.0.0.1'].includes(url.hostname))
    throw new Error('A secure store URL is required');
  return url.origin+path;
};
export const whatsappShareUrl=(title:string,path:string,origin:string,photos:string[]=[]):string=>{
  const url=absoluteStoreUrl(path,origin);
  const images=[...new Set(photos)].filter(x=>{
    try {const u=new URL(x);return u.protocol==='https:'&&!u.username&&!u.password;}catch{return false}
  }).slice(0,4);
  const text=title.slice(0,160)+' — Nomaan Brothers\nBrowse the full collection / gallery: '+url+
    (images.length?'\nGarment photographs:\n'+images.join('\n'):'');
  return 'https://api.whatsapp.com/send?text='+encodeURIComponent(text);
};
