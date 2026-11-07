import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowUpRight, Database, FolderOpen, Image, LayoutDashboard, LockKeyhole, LogOut, Package, FileUp, BookOpen } from 'lucide-react';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { getCmsClient } from '../lib/supabaseClient';
import { canPublishRole, type CmsMediaRow } from '../lib/cmsData';
import { cmsRole, cmsRoleHelp, cmsSignInError } from '../lib/cmsAuth';
import { ErrorText, Field, inputClass, primaryClass } from './studio/StudioShared';
import CmsMedia from './studio/CmsMedia';
import CmsProducts from './studio/CmsProducts';
import CmsHomepage from './studio/CmsHomepage';
import CmsCategories from './studio/CmsCategories';
import CmsImports from './studio/CmsImports';

type Section = 'dashboard' | 'products' | 'media' | 'homepage' | 'collections' | 'imports';
type CmsUser = { id:string;email:string;role:'owner'|'admin'|'editor' };
const sections: { id:Section;label:string;icon:React.ComponentType<{size?:number}> }[] = [
  {id:'dashboard',label:'Dashboard',icon:LayoutDashboard},
  {id:'products',label:'Products',icon:Package},
  {id:'collections',label:'Collections',icon:FolderOpen},
  {id:'imports',label:'Bulk imports',icon:FileUp},
  {id:'media',label:'Media',icon:Image},
  {id:'homepage',label:'Website CMS',icon:BookOpen},
];

export default function CmsStudio(){
  const client=getCmsClient();
  const [staff,setStaff]=useState<CmsUser|null>(null);
  const [checking,setChecking]=useState(true);
  const [authError,setAuthError]=useState<string|null>(null);
  const [unprovisionedEmail,setUnprovisionedEmail]=useState<string|null>(null);
  const [serviceStatus,setServiceStatus]=useState<{auth:boolean;catalogue:boolean;privateAccess:boolean}|null>(null);
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [signingIn,setSigningIn]=useState(false);
  const [section,setSection]=useState<Section>('dashboard');
  const [media,setMedia]=useState<CmsMediaRow[]>([]);
  const [mediaError,setMediaError]=useState<string|null>(null);
  const [stats,setStats]=useState<{published:number;drafts:number;assets:number}|null>(null);
  const canPublish=canPublishRole(staff?.role);

  const applyIdentity=(user:User|null)=>{
    const role=cmsRole(user?.app_metadata?.nb_role);
    if(user && role){
      setStaff({id:user.id,email:user.email||'',role});
      setUnprovisionedEmail(null);
      setAuthError(null);
    }else if(user){
      setStaff(null);
      setUnprovisionedEmail(user.email||'Signed-in account');
      setAuthError(cmsRoleHelp());
    }else{
      setStaff(null);
      setUnprovisionedEmail(null);
    }
  };

  useEffect(()=>{
    if(!client){setChecking(false);return;}
    let active=true;
    let eventVersion=0;
    const initialize=async()=>{
      // No session? Show the login form immediately, without a misleading
      // "verification failed" error or blocking an unauthenticated visitor.
      const currentVersion=eventVersion;
      try {
        const {data:local,error:sessionError}=await client.auth.getSession();
        if(!active||currentVersion!==eventVersion)return;
        if(sessionError)throw sessionError;
        if(!local.session){
          applyIdentity(null);
          setChecking(false);
          return;
        }
        const {data,error}=await client.auth.getUser();
        if(!active||currentVersion!==eventVersion)return;
        applyIdentity(error?null:data.user);
        if(error)setAuthError(cmsSignInError(error));
      }catch(error){
        if(!active||currentVersion!==eventVersion)return;
        applyIdentity(null);
        setAuthError(cmsSignInError(error));
      }finally{
        if(active&&currentVersion===eventVersion)setChecking(false);
      }
    };
    // Never await or invoke another auth method inside a Supabase auth listener:
    // that listener runs inside the SDK's session lock.
    const {data:{subscription}}=client.auth.onAuthStateChange((event,session)=>{
      if(!active||event==='INITIAL_SESSION')return;
      eventVersion++;
      applyIdentity(session?.user||null);
      setChecking(false);
    });
    void initialize();
    return()=>{active=false;subscription.unsubscribe()};
  },[client]);

  useEffect(()=>{
    if(!client)return;
    let active=true;
    const status=async()=>{
      try{
        const response=await fetch('/api/cms-status',{cache:'no-store',headers:{Accept:'application/json'}});
        const result=await response.json() as {auth?:{ok:boolean};catalogue?:{ok:boolean};privateAccess?:{ok:boolean}};
        if(active)setServiceStatus({auth:result.auth?.ok===true,catalogue:result.catalogue?.ok===true,privateAccess:result.privateAccess?.ok===true});
      }catch{
        if(active)setServiceStatus({auth:false,catalogue:false,privateAccess:false});
      }
    };
    void status();
    return()=>{active=false};
  },[client]);

  const loadMedia=async()=>{
    if(!client||!staff)return;
    const {data,error}=await client.from('nb_media')
      .select('id,storage_path,original_name,mime_type,size_bytes,alt_text,approved,uploaded_by,created_at')
      .order('created_at',{ascending:false}).limit(300);
    setMedia((data||[]) as CmsMediaRow[]);
    setMediaError(error?.message||null);
  };
  const refreshStats=async()=>{
    if(!client||!staff)return;
    const [published,drafts,assets]=await Promise.all([
      client.from('nb_products').select('id',{count:'exact',head:true}).eq('status','published'),
      client.from('nb_product_drafts').select('product_id',{count:'exact',head:true}),
      client.from('nb_media').select('id',{count:'exact',head:true}),
    ]);
    setStats({published:published.count||0,drafts:drafts.count||0,assets:assets.count||0});
  };
  useEffect(()=>{if(staff&&client){void loadMedia();void refreshStats();}},[staff?.id,client,section]);

  const login=async(event:React.FormEvent)=>{
    event.preventDefault();if(!client)return;
    setAuthError(null);setSigningIn(true);
    try{
      const {data,error}=await client.auth.signInWithPassword({email:email.trim(),password});
      if(error)throw error;
      if(!data.user)throw new Error('No session was returned');
      // Auth state events will also fire, but apply the returned role now so
      // users never mistake a successful login for a stalled submission.
      applyIdentity(data.user);
      setPassword('');
    }catch(cause){setAuthError(cmsSignInError(cause));}
    finally{setSigningIn(false)}
  };
  const logout=async()=>{
    if(!client)return;
    const {error}=await client.auth.signOut();
    if(error){setAuthError(cmsSignInError(error));return;}
    applyIdentity(null);
    setAuthError(null);
    setPassword('');
    setSection('dashboard');
  };
  const refreshPermissions=async()=>{
    if(!client)return;
    setChecking(true);setAuthError(null);
    try{
      const {data,error}=await client.auth.refreshSession();
      if(error)throw error;
      if(!data.user)throw new Error('No active session');
      applyIdentity(data.user);
    }catch(error){setAuthError(cmsSignInError(error))}
    finally{setChecking(false)}
  };

  return <div className="min-h-svh bg-[#f7f3ec] text-[#29221b]">
    <Helmet><title>Nomaan Brothers | Private Content Studio</title>
      <meta name="robots" content="noindex, nofollow, noarchive"/></Helmet>
    {!client?<div className="mx-auto flex min-h-svh max-w-xl flex-col items-center justify-center gap-5 px-6 text-center">
      <Database size={42} className="text-amber-800"/>
      <h1 className="font-serif text-4xl">CMS not connected</h1>
      <p className="text-sm leading-7 text-stone-600">Connect a dedicated Nomaan Brothers Supabase project using the VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY environment variables. Do not connect an unrelated business database.</p>
      <a href="/" className={primaryClass}>Return to storefront</a>
    </div>:checking?<div className="flex min-h-svh items-center justify-center text-sm" role="status">Verifying staff access…</div>:
      !staff?<div className="mx-auto flex min-h-svh max-w-xl flex-col justify-center gap-6 px-6 py-16">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#e6dccd]"><LockKeyhole size={30}/></div>
        <div className="text-center"><p className="text-xs font-bold uppercase tracking-[.24em] text-amber-800">Private access</p>
          <h1 className="mt-4 font-serif text-4xl">Nomaan Brothers Studio</h1>
          <p className="mt-4 text-sm leading-7 text-stone-600">Authorized staff only. Your account must be provisioned by the store owner in Supabase Auth.</p></div>
        {unprovisionedEmail ? <section className="space-y-4 rounded-xl border border-amber-300 bg-white p-7 shadow-sm" aria-label="CMS role required">
          <h2 className="font-serif text-2xl">Sign-in succeeded · Role needed</h2>
          <p className="text-sm leading-7 text-stone-700">Signed in as <strong>{unprovisionedEmail}</strong>. The account needs an authorized CMS role from the store owner; a Supabase Auth user alone cannot edit products.</p>
          <ErrorText message={authError}/>
          <p className="text-xs leading-6 text-stone-600">In the Noman Supabase project, set <code>app_metadata.nb_role</code> to <code>owner</code>, <code>admin</code>, or <code>editor</code>. Don't set <code>user_metadata</code>. Then refresh the session.</p>
          <button type="button" onClick={()=>void refreshPermissions()} className={primaryClass+' w-full'}>Refresh CMS permissions</button>
          <button type="button" onClick={()=>void logout()} className="w-full min-h-11 rounded-md border border-stone-300 text-sm font-semibold">Sign out / use another account</button>
        </section> : <form onSubmit={(event)=>void login(event)} className="space-y-5 rounded-xl border border-stone-200 bg-white p-7 shadow-sm">
          <Field label="Staff email"><input className={inputClass} type="email" autoComplete="username" value={email} required onChange={e=>setEmail(e.target.value)}/></Field>
          <Field label="Password"><input className={inputClass} type="password" autoComplete="current-password" value={password} required onChange={e=>setPassword(e.target.value)}/></Field>
          <button type="submit" disabled={signingIn} className={primaryClass+' w-full'}>{signingIn?'Signing in…':'Sign in securely'}</button>
          <ErrorText message={authError}/>
          <p className="text-xs text-stone-500">There is no public self-registration or demo PIN. Ask the owner to invite staff or reset credentials in the Supabase dashboard.</p>
        </form>}
        {serviceStatus && <div role="status" className="rounded-md border border-stone-200 bg-[#fffcf7] px-4 py-3 text-xs leading-6 text-stone-600">
          <p className="font-semibold text-stone-800">Connection checks</p>
          <p>Supabase Auth: {serviceStatus.auth?'reachable':'unavailable or unverified'}</p>
          <p>Published catalogue: {serviceStatus.catalogue?'database API reachable':'migrations or API permissions need checking'}</p>
          <p>Private CMS records: {serviceStatus.privateAccess?'not anonymously accessible':'permission checks need review'}</p>
          {(!serviceStatus.auth||!serviceStatus.catalogue||!serviceStatus.privateAccess)&&<p>These checks never test your password or CMS role. Review the linked project's Auth and SQL setup before publishing.</p>}
        </div>}
        <a href="/" className="text-center text-xs font-semibold text-stone-600">Return to public site <ArrowUpRight size={13} className="inline"/></a>
      </div>:
      <div className="min-h-svh lg:grid lg:grid-cols-[245px_1fr]">
        <aside className="bg-[#231d17] px-5 py-7 text-[#f0e6d6] lg:min-h-svh">
          <h1 className="font-serif text-2xl">Nomaan <em>Brothers</em></h1>
          <p className="mt-2 text-[10px] uppercase tracking-[.2em] text-[#d2b78d]">Content Studio</p>
          <nav className="mt-9 flex flex-wrap gap-2 lg:flex-col" aria-label="Studio sections">
            {sections.map((item)=>{const Icon=item.icon;return <button type="button" key={item.id}
              aria-current={section===item.id?'page':undefined} onClick={()=>setSection(item.id)}
              className={'flex min-h-11 items-center gap-3 rounded-md px-4 py-2.5 text-left text-sm '+
                (section===item.id?'bg-[#d8bd93] font-semibold text-[#221c17]':'text-[#e2d4c3] hover:bg-[#3c3025]')}>
              <Icon size={17}/>{item.label}</button>})}
          </nav>
          <div className="mt-9 space-y-3 border-t border-[#66513b] pt-6 text-xs text-[#cfbea8]">
            <p className="truncate font-semibold" title={staff.email}>{staff.email}</p>
            <p className="uppercase tracking-wide">Role: {staff.role}</p>
            <a className="flex min-h-11 items-center gap-2 hover:text-white" href="/" target="_blank" rel="noopener noreferrer">Open storefront <ArrowUpRight size={15}/></a>
            <button type="button" className="flex min-h-11 items-center gap-2 text-[#f0e3d2] hover:text-white" onClick={()=>void logout()}><LogOut size={16}/> Sign out</button>
          </div>
        </aside>
        <main className="min-w-0 px-5 py-8 md:px-10 md:py-12 xl:px-14">
          <div className="mx-auto max-w-7xl space-y-8">
            {mediaError&&<ErrorText message={mediaError}/>}
            {section==='dashboard'&&<section className="space-y-8">
              <div><p className="text-xs font-bold uppercase tracking-[.22em] text-amber-800">Store operations</p>
                <h2 className="mt-3 font-serif text-4xl">Your collection, organized.</h2>
                <p className="mt-3 text-sm text-stone-600">Manage accurate product content and prepare campaigns for publication.</p></div>
              <div className="grid gap-4 sm:grid-cols-3">
                {[['Published garments',stats?.published],['Saved product drafts',stats?.drafts],['Uploaded assets',stats?.assets]].map(([label,count])=>
                  <div key={label} className="rounded-lg border border-stone-200 bg-white p-6">
                    <p className="text-xs font-semibold text-stone-500">{label}</p>
                    <p className="mt-4 font-serif text-4xl">{count??'—'}</p>
                  </div>)}
              </div>
              <section className="rounded-xl border border-[#e0d3bd] bg-white p-6 md:p-8" aria-labelledby="cms-getting-started">
                <div><p className="text-[11px] font-semibold uppercase tracking-[.2em] text-amber-800">Your store-manager guide</p>
                  <h3 id="cms-getting-started" className="mt-2 font-serif text-2xl">How to use your dashboard</h3>
                  <p className="mt-2 text-sm leading-7 text-stone-600">Use the steps below in order. Draft changes stay private until published.</p>
                </div>
                <ol className="mt-6 grid gap-4 md:grid-cols-2">
                  {[
                    {id:'collections' as Section,title:'Review your collections',detail:"Choose Men’s or Kids’ collections. Update names, descriptions, order and approved banners."},
                    {id:'media' as Section,title:'Upload photos and videos',detail:'Upload approved garment photos or videos. Add a display name and alt text, then approve each asset before using it.'},
                    {id:'products' as Section,title:'Create a product',detail:'Enter a unique SKU, title, slug, size, fabric and collection. Select approved photos, save a draft, and publish.'},
                    {id:'imports' as Section,title:'Bulk import many garments',detail:'Fill in the sample CSV, review validation, import drafts, upload SKU-named photos, approve them and auto-match by SKU.'},
                    {id:'homepage' as Section,title:'Edit your website',detail:'Change homepage sections, cards, navigation, footer and page text. Reorder sections and save a draft before publishing.'},
                    {id:'products' as Section,title:'Verify live changes',detail:'Open the website and check your published garments, images and descriptions. Edit or archive when necessary.'},
                  ].map((item,index)=><li key={index} className="rounded-lg border border-[#eee5d8] p-4">
                    <div className="flex items-start gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#29221b] text-xs font-semibold text-white">{index+1}</span>
                      <div><h4 className="text-sm font-semibold">{item.title}</h4>
                        <p className="mt-2 text-xs leading-6 text-stone-600">{item.detail}</p>
                        <button type="button" onClick={()=>setSection(item.id)} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-amber-800 underline underline-offset-4">
                          Open {item.id==='homepage'?'Website CMS':item.id==='imports'?'Bulk imports':item.id} <ArrowUpRight size={13}/>
                        </button>
                      </div>
                    </div>
                  </li>)}
                </ol>
                <p className="mt-5 border-t border-stone-200 pt-4 text-xs leading-6 text-stone-600">Editors prepare drafts and upload files. Admins approve media, publish, archive garments and hide collections. Never upload photos without permission.</p>
              </section>
              <div className="rounded-lg border border-[#e6d8bd] bg-[#fff8e9] p-6 text-sm leading-7 text-stone-700">
                <p className="font-semibold">Publishing permissions</p>
                <p className="mt-2">Editors may save drafts and upload media. Only owners and admins can approve assets and publish changes. Public visitors can read only published catalogue content.</p>
              </div>
            </section>}
            {section==='media'&&<CmsMedia client={client} userId={staff.id} canPublish={canPublish} onMediaChange={()=>void loadMedia()}/>}
            {section==='imports'&&<CmsImports client={client} userId={staff.id} onMediaChange={()=>void loadMedia()}/>}
            {section==='products'&&<CmsProducts client={client} userId={staff.id} canPublish={canPublish} media={media}/>}
            {section==='homepage'&&<CmsHomepage client={client} userId={staff.id} canPublish={canPublish} media={media}/>}
            {section==='collections'&&<CmsCategories client={client} canPublish={canPublish} media={media}/>}
          </div>
        </main>
      </div>}
  </div>;
}
