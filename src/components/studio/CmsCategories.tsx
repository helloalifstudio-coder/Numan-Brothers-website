import React, { useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { type CmsCategoryRow, type CmsMediaRow } from '../../lib/cmsData';
import { AssetPicker, ErrorText, Field, inputClass, primaryClass } from './StudioShared';

interface Props {client:SupabaseClient;canPublish:boolean;media:CmsMediaRow[];}
export default function CmsCategories({client,canPublish,media}:Props) {
  const [rows,setRows]=useState<CmsCategoryRow[]>([]);
  const [selected,setSelected]=useState<CmsCategoryRow|null>(null);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState<string|null>(null);
  const [error,setError]=useState<string|null>(null);
  const load=async()=>{
    const {data,error}=await client.from('nb_categories')
      .select('path,department,label,description,image_url,active,sort_order')
      .order('sort_order',{ascending:true});
    setRows((data||[]) as CmsCategoryRow[]);
    setError(error?.message||null);setLoading(false);
  };
  useEffect(()=>{void load()},[client]);
  const save=async()=>{
    if(!canPublish||!selected)return;
    setSaving(true);setError(null);setMessage(null);
    const {error}=await client.from('nb_categories')
      .update({description:selected.description,image_url:selected.image_url})
      .eq('path',selected.path);
    if(error)setError(error.message);else{setMessage('Collection details updated.');await load();}
    setSaving(false);
  };
  return <section className="space-y-7">
    <div><h2 className="font-serif text-3xl">Collection pages</h2>
      <p className="mt-2 max-w-3xl text-sm text-stone-600">The approved Men's Wear and Kids Wear taxonomy is fixed so routes cannot accidentally break. Owners can update collection descriptions and artwork here.</p></div>
    {loading?<p className="text-sm">Loading categories…</p>:
      <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
        <div className="max-h-[650px] space-y-1 overflow-y-auto rounded-lg border border-stone-200 bg-white p-3">
          {rows.map((row)=><button type="button" key={row.path} onClick={()=>{setSelected({...row});setError(null);setMessage(null)}}
            className={'block w-full rounded-md px-3 py-3 text-left text-sm '+
              (selected?.path===row.path?'bg-stone-900 text-white':'hover:bg-stone-100')}>
            {row.label}<span className={'mt-1 block text-xs '+(selected?.path===row.path?'text-stone-300':'text-stone-500')}>{row.path}</span>
          </button>)}
        </div>
        <div className="space-y-5 rounded-lg border border-stone-200 bg-white p-5">
          {!selected?<p className="text-sm text-stone-600">Select a collection to edit its presentation.</p>:<>
            <h3 className="font-serif text-2xl">{selected.label}</h3>
            <p className="text-xs text-stone-500">{selected.path}</p>
            <Field label="Collection description"><textarea rows={4} className={inputClass} value={selected.description}
              disabled={!canPublish} onChange={(e)=>setSelected({...selected,description:e.target.value})}/></Field>
            <AssetPicker client={client} label="Category banner image" media={media}
              selected={selected.image_url?[selected.image_url]:[]}
              onChange={(urls)=>setSelected({...selected,image_url:urls[0]||null})}/>
            {canPublish?<button type="button" className={primaryClass} disabled={saving} onClick={()=>void save()}>
              Save collection presentation</button>:
              <p className="text-xs text-stone-500">Only a publisher may update live collection pages.</p>}
            {message&&<p role="status" className="text-sm text-emerald-700">{message}</p>}
            <ErrorText message={error}/>
          </>}
        </div>
      </div>}
  </section>;
}
