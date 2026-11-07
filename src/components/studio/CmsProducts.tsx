import React, { useEffect, useMemo, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ArrowLeft, ArrowRight, Plus, Save, Send } from 'lucide-react';
import { type CmsProductRow, type CmsMediaRow, isSafeHttps, mediaPublicUrl } from '../../lib/cmsData';
import { COLLECTION_ROUTES } from '../../storefront/navigation';
import { AssetPicker, ErrorText, Field, inputClass, outlineClass, primaryClass } from './StudioShared';

interface Props {client:SupabaseClient;userId:string;canPublish:boolean;media:CmsMediaRow[];}
interface Draft {
  sku:string;slug:string;title:string;department:'men'|'kids';categoryPaths:string[];
  description:string;fabric:string;sizes:string[];imageUrls:string[];videoUrl:string;
  price:string;sortRank:number;
}
type DraftRow={product_id:string;content:unknown;updated_at:string};
type Entry={id:string;label:string;live:boolean;draft:boolean;form:Draft};
const blank: Draft = {
  sku:'',slug:'',title:'',department:'men',categoryPaths:[],description:'',
  fabric:'',sizes:[],imageUrls:[],videoUrl:'',price:'',sortRank:0,
};
const fromPublished=(p:CmsProductRow):Draft=>({
  sku:p.sku,slug:p.slug,title:p.title,department:p.department,
  categoryPaths:p.category_paths||[],description:p.description||'',fabric:p.fabric||'',
  sizes:p.sizes||[],imageUrls:p.image_urls||[],videoUrl:p.video_url||'',
  price:p.price===null?'':String(p.price),sortRank:p.sort_rank||0,
});
const fromUnknown=(value:unknown):Draft=>{
  const d=(value && typeof value==='object' && !Array.isArray(value)?value:{}) as Partial<Draft>;
  return {
    ...blank,...d,
    department:d.department==='kids'?'kids':'men',
    categoryPaths:Array.isArray(d.categoryPaths)?d.categoryPaths.filter((x):x is string=>typeof x==='string'):[],
    imageUrls:Array.isArray(d.imageUrls)?d.imageUrls.filter((x):x is string=>typeof x==='string'):[],
    sizes:Array.isArray(d.sizes)?d.sizes.filter((x):x is string=>typeof x==='string'):[],
    price:typeof d.price==='string'?d.price:'',
    sortRank:typeof d.sortRank==='number'?d.sortRank:0,
  };
};
function validate(form:Draft):string|null {
  if(form.title.trim().length<2)return 'Enter a product name.';
  if(form.sku.trim().length<2)return 'SKU must contain at least two characters.';
  if(!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(form.slug))return 'Slug must use lowercase letters, digits and hyphens.';
  if(!form.categoryPaths.length)return 'Choose at least one collection before publishing.';
  if(!form.imageUrls.length)return 'Choose at least one approved product photograph.';
  if(form.videoUrl && !isSafeHttps(form.videoUrl))return 'The optional video link must use HTTPS.';
  if(form.price && (!Number.isFinite(Number(form.price))||Number(form.price)<0))return 'Enter a valid price or leave the price empty.';
  return null;
}
export default function CmsProducts({client,userId,canPublish,media}:Props){
  const [rows,setRows]=useState<Entry[]>([]);
  const [loading,setLoading]=useState(true);
  const [page,setPage]=useState(0);
  const [id,setId]=useState<string|null>(null);
  const [form,setForm]=useState<Draft>(blank);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [message,setMessage]=useState<string|null>(null);
  const [totalCount,setTotalCount]=useState(0);
  const [search,setSearch]=useState('');
  const [statusFilter,setStatusFilter]=useState('all');
  const [departmentFilter,setDepartmentFilter]=useState('all');
  const active=rows.find((r)=>r.id===id);
  const categories=COLLECTION_ROUTES.filter((c)=>!c.isDepartment && !c.isGroup && c.department===form.department);
  const approvedImages=media.filter((m)=>m.approved && m.mime_type.startsWith('image/'));
  const approvedVideos=media.filter((m)=>m.approved && m.mime_type.startsWith('video/'));
  const load=async()=>{
    setLoading(true);setError(null);
    let query=client.from('nb_studio_product_index')
      .select('id,title,sku,department,status,has_draft,updated_at',{count:'exact'});
    const term=search.replace(/[^a-zA-Z0-9 -]/g,' ').trim().slice(0,72);
    if(term)query=query.or('title.ilike.%'+term+'%,sku.ilike.%'+term+'%');
    if(statusFilter!=='all')query=query.eq('status',statusFilter);
    if(departmentFilter!=='all')query=query.eq('department',departmentFilter);
    const {data,count,error}=await query.order('updated_at',{ascending:false})
      .order('id',{ascending:true}).range(page*50,page*50+49);
    if(error)setError(error.message);
    setRows((data||[]).map(item=>({
      id:item.id as string,label:item.title as string,live:item.status==='published',
      draft:Boolean(item.has_draft),form:{...blank},
    })));
    setTotalCount(count||0);
    setLoading(false);
  };
  useEffect(()=>{
    const timer=setTimeout(()=>{void load()},250);
    return()=>clearTimeout(timer);
  },[page,client,search,statusFilter,departmentFilter]);
  const open=async(entry:Entry)=>{
    setId(entry.id);setError(null);setMessage(null);setBusy(true);
    const [draft,published]=await Promise.all([
      client.from('nb_product_drafts').select('content').eq('product_id',entry.id).maybeSingle(),
      client.from('nb_products')
        .select('id,sku,slug,title,department,category_paths,description,fabric,sizes,image_urls,video_url,price,status,sort_rank,created_at,updated_at')
        .eq('id',entry.id).maybeSingle(),
    ]);
    if(draft.error||published.error)setError(draft.error?.message||published.error?.message||'Cannot open product');
    else setForm(draft.data?fromUnknown(draft.data.content):
      published.data?fromPublished(published.data as CmsProductRow):{...blank});
    setBusy(false);
  };
  const update=<K extends keyof Draft>(key:K,value:Draft[K])=>setForm((current)=>({...current,[key]:value}));
  const create=()=>{setId(crypto.randomUUID());setForm({...blank});setError(null);setMessage(null)};
  const save=async():Promise<boolean>=>{
    if(!id)return false;
    setBusy(true);setError(null);setMessage(null);
    try{
      if(form.title.trim().length<2||form.sku.trim().length<2)throw new Error('Product title and SKU are required.');
      if(!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(form.slug))throw new Error('Use a lowercase hyphenated slug.');
      const {error}=await client.from('nb_product_drafts').upsert({
        product_id:id,content:form,updated_by:userId,
      },{onConflict:'product_id'});
      if(error)throw error;
      setMessage('Draft saved privately. This change is not visible to customers.');
      await load();return true;
    }catch(cause){setError(cause instanceof Error?cause.message:'Draft save failed.');return false}
    finally{setBusy(false)}
  };
  const publish=async()=>{
    if(!id||!canPublish)return;
    const err=validate(form);
    if(err){setError(err);return;}
    if(form.imageUrls.some((url)=>!approvedImages.some((m)=>{
      const stored=mediaPublicUrl(m.storage_path);
      return url===stored;
    }))){setError('Choose images from the approved media library.');return;}
    if(!await save())return;
    setBusy(true);setError(null);
    const {data,error}=await client.rpc('nb_publish_product',{p_product_id:id});
    setBusy(false);
    if(error){setError(error.message);return;}
    setMessage('Product version '+data+' published. Customers can now see the approved content.');
    await load();
  };
  return <section className="space-y-7">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><h2 className="font-serif text-3xl">Products</h2><p className="mt-2 text-sm text-stone-600">Create and edit private drafts; approved owners publish changes atomically.</p></div>
      <button type="button" className={primaryClass} onClick={create}><Plus size={16}/> New product</button>
    </div>
    <div className="grid gap-3 rounded-lg border border-stone-200 bg-white p-4 sm:grid-cols-[1fr_auto_auto]">
      <input className={inputClass} type="search" aria-label="Search products by name or SKU"
        placeholder="Search by garment name or SKU…" value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}}/>
      <select aria-label="Filter product status" className={inputClass} value={statusFilter}
        onChange={e=>{setStatusFilter(e.target.value);setPage(0);}}>
        <option value="all">All statuses</option><option value="published">Published</option>
        <option value="draft">Draft</option><option value="archived">Archived</option>
      </select>
      <select aria-label="Filter department" className={inputClass} value={departmentFilter}
        onChange={e=>{setDepartmentFilter(e.target.value);setPage(0);}}>
        <option value="all">All departments</option><option value="men">Men's Wear</option><option value="kids">Kids Wear</option>
      </select>
      <p className="text-xs text-stone-500 sm:col-span-3">{totalCount.toLocaleString('en-IN')} records · 50 per page</p>
    </div>
    <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
      <div className="max-h-[800px] space-y-2 overflow-y-auto rounded-lg border border-stone-200 bg-white p-3">
        {loading?<p className="p-3 text-sm">Loading catalogue…</p>:rows.length===0?<p className="p-3 text-sm text-stone-600">No products yet. Add the first genuine garment.</p>:
          rows.map((item)=><button type="button" key={item.id} onClick={()=>open(item)}
            className={'w-full rounded-md px-3 py-3 text-left '+
              (item.id===id?'bg-stone-900 text-white':'hover:bg-stone-100')}>
            <span className="block text-sm font-semibold">{item.label}</span>
            <span className={'mt-1 block text-xs '+(item.id===id?'text-stone-300':'text-stone-500')}>
              {item.live?'Published':'Not published'}{item.draft?' · Draft saved':''}
            </span>
          </button>)}
        <div className="flex items-center justify-between border-t border-stone-200 pt-3 text-xs">
          <button disabled={page===0} onClick={()=>setPage((p)=>Math.max(0,p-1))} className={outlineClass}>Previous</button>
          <span>Page {page+1}</span>
          <button disabled={(page+1)*50>=totalCount} onClick={()=>setPage((p)=>p+1)} className={outlineClass}>Next</button>
        </div>
      </div>
      <div className="rounded-lg border border-stone-200 bg-white p-5 md:p-7">
        {!id?<div className="space-y-4 py-14 text-center">
          <p className="font-serif text-3xl">Select a product</p>
          <p className="text-sm text-stone-600">Or click “New product” to start a draft.</p>
        </div>:<div className="space-y-6">
          <button type="button" className="flex items-center gap-2 text-xs text-stone-600" onClick={()=>setId(null)}><ArrowLeft size={14}/> Back to product list</button>
          <h3 className="font-serif text-2xl">{active?.label||'New product draft'}</h3>
          <p className="text-xs text-stone-500">{id}</p>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Garment title"><input className={inputClass} value={form.title} onChange={e=>update('title',e.target.value)} maxLength={180}/></Field>
            <Field label="Unique SKU"><input className={inputClass} value={form.sku} onChange={e=>update('sku',e.target.value)} maxLength={80}/></Field>
            <Field label="URL slug"><input className={inputClass} value={form.slug} onChange={e=>update('slug',e.target.value)} placeholder="handwork-sherwani-ivory"/></Field>
            <Field label="Department"><select className={inputClass} value={form.department} onChange={e=>{
              const department=e.target.value==='kids'?'kids':'men';
              setForm({...form,department,categoryPaths:[]});
            }}><option value="men">Men's Wear</option><option value="kids">Kids Wear</option></select></Field>
            <Field label="Fabric"><input className={inputClass} value={form.fabric} onChange={e=>update('fabric',e.target.value)}/></Field>
            <Field label="Price (optional, not displayed publicly yet)"><input type="number" step=".01" min="0" className={inputClass} value={form.price} onChange={e=>update('price',e.target.value)}/></Field>
            <Field label="Sizes (comma-separated)"><input className={inputClass} value={form.sizes.join(', ')} onChange={e=>update('sizes',e.target.value.split(',').map(x=>x.trim()).filter(Boolean))}/></Field>
            <Field label="Display order"><input type="number" className={inputClass} value={form.sortRank} onChange={e=>update('sortRank',Number(e.target.value)||0)}/></Field>
            <div className="md:col-span-2"><Field label="Garment description"><textarea rows={4} className={inputClass} value={form.description} onChange={e=>update('description',e.target.value)}/></Field></div>
          </div>
          <fieldset className="rounded-lg border border-stone-200 p-4">
            <legend className="px-2 text-xs font-semibold">Visible in collections</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {categories.map((c)=><label key={c.path} className="flex min-h-10 cursor-pointer items-center gap-2 text-xs">
                <input type="checkbox" checked={form.categoryPaths.includes(c.path)}
                  onChange={(e)=>update('categoryPaths',e.target.checked?
                    [...form.categoryPaths,c.path]:form.categoryPaths.filter(x=>x!==c.path))}/>
                {c.title} <span className="text-stone-400">{c.path}</span>
              </label>)}
            </div>
          </fieldset>
          <AssetPicker client={client} label="Product photographs" multiple media={media} selected={form.imageUrls} onChange={urls=>update('imageUrls',urls)}/>
          {form.imageUrls.length>1&&<div className="space-y-2"><p className="text-xs font-semibold">Gallery order (first image is the cover)</p>
            {form.imageUrls.map((url,index)=><div key={url} className="flex items-center gap-3 text-xs">
              <span>{index+1}.</span><img alt="" src={url} className="h-12 w-10 object-cover"/>
              <button type="button" disabled={index===0} className={outlineClass} onClick={()=>{
                const copy=[...form.imageUrls];[copy[index-1],copy[index]]=[copy[index],copy[index-1]];update('imageUrls',copy);
              }}>Move up</button>
              <button type="button" disabled={index===form.imageUrls.length-1} className={outlineClass} onClick={()=>{
                const copy=[...form.imageUrls];[copy[index+1],copy[index]]=[copy[index],copy[index+1]];update('imageUrls',copy);
              }}>Move down</button>
            </div>)}
          </div>}
          <AssetPicker client={client} label="Optional uploaded product video" allowVideo media={media}
            selected={approvedVideos.some(m=>mediaPublicUrl(m.storage_path)===form.videoUrl)?[form.videoUrl]:[]}
            onChange={urls=>update('videoUrl',urls[0]||'')}/>
          <Field label="Or external HTTPS video / streaming link"><input type="url" className={inputClass} value={form.videoUrl} onChange={e=>update('videoUrl',e.target.value)} placeholder="https://..."/></Field>
          <div className="flex flex-wrap gap-3 border-t border-stone-200 pt-6">
            <button type="button" className={outlineClass} disabled={busy} onClick={()=>void save()}><Save size={15}/> Save private draft</button>
            {canPublish&&<button type="button" className={primaryClass} disabled={busy} onClick={()=>void publish()}><Send size={15}/> Publish approved version</button>}
          </div>
          {message&&<p role="status" className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
          <ErrorText message={error}/>
        </div>}
      </div>
    </div>
  </section>;
}
