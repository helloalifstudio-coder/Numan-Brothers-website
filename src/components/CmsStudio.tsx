import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowUpRight, Database, FolderOpen, Image, LayoutDashboard, LockKeyhole, LogOut, Package } from 'lucide-react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getCmsClient } from '../lib/supabaseClient';
import { allowedCmsRole, canPublishRole, type CmsMediaRow } from '../lib/cmsData';
import { ErrorText, Field, inputClass, primaryClass } from './studio/StudioShared';
import CmsMedia from './studio/CmsMedia';
import CmsProducts from './studio/CmsProducts';
import CmsHomepage from './studio/CmsHomepage';
import CmsCategories from './studio/CmsCategories';

type Section = 'dashboard' | 'products' | 'media' | 'homepage' | 'collections';
type CmsUser = { id:string;email:string;role:'owner'|'admin'|'editor' };
const sections: { id:Section;label:string;icon:React.ComponentType<{size?:number}> }[] = [
  {id:'dashboard',label:'Dashboard',icon:LayoutDashboard},
  {id:'products',label:'Products',icon:Package},
  {id:'media',label:'Media',icon:Image},
  {id:'homepage',label:'Homepage',icon:LayoutDashboard},
  {id:'collections',label:'Collections',icon:FolderOpen},
];

export default function CmsStudio(){
  const client=getCmsClient();
  const [staff,setStaff]=useState<CmsUser|null>(null);
  const [checking,setChecking]=useState(true);
  const [authError,setAuthError]=useState<string|null>(null);
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [signingIn,setSigningIn]=useState(false);
  const [section,setSection]=useState<Section>('dashboard');
  const [media,setMedia]=useState<CmsMediaRow[]>([]);
  const [mediaError,setMediaError]=useState<string|null>(null);
  const [stats,setStats]=useState<{published:number;drafts:number;assets:number}|null>(null);
  const canPublish=canPublishRole(staff?.role);

  useEffect(()=>{
    if(!client){setChecking(false);return;}
    let active=true;
    const fetchIdentity=async()=>{
      const {data,error}=await client.auth.getUser();
      if(!active)return;
      const user=data.user;
      const role=user?.app_metadata?.nb_role;
      if(user && allowedCmsRole(role)){
        setStaff({id:user.id,email:user.email||'',role});
        setAuthError(null);
      }else{
        setStaff(null);
        if(user && !error)setAuthError('This account is signed in but does not have an approved CMS role. Ask the owner to provision access.');
      }
      setChecking(false);
    };
    void fetchIdentity();
    const {data:{subscription}}=client.auth.onAuthStateChange(()=>{void fetchIdentity()});
    return()=>{active=false;subscription.unsubscribe()};
  },[client]);

  const loadMedia=async()=>{
    if(!client||!staff)return;
    const {data,error}=await client.from('nb_media')
      .select('id,storage_path,original_name,mime_type,size_bytes,alt_text,approved,created_at')
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
      const {error}=await client.auth.signInWithPassword({email:email.trim(),password});
      if(error)throw error;
      setPassword('');
    }catch(cause){setAuthError(cause instanceof Error?cause.message:'Unable to sign in.');}
    finally{setSigningIn(false)}
  };
  const logout=async()=>{if(!client)return;await client.auth.signOut();setStaff(null);setPassword('');setSection('dashboard')};

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
        <form onSubmit={(event)=>void login(event)} className="space-y-5 rounded-xl border border-stone-200 bg-white p-7 shadow-sm">
          <Field label="Staff email"><input className={inputClass} type="email" autoComplete="username" value={email} required onChange={e=>setEmail(e.target.value)}/></Field>
          <Field label="Password"><input className={inputClass} type="password" autoComplete="current-password" value={password} required onChange={e=>setPassword(e.target.value)}/></Field>
          <button type="submit" disabled={signingIn} className={primaryClass+' w-full'}>{signingIn?'Signing in…':'Sign in securely'}</button>
          <ErrorText message={authError}/>
          <p className="text-xs text-stone-500">There is no public self-registration or demo PIN. Ask the owner to invite staff or reset credentials in the Supabase dashboard.</p>
        </form>
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
              <div className="rounded-lg border border-[#e6d8bd] bg-[#fff8e9] p-6 text-sm leading-7 text-stone-700">
                <p className="font-semibold">Publishing permissions</p>
                <p className="mt-2">Editors may save drafts and upload media. Only owners and admins can approve assets and publish changes. Public visitors can read only published catalogue content.</p>
              </div>
            </section>}
            {section==='media'&&<CmsMedia client={client} userId={staff.id} canPublish={canPublish} onMediaChange={()=>void loadMedia()}/>}
            {section==='products'&&<CmsProducts client={client} userId={staff.id} canPublish={canPublish} media={media}/>}
            {section==='homepage'&&<CmsHomepage client={client} userId={staff.id} canPublish={canPublish} media={media}/>}
            {section==='collections'&&<CmsCategories client={client} canPublish={canPublish} media={media}/>}
          </div>
        </main>
      </div>}
  </div>;
}
