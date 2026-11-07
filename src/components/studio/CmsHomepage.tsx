import React, { useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { type CmsHome, type CmsMediaRow, HOME_TEMPLATE, cleanHome } from '../../lib/cmsData';
import { AssetPicker, ErrorText, Field, inputClass, outlineClass, primaryClass } from './StudioShared';

interface Props {client:SupabaseClient; userId:string; canPublish:boolean; media:CmsMediaRow[];}
export default function CmsHomepage({client,userId,canPublish,media}:Props) {
  const [form,setForm]=useState<CmsHome>(HOME_TEMPLATE);
  const [version,setVersion]=useState<number|null>(null);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState<string|null>(null);
  const [error,setError]=useState<string|null>(null);
  useEffect(()=>{
    let active=true;
    const load=async()=>{
      const [draft,published] = await Promise.all([
        client.from('nb_home_drafts').select('content').eq('key','home').maybeSingle(),
        client.from('nb_home_public').select('content,version').eq('key','home').maybeSingle(),
      ]);
      if(!active)return;
      setError(draft.error?.message || published.error?.message || null);
      setForm(cleanHome(draft.data?.content ?? published.data?.content));
      setVersion(typeof published.data?.version==='number'?published.data.version:null);
      setLoading(false);
    };
    void load();return()=>{active=false};
  },[client]);
  const update=(key:keyof CmsHome,value:string)=>setForm((current)=>({...current,[key]:value}));
  const save=async():Promise<boolean>=>{
    setSaving(true);setError(null);setMessage(null);
    try {
      if(form.heroTitle.trim().length<4)throw new Error('Hero headline must have at least four characters.');
      const {error}=await client.from('nb_home_drafts').upsert({
        key:'home', content:form,updated_by:userId,
      },{onConflict:'key'});
      if(error)throw error;
      setMessage('Draft saved. Visitors are still seeing the last published version.');
      return true;
    }catch(e){setError(e instanceof Error?e.message:'Unable to save the draft.');return false}
    finally{setSaving(false)}
  };
  const publish=async()=>{
    if(!canPublish)return;
    if(!await save())return;
    setSaving(true);
    const {data,error}=await client.rpc('nb_publish_home');
    setSaving(false);
    if(error){setError(error.message);return;}
    setVersion(Number(data));
    setMessage('Homepage version '+data+' is now published. Reload the public site to see it.');
  };
  const assets = (key:keyof CmsHome,label:string)=><AssetPicker label={label} media={media}
    selected={form[key]?[form[key]]:[]} onChange={(urls)=>update(key,urls[0]||'')}/>;

  return <section className="max-w-5xl space-y-7">
    <div><h2 className="font-serif text-3xl">Homepage editor</h2>
      <p className="mt-2 text-sm text-stone-600">Edit the main campaign and imagery without changing source code. Saving a draft will not replace the live version.</p>
      <p className="mt-2 text-xs font-semibold text-amber-800">Current published version: {version ?? 'None yet'}</p>
    </div>
    {loading?<p className="text-sm">Loading homepage content…</p>:<>
      <div className="grid gap-5 rounded-lg border border-stone-200 bg-white p-5 md:grid-cols-2 md:p-7">
        <div className="md:col-span-2"><h3 className="font-serif text-2xl">Main hero</h3></div>
        <Field label="Headline"><input className={inputClass} value={form.heroTitle} maxLength={180} onChange={e=>update('heroTitle',e.target.value)}/></Field>
        <Field label="Eyebrow label"><input className={inputClass} value={form.heroEyebrow} maxLength={100} onChange={e=>update('heroEyebrow',e.target.value)}/></Field>
        <div className="md:col-span-2"><Field label="Introduction"><textarea rows={3} className={inputClass} value={form.heroSubtitle} onChange={e=>update('heroSubtitle',e.target.value)}/></Field></div>
        <div className="md:col-span-2">{assets('heroImage','Hero background photograph')}</div>
        <div className="md:col-span-2 border-t border-stone-200 pt-6"><h3 className="font-serif text-2xl">Department cover images</h3></div>
        <div>{assets('menImage',"Men's Wear photograph")}</div>
        <div>{assets('kidsImage',"Kids Wear photograph")}</div>
        <div className="md:col-span-2 border-t border-stone-200 pt-6"><h3 className="font-serif text-2xl">Story section</h3></div>
        <Field label="Section heading"><input className={inputClass} value={form.storyTitle} onChange={e=>update('storyTitle',e.target.value)} maxLength={180}/></Field>
        <div className="md:col-span-2"><Field label="Short story"><textarea rows={4} className={inputClass} value={form.storyDescription} onChange={e=>update('storyDescription',e.target.value)}/></Field></div>
        <div className="md:col-span-2">{assets('storyImage','Story photograph')}</div>
      </div>
      <div className="flex flex-wrap gap-3">
        <button type="button" className={outlineClass} disabled={saving} onClick={()=>void save()}>Save draft</button>
        {canPublish&&<button type="button" className={primaryClass} disabled={saving} onClick={()=>void publish()}>Publish homepage</button>}
      </div>
      {message&&<p role="status" className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">{message}</p>}
      <ErrorText message={error}/>
    </>}
  </section>;
}
