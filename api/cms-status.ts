/**
 * Read-only service checks for Noman Brothers review deployments.
 *
 * Uses ONLY the browser-safe Supabase publishable key; does not access user
 * sessions, Auth admin APIs, secrets or any draft/private content.
 * This endpoint intentionally returns only booleans, not response payloads.
 */
const url=process.env.VITE_SUPABASE_URL?.trim()||'';
const key=process.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()||'';

async function testPublicEndpoint(path:string):Promise<{ok:boolean}>{
  try{
    const response=await fetch(url+path,{
      method:'GET',
      headers:{apikey:key,Accept:'application/json'},
      signal:AbortSignal.timeout(7000),
      redirect:'error',
      cache:'no-store',
    });
    return {ok:response.ok};
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
      return new Response(JSON.stringify({configured:false,auth:{ok:false},catalogue:{ok:false}}),{
        status:503,headers,
      });
    // Auth health is not a substitute for attempting a real user login;
    // the public read-model probe shows whether migrations/API are usable.
    const [auth,catalogue]=await Promise.all([
      testPublicEndpoint('/auth/v1/health'),
      testPublicEndpoint('/rest/v1/nb_categories?select=path&limit=1'),
    ]);
    return new Response(JSON.stringify({configured:true,auth,catalogue}),{
      status:200,headers,
    });
  },
};
