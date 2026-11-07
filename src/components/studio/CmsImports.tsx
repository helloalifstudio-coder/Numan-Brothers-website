import React, { useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { FileUp, Images, Download, ShieldCheck } from 'lucide-react';
import { validateCatalogueCsv, type CsvRow, MAX_IMPORT_RECORDS } from '../../lib/bulkCsv';
import { importCatalogueFile, importImageFiles, csvFailureReport, type ImportStatus } from '../../lib/importEngine';
import { ErrorText, inputClass, outlineClass, primaryClass } from './StudioShared';

interface Props {client:SupabaseClient;userId:string;onMediaChange:()=>void;}
export default function CmsImports({client,userId,onMediaChange}:Props){
  const [csvFile,setCsvFile]=useState<File|null>(null);
  const [photoFiles,setPhotoFiles]=useState<File[]>([]);
  const [preview,setPreview]=useState<CsvRow[]>([]);
  const [progress,setProgress]=useState<ImportStatus|null>(null);
  const [fileProgress,setFileProgress]=useState(0);
  const [currentFile,setCurrentFile]=useState('');
  const [error,setError]=useState<string|null>(null);
  const [busy,setBusy]=useState(false);
  const [finished,setFinished]=useState(false);
  const [linking,setLinking]=useState(false);
  const [linked,setLinked]=useState(0);
  const [scanned,setScanned]=useState(0);
  const [linkCursor,setLinkCursor]=useState<string|null>(null);
  const [matchingDone,setMatchingDone]=useState(false);

  const selectCsv=async(file:File|null)=>{
    setCsvFile(file);setPreview([]);setProgress(null);setError(null);setFinished(false);
    if(!file)return;
    try{setPreview(validateCatalogueCsv(await file.text()));}
    catch(cause){setError(cause instanceof Error?cause.message:'Invalid CSV');}
  };
  const csvStart=async()=>{
    if(!csvFile||busy||!preview.length)return;
    setBusy(true);setError(null);setFinished(false);
    try{const result=await importCatalogueFile(client,userId,csvFile,setProgress);
      setProgress(result);setFinished(true);}
    catch(cause){setError(cause instanceof Error?cause.message:'CSV import failed.');}
    finally{setBusy(false);}
  };
  const imagesStart=async()=>{
    if(!photoFiles.length||busy)return;
    setBusy(true);setError(null);setFinished(false);setFileProgress(0);
    try{
      const result=await importImageFiles(client,userId,photoFiles,(status,filename,percent)=>{
        setProgress(status);setCurrentFile(filename);setFileProgress(percent);
      });
      setProgress(result);setFinished(true);onMediaChange();
    }catch(cause){setError(cause instanceof Error?cause.message:'Image import failed.');}
    finally{setBusy(false);}
  };
  const linkApprovedImages=async()=>{
    if(linking)return;
    setLinking(true);setError(null);
    try{
      let cursor=linkCursor, processedTotal=0, linkedTotal=0, ended=false;
      for(let batch=0;batch<100;batch++){
        const {data,error}=await client.rpc('nb_link_approved_media',{
          p_after:cursor,p_limit:100,
        });
        if(error)throw new Error(error.message);
        const result=Array.isArray(data)?data[0]:data;
        const count=Number(result?.processed||0),newLinked=Number(result?.linked||0);
        processedTotal+=count;linkedTotal+=newLinked;
        cursor=result?.next_after||cursor;
        setLinkCursor(cursor);setScanned(x=>x+count);setLinked(x=>x+newLinked);
        if(count<100){ended=true;break;}
      }
      if(ended)setMatchingDone(true);
    }catch(cause){setError(cause instanceof Error?cause.message:'Auto-match failed.');}
    finally{setLinking(false);}
  };
  const downloadReport=()=>{
    if(!progress)return;
    const blob=new Blob([csvFailureReport(progress)],{type:'text/csv;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    const link=document.createElement('a');link.href=url;link.download='nomaan-import-errors.csv';
    link.click();URL.revokeObjectURL(url);
  };
  const totalInvalid=preview.filter(x=>x.error).length;
  return <section className="max-w-6xl space-y-7">
    <div><p className="text-xs font-bold uppercase tracking-[.2em] text-amber-800">Reliable onboarding</p>
      <h2 className="mt-2 font-serif text-3xl">Bulk imports</h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-600">
        Import up to {MAX_IMPORT_RECORDS.toLocaleString('en-IN')} catalogue records per CSV. Products become private drafts.
        Upload photos in resumable batches. The owner must approve each image and publish products before the storefront changes.
      </p>
    </div>
    <div className="grid gap-5 xl:grid-cols-2">
      <div className="space-y-5 rounded-lg border border-stone-200 bg-white p-6">
        <div className="flex items-center gap-2"><FileUp size={22}/><h3 className="font-serif text-2xl">1. Products CSV</h3></div>
        <p className="text-xs leading-6 text-stone-600">Required headers: <code>sku,title,department,category</code>.
          Optional: <code>sizes,fabric,description,price</code>. Separate sizes with <code>|</code>. Existing SKUs are skipped, never silently overwritten.</p>
        <input className={inputClass} type="file" accept=".csv,text/csv"
          aria-label="Select catalogue CSV" disabled={busy}
          onChange={e=>void selectCsv(e.target.files?.[0]||null)}/>
        {preview.length>0&&<div className="rounded-md bg-stone-50 p-4 text-sm">
          <p className="font-semibold">Review before importing</p>
          <p className="mt-2">{preview.length} rows · {preview.length-totalInvalid} valid · {totalInvalid} invalid</p>
          <div className="mt-3 max-h-36 overflow-y-auto text-xs text-red-800">
            {preview.filter(row=>row.error).slice(0,15).map(row=>
              <p key={row.rowNumber}>Row {row.rowNumber} · {row.sku}: {row.error}</p>)}
          </div>
        </div>}
        <button type="button" className={primaryClass} disabled={busy||!preview.length}
          onClick={()=>void csvStart()}>{busy?'Import in progress…':'Import validated drafts'}</button>
      </div>
      <div className="space-y-5 rounded-lg border border-stone-200 bg-white p-6">
        <div className="flex items-center gap-2"><Images size={22}/><h3 className="font-serif text-2xl">2. Garment photos</h3></div>
        <p className="text-xs leading-6 text-stone-600">
          Use <code>NB-SHW-001_01.jpg</code>, <code>NB-SHW-001_02.jpg</code> and so on.
          Upload up to 250 images per batch. Each image remains private until a publisher approves it.
        </p>
        <input className={inputClass} type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          multiple disabled={busy} aria-label="Choose batch garment photographs"
          onChange={e=>{setPhotoFiles(Array.from(e.target.files||[]));setProgress(null);setFinished(false);}}/>
        <p className="text-xs text-stone-500">{photoFiles.length} image files selected</p>
        <button type="button" className={primaryClass} disabled={busy||!photoFiles.length||photoFiles.length>250}
          onClick={()=>void imagesStart()}>{busy?'Importing…':'Upload into private media library'}</button>
        {currentFile&&busy&&<div className="text-xs text-stone-600">
          <p className="truncate">{currentFile} — {fileProgress}%</p>
          <progress className="mt-2 w-full" value={fileProgress} max={100}/>
        </div>}
      </div>
    </div>
    <div className="space-y-3 rounded-lg border border-amber-200 bg-[#fffaf0] p-5">
      <h3 className="font-serif text-xl">3. Link approved photos to drafts</h3>
      <p className="text-xs leading-6 text-stone-700">
        After owner approval in Media Library, match filenames such as NB-SHW-001_01.jpg to the corresponding SKU.
        Only draft products with empty galleries are updated; existing gallery arrangements are preserved.
        No product is published by this step.
      </p>
      <button type="button" className={outlineClass} disabled={linking||matchingDone}
        onClick={()=>void linkApprovedImages()}>{linking?'Matching galleries…':matchingDone?'Finished scanning drafts':'Match approved images by SKU'}</button>
      <p className="text-xs text-stone-600">{scanned} drafts scanned · {linked} galleries linked</p>
    </div>
    {progress&&<div className="space-y-3 rounded-lg border border-stone-200 bg-stone-50 p-5">
      <h3 className="font-semibold">{finished?'Import finished':'Import progress'} · Job {progress.jobId.slice(0,8)}</h3>
      <progress max={Math.max(1,progress.total)} value={progress.processed} className="w-full"/>
      <p className="text-sm">{progress.processed}/{progress.total} processed · {progress.imported} imported · {progress.skipped} skipped · {progress.failed} failed</p>
      {progress.failures.length>0&&<button type="button" className={outlineClass} onClick={downloadReport}>
        <Download size={16}/> Download failed rows CSV</button>}
    </div>}
    {finished&&<div className="flex items-start gap-3 border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
      <ShieldCheck size={20}/><p>Imported records remain private. Review and approve media in the library, attach approved images to product drafts, and publish only after checking the content.</p>
    </div>}
    <ErrorText message={error}/>
  </section>;
}
