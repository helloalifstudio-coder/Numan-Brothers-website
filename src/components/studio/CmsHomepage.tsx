import React, { useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { type CmsHome, type CmsMediaRow, HOME_TEMPLATE, cleanHome } from '../../lib/cmsData';
import { AssetPicker, ErrorText, Field, inputClass, outlineClass, primaryClass } from './StudioShared';

interface Props {client:SupabaseClient; userId:string; canPublish:boolean; media:CmsMediaRow[];}
export default function CmsHomepage({client,userId,canPublish,media}:Props) {
  const [form,setForm]=useState<CmsHome>(HOME_TEMPLATE);
  const [version,setVersion]=useState<number|null>(null);
  const [history,setHistory]=useState<{id:number;version:number;published_at:string}[]>([]);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState<string|null>(null);
  const [error,setError]=useState<string|null>(null);
  useEffect(()=>{
    let active=true;
    const load=async()=>{
      const [draft,published,revisions] = await Promise.all([
        client.from('nb_home_drafts').select('content').eq('key','home').maybeSingle(),
        client.from('nb_home_public').select('content,version').eq('key','home').maybeSingle(),
        client.from('nb_home_revisions').select('id,version,published_at').eq('key','home')
          .order('version',{ascending:false}).limit(15),
      ]);
      if(!active)return;
      setError(draft.error?.message || published.error?.message || revisions.error?.message || null);
      setHistory((revisions.data||[]) as {id:number;version:number;published_at:string}[]);
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
      if(form.contactWhatsapp && !/^[1-9][0-9]{9,14}$/.test(form.contactWhatsapp))throw new Error('WhatsApp must be a verified international number (10–15 digits, including country code).');
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
    const latest=await client.from('nb_home_revisions')
      .select('id,version,published_at').eq('key','home').order('version',{ascending:false}).limit(15);
    if(latest.error)setError(latest.error.message);
    else setHistory((latest.data||[]) as {id:number;version:number;published_at:string}[]);
    setMessage('Homepage version '+data+' is now published. Reload the public site to see it.');
  };
  const assets = (key:keyof CmsHome,label:string)=><AssetPicker client={client} label={label} media={media}
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
        <div className="md:col-span-2 border-t border-stone-200 pt-6"><h3 className="font-serif text-2xl">Contact information</h3>
          <p className="mt-2 text-xs leading-6 text-stone-600">Add the verified business WhatsApp number only after the shop owner approves it. Leave blank to hide all WhatsApp buttons.</p></div>
        <div className="md:col-span-2"><Field label="Verified WhatsApp number including country code (digits only, e.g. 91XXXXXXXXXX)">
          <input type="tel" className={inputClass} maxLength={15} value={form.contactWhatsapp}
            onChange={e=>update('contactWhatsapp',e.target.value.replace(/[^0-9]/g,''))} placeholder="Not published"/>
        </Field></div>
      </div>
      <section className="space-y-3 rounded-lg border border-[#ded0bc] bg-[#faf7f0] p-5" aria-labelledby="homepage-versions-title">
        <h3 id="homepage-versions-title" className="font-serif text-xl">Published homepage versions</h3>
        <p className="text-xs leading-6 text-stone-600">Draft edits are private. Publishing creates an immutable, numbered snapshot and changes what public visitors see.</p>
        {history.length===0 ? <p className="text-xs text-stone-500">No published homepage revisions yet.</p> :
          <ol className="space-y-2">
            {history.map(item=><li key={item.id} className="flex flex-wrap justify-between gap-2 border-b border-[#e8dccb] py-2 text-xs">
              <span className="font-semibold text-[#5a4533]">Version {item.version}</span>
              <time dateTime={item.published_at} className="text-[#756958]">
                {new Date(item.published_at).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'})}
              </time>
            </li>)}
          </ol>}
      </section>
      <div className="flex flex-wrap gap-3">
        <button type="button" className={outlineClass} disabled={saving} onClick={()=>void save()}>Save draft</button>
        {canPublish&&<button type="button" className={primaryClass} disabled={saving} onClick={()=>void publish()}>Publish homepage</button>}
      </div>
      {message&&<p role="status" className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">{message}</p>}
      <ErrorText message={error}/>
    </>}
  </section>;
}
