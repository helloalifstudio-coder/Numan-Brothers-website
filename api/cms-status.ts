/**
 * Read-only Supabase commissioning checks. Only public browser-safe settings
 * are used, and no Auth user data, session, key, or table rows are returned.
 *
 * This cannot certify actual staff sign-in, Storage authorization, or function
 * deployment. Confirm those separately with genuine owner/editor sessions.
 */
const url=process.env.VITE_SUPABASE_URL?.trim()||'';
const key=process.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()||'';
type Check = {ok:boolean};
type Kind = 'public'|'restricted'|'published';

async function probe(path:string,kind:Kind):Promise<Check>{
  try{
    const response=await fetch(url+path,{
      method:'GET',
      headers:{apikey:key,Accept:'application/json'},
      signal:AbortSignal.timeout(7000),
      redirect:'error',
      cache:'no-store',
    });
    if(kind==='restricted')return {ok:response.status===401||response.status===403};
    if(!response.ok)return {ok:false};
    const value=await response.json() as unknown;
    if(!Array.isArray(value))return {ok:false};
    if(kind==='published')return {ok:value.every(row=>
      row && typeof row==='object' && (row as {status?:unknown}).status==='published')};
    return {ok:true};
  }catch{return {ok:false}}
}

export default {
  async fetch(request:Request):Promise<Response>{
    if(request.method!=='GET')return new Response('Method not allowed',{status:405});
    const headers={
      'Content-Type':'application/json; charset=utf-8',
      'Cache-Control':'no-store, max-age=0',
      'X-Robots-Tag':'noindex, nofollow',
      'X-Content-Type-Options':'nosniff',
    };
    if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)||
       !/^sb_publishable_[A-Za-z0-9_-]{12,}$/.test(key))
      return new Response(JSON.stringify({configured:false,auth:{ok:false},catalogue:{ok:false},privateAccess:{ok:false}}),{
        status:503,headers,
      });

    // An Auth health response does not verify passwords or CMS role claims.
    const health=await (async()=>{
      try{
        const response=await fetch(url+'/auth/v1/health',{
          method:'GET',
          headers:{apikey:key,Accept:'application/json'},
          signal:AbortSignal.timeout(7000),
          redirect:'error',
          cache:'no-store',
        });
        return {ok:response.ok};
      }catch{return {ok:false}}
    })();

    const [categories,products,homepage,drafts,media,revisions]=await Promise.all([
      probe('/rest/v1/nb_categories?select=path&limit=1','public'),
      probe('/rest/v1/nb_products?select=id,status&limit=3','published'),
      probe('/rest/v1/nb_home_public?select=key&limit=1','public'),
      probe('/rest/v1/nb_product_drafts?select=product_id&limit=1','restricted'),
      probe('/rest/v1/nb_media?select=id&limit=1','restricted'),
      probe('/rest/v1/nb_product_revisions?select=id&limit=1','restricted'),
    ]);
    return new Response(JSON.stringify({
      configured:true,
      auth:health,
      catalogue:{ok:categories.ok&&products.ok&&homepage.ok},
      privateAccess:{ok:drafts.ok&&media.ok&&revisions.ok},
      checks:{
        categories:categories.ok,
        products:products.ok,
        homepage:homepage.ok,
        draftsPrivate:drafts.ok,
        mediaPrivate:media.ok,
        revisionsPrivate:revisions.ok,
      },
    }),{status:200,headers});
  },
};
