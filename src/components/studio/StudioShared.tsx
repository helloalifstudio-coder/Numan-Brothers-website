import React from 'react';
import type { CmsMediaRow } from '../../lib/cmsData';
import { mediaPublicUrl } from '../../lib/cmsData';

export const inputClass = 'w-full min-h-11 rounded-md border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 outline-offset-2 focus-visible:outline-2 focus-visible:outline-amber-700';
export const labelClass = 'mb-1.5 block text-xs font-semibold text-stone-700';
export const primaryClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50';
export const outlineClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-800 hover:bg-stone-100 disabled:opacity-50';
export function Field({label,children}: {label:string;children:React.ReactNode}) {
  return <label className="block"><span className={labelClass}>{label}</span>{children}</label>;
}
export function ErrorText({message}:{message:string|null}) {
  return message ? <p role="alert" className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">{message}</p> : null;
}
export function AssetPicker({
  label, media, selected, onChange, allowVideo = false, multiple = false,
}: {
  label: string; media:CmsMediaRow[]; selected:string[]; onChange:(urls:string[])=>void;
  allowVideo?:boolean; multiple?:boolean;
}) {
  const choices = media.filter((m) => m.approved && (allowVideo ? m.mime_type.startsWith('video/') : m.mime_type.startsWith('image/')));
  return <section aria-label={label}>
    <p className={labelClass}>{label} <span className="font-normal text-stone-500">(approved assets only)</span></p>
    {choices.length === 0 ? <p className="rounded-md bg-stone-100 p-4 text-xs text-stone-500">Upload media and have an owner/admin approve it before selection.</p> :
      <div className="grid max-h-72 grid-cols-2 gap-3 overflow-y-auto p-1 sm:grid-cols-3 lg:grid-cols-4">
        {choices.map((asset) => {
          const url = mediaPublicUrl(asset.storage_path);
          const checked = selected.includes(url);
          return <label key={asset.id} className={'cursor-pointer overflow-hidden rounded-md border-2 bg-white ' +
            (checked ? 'border-amber-700' : 'border-stone-200')}>
            <span className="flex items-center gap-2 p-2 text-xs">
              <input type={multiple ? 'checkbox' : 'radio'} checked={checked}
                onChange={(event)=>onChange(event.target.checked ?
                  (multiple ? [...selected.filter((value)=>value!==url),url] : [url])
                  : selected.filter((value)=>value!==url))} /> {asset.original_name.slice(0,28)}
            </span>
            {allowVideo ? <div className="flex aspect-[4/3] items-center justify-center bg-stone-900 text-white text-xs">Video asset</div> :
              <img src={url} alt={asset.alt_text || asset.original_name} loading="lazy" className="aspect-[4/3] w-full object-cover"/>}
          </label>;
        })}
      </div>}
  </section>;
}
