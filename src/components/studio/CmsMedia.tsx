import React, { useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ImagePlus, CheckCircle2, Upload } from 'lucide-react';
import { type CmsMediaRow, mediaPublicUrl } from '../../lib/cmsData';
import { uploadCmsFile, MAX_MEDIA_SIZE } from '../../lib/cmsUpload';
import { ErrorText, inputClass, outlineClass, primaryClass } from './StudioShared';

interface Props { client: SupabaseClient; userId:string; canPublish:boolean; onMediaChange:()=>void; }
export default function CmsMedia({client,userId,canPublish,onMediaChange}:Props) {
  const [rows,setRows] = useState<CmsMediaRow[]>([]);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState<string|null>(null);
  const [uploading,setUploading] = useState(false);
  const [progress,setProgress] = useState(0);
  const [selection,setSelection] = useState<FileList|null>(null);
  const [busyId,setBusyId] = useState<string|null>(null);
  const [altDrafts,setAltDrafts] = useState<Record<string,string>>({});
  const [nameDrafts,setNameDrafts] = useState<Record<string,string>>({});
  const [privatePreviews,setPrivatePreviews] = useState<Record<string,string>>({});
  const [search,setSearch] = useState('');
  const [approvalFilter,setApprovalFilter] = useState('all');
  const [page,setPage] = useState(0);
  const [total,setTotal] = useState(0);
  const refresh = async () => {
    setLoading(true);
    let request=client.from('nb_media')
      .select('id,storage_path,original_name,mime_type,size_bytes,alt_text,approved,uploaded_by,created_at',{count:'exact'});
    const term=search.replace(/[^a-zA-Z0-9 _.-]/g,' ').trim().slice(0,60);
    if(term)request=request.ilike('original_name','%'+term+'%');
    if(approvalFilter==='approved')request=request.eq('approved',true);
    if(approvalFilter==='pending')request=request.eq('approved',false);
    const {data,count,error} = await request.order('created_at',{ascending:false})
      .range(page*30,page*30+29);
    setTotal(count||0);
    const assets=(data||[]) as CmsMediaRow[];
    setRows(assets);
    setPrivatePreviews({});
    setAltDrafts(Object.fromEntries(assets.map(a=>[a.id,a.alt_text])));
    setNameDrafts(Object.fromEntries(assets.map(a=>[a.id,a.original_name])));
    setError(error?.message || null);
    setLoading(false);
  };
  useEffect(()=>{const timer=setTimeout(()=>void refresh(),220);return()=>clearTimeout(timer)},[client,page,search,approvalFilter]);

  const upload = async () => {
    if (!selection?.length || uploading) return;
    setUploading(true);setError(null);
    try {
      for (const file of Array.from(selection)) {
        setProgress(0);
        await uploadCmsFile(client,file,userId,setProgress);
      }
      setSelection(null);
      await refresh();
      onMediaChange();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Upload failed.');
    } finally { setUploading(false); }
  };
  const approve = async (asset:CmsMediaRow) => {
    if (!canPublish) return;
    setBusyId(asset.id);setError(null);
    const {data,error} = await client.functions.invoke('nb-media-approval',{
      body:{id:asset.id,action:asset.approved?'revoke':'approve'},
    });
    if (error || !data?.ok) setError(error?.message||data?.error||'Unable to change approval status.'); 
    else { await refresh();onMediaChange(); }
    setBusyId(null);
  };
  const previewPrivate = async (asset:CmsMediaRow) => {
    setBusyId(asset.id);setError(null);
    const {data,error}=await client.storage.from('nb-media-staging')
      .createSignedUrl(asset.storage_path,120);
    if(error || !data?.signedUrl) setError(error?.message||'Private preview unavailable.');
    else setPrivatePreviews(current=>({...current,[asset.id]:data.signedUrl}));
    setBusyId(null);
  };
  const saveDescription = async (asset:CmsMediaRow) => {
    const permitted = canPublish || (!asset.approved && asset.uploaded_by===userId);
    if(!permitted)return;
    setBusyId(asset.id);setError(null);
    const value=(altDrafts[asset.id]||'').trim().slice(0,400);
    const filename=(nameDrafts[asset.id]||'').trim().slice(0,220);
    if(!filename){setError('Enter a media display name.');setBusyId(null);return;}
    const {data,error}=await client.from('nb_media')
      .update({alt_text:value,original_name:filename}).eq('id',asset.id).select('id').maybeSingle();
    if(error||!data)setError(error?.message||'Asset description could not be saved.');
    else {await refresh();onMediaChange();}
    setBusyId(null);
  };
  const deleteMedia=async(asset:CmsMediaRow)=>{
    if(!canPublish||asset.approved)return;
    if(!window.confirm('Permanently delete this unapproved file? This cannot be undone.'))return;
    setBusyId(asset.id);setError(null);
    try{
      const {data,error}=await client.functions.invoke('nb-media-approval',{
        body:{id:asset.id,action:'delete'},
      });
      if(error||!data?.ok)throw new Error(error?.message||data?.error||'Unable to delete asset.');
      await refresh();onMediaChange();
    }catch(cause){setError(cause instanceof Error?cause.message:'File deletion failed.');}
    finally{setBusyId(null);}
  };
  return <section className="space-y-7">
    <div>
      <h2 className="font-serif text-3xl">Media library</h2>
      <p className="mt-2 max-w-2xl text-sm text-stone-600">Upload real garment photographs or MP4/WebM videos. Only approved images can be published on products or the homepage. Large files use resumable uploads.</p>
    </div>
    <div className="rounded-lg border border-stone-200 bg-stone-50 p-5 space-y-4">
      <div className="flex items-center gap-2"><ImagePlus size={20}/><h3 className="font-semibold">Upload assets</h3></div>
      <input aria-label="Choose photos or videos" type="file" multiple
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif,video/mp4,video/webm"
        className={inputClass} onChange={(e)=>setSelection(e.currentTarget.files)}/>
      <p className="text-xs text-stone-500">50 MB maximum per file (server-side bucket limit also applies). Current project storage quotas are enforced by Supabase.</p>
      <button type="button" className={primaryClass} onClick={()=>void upload()} disabled={!selection?.length || uploading}>
        <Upload size={16}/>{uploading ? 'Uploading ' + progress + '%' : 'Upload selected files'}
      </button>
      {uploading && <progress aria-label="Upload progress" max={100} value={progress} className="block w-full"/>}
    </div>
    <div className="grid gap-3 rounded-md border border-stone-200 bg-white p-4 sm:grid-cols-[1fr_auto]">
      <input className={inputClass} type="search" aria-label="Search media filename or SKU"
        placeholder="Search photos by name or SKU…" value={search}
        onChange={e=>{setSearch(e.target.value);setPage(0);}}/>
      <select className={inputClass} aria-label="Media approval status" value={approvalFilter}
        onChange={e=>{setApprovalFilter(e.target.value);setPage(0);}}>
        <option value="all">All assets</option><option value="pending">Pending approval</option>
        <option value="approved">Approved</option>
      </select>
      <p className="text-xs text-stone-500 sm:col-span-2">{total.toLocaleString('en-IN')} media records · 30 per page</p>
    </div>
    <ErrorText message={error}/>
    {loading ? <p className="text-sm text-stone-500">Loading media…</p> :
      rows.length===0 ? <p className="rounded-lg bg-stone-100 p-8 text-sm">There are no assets yet. Add the owner's approved product photographs first.</p> :
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((asset)=>{
          const url=asset.approved ? mediaPublicUrl(asset.storage_path) : (privatePreviews[asset.id] || '');
          return <article key={asset.id} className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
            {url ? (asset.mime_type.startsWith('image/') ? <img loading="lazy" src={url} alt={asset.alt_text || asset.original_name} className="aspect-[4/3] w-full bg-stone-100 object-cover"/> :
              <video preload="none" controls src={url} className="aspect-[4/3] w-full bg-stone-950" aria-label={asset.original_name}/>) :
              <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3 bg-stone-100 p-4 text-center">
                <p className="text-xs text-stone-600">Private pending asset</p>
                <button type="button" className={outlineClass} disabled={busyId===asset.id} onClick={()=>void previewPrivate(asset)}>Preview privately (2 minutes)</button>
              </div>}
            <div className="space-y-2 p-4">
              <p className="truncate text-sm font-semibold" title={asset.original_name}>{asset.original_name}</p>
              <p className="text-xs text-stone-500">{(asset.size_bytes/1024/1024).toFixed(2)} MB · {asset.mime_type}</p>
              <p className={'text-xs font-semibold ' + (asset.approved?'text-emerald-700':'text-amber-700')}>
                {asset.approved?'Approved for publication':'Awaiting approval'}
              </p>
              <label className="block text-xs font-semibold text-stone-700">
                Media display name
                <input type="text" className={inputClass+' mt-2'} maxLength={220}
                  value={nameDrafts[asset.id]??asset.original_name}
                  disabled={!canPublish && (asset.approved || asset.uploaded_by!==userId)}
                  onChange={e=>setNameDrafts(current=>({...current,[asset.id]:e.target.value}))}/>
              </label>
              <label className="block text-xs font-semibold text-stone-700">
                {asset.mime_type.startsWith('video/')?'Video description':'Image alternative text'}
                <input type="text" maxLength={400} className={inputClass+' mt-2'} value={altDrafts[asset.id]??asset.alt_text}
                  disabled={!canPublish && (asset.approved || asset.uploaded_by!==userId)}
                  onChange={e=>setAltDrafts((current)=>({...current,[asset.id]:e.target.value}))}/>
              </label>
              <div className="flex flex-wrap gap-2">
                {(canPublish || (!asset.approved && asset.uploaded_by===userId)) && <button type="button"
                  disabled={busyId===asset.id || ((altDrafts[asset.id]??asset.alt_text)===asset.alt_text && (nameDrafts[asset.id]??asset.original_name)===asset.original_name)}
                  onClick={()=>void saveDescription(asset)} className={outlineClass}>Save edits</button>}
                {canPublish && <button type="button" disabled={busyId===asset.id} onClick={()=>void approve(asset)} className={outlineClass}>
                  <CheckCircle2 size={15}/>{asset.approved?'Revoke approval':'Approve'}
                </button>}
                {canPublish&&!asset.approved&&<button type="button" disabled={busyId===asset.id}
                  onClick={()=>void deleteMedia(asset)} className={outlineClass+' border-red-300 text-red-800'}>
                  Delete file
                </button>}
                {asset.approved && <button type="button" className={outlineClass} onClick={()=>void navigator.clipboard.writeText(url)}>Copy public URL</button>}
              </div>
            </div>
          </article>;
        })}
      </div>}
    {total>30&&<nav aria-label="Media pages" className="flex items-center justify-center gap-3">
      <button type="button" className={outlineClass} disabled={page===0}
        onClick={()=>setPage(current=>Math.max(0,current-1))}>Previous</button>
      <span className="text-sm">Page {page+1} / {Math.ceil(total/30)}</span>
      <button type="button" className={outlineClass} disabled={(page+1)*30>=total}
        onClick={()=>setPage(current=>current+1)}>Next</button>
    </nav>}
  </section>;
}
