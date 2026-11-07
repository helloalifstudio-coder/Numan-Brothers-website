import type { SupabaseClient } from '@supabase/supabase-js';
import type { CmsMediaRow } from './cmsData';
import { cmsProjectUrl } from './supabaseClient';

const allowed = new Map<string, string>([
  ['image/jpeg','jpg'], ['image/png','png'], ['image/webp','webp'],
  ['image/avif','avif'], ['image/gif','gif'], ['video/mp4','mp4'], ['video/webm','webm'],
]);
export const MAX_MEDIA_SIZE = 50 * 1024 * 1024;
const CHUNK_SIZE = 6 * 1024 * 1024;

export function checkMediaFile(file: Pick<File,'type'|'size'>): string | null {
  if (!allowed.has(file.type)) return 'Use JPG, PNG, WebP, AVIF, GIF, MP4 or WebM. Executable and SVG files are not accepted.';
  if (file.size < 1 || file.size > MAX_MEDIA_SIZE) return 'Files must be smaller than 50 MB.';
  return null;
}
function base64Text(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/** Chunked TUS upload. Retries HEAD/PATCH interruptions; never grants public upload rights. */
async function resumableUpload(
  client: SupabaseClient, path: string, file: File, progress: (pct: number) => void,
): Promise<void> {
  const { data: { session }, error } = await client.auth.getSession();
  if (error || !session?.access_token) throw new Error('Please sign in again before uploading.');
  const project = new URL(cmsProjectUrl).hostname.split('.')[0];
  const endpoint = 'https://' + project + '.storage.supabase.co/storage/v1/upload/resumable';
  const authHeaders = { authorization: 'Bearer ' + session.access_token,
    apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY };
  const metadata = [
    ['bucketName','nb-media-staging'], ['objectName',path], ['contentType',file.type], ['cacheControl','3600'],
  ].map(([key,value]) => key + ' ' + base64Text(value)).join(',');
  const start = await fetch(endpoint, {
    method: 'POST',
    headers: { ...authHeaders, 'Tus-Resumable':'1.0.0', 'Upload-Length': String(file.size), 'Upload-Metadata': metadata },
  });
  if (!start.ok) throw new Error('Cannot start resumable upload (HTTP ' + start.status + ').');
  const location = start.headers.get('Location');
  if (!location) throw new Error('Upload service did not return a resumable location.');
  const uploadUrl = new URL(location, endpoint).toString();
  if (!uploadUrl.startsWith('https://' + project + '.storage.supabase.co/')) {
    throw new Error('Unexpected upload server destination.');
  }

  let offset = 0;
  let failures = 0;
  while (offset < file.size) {
    try {
      const end = Math.min(offset + CHUNK_SIZE, file.size);
      const response = await fetch(uploadUrl, {
        method:'PATCH',
        headers:{ ...authHeaders, 'Tus-Resumable':'1.0.0',
          'Upload-Offset':String(offset), 'Content-Type':'application/offset+octet-stream' },
        body:file.slice(offset,end),
      });
      if (!response.ok) throw new Error('Upload chunk failed (HTTP ' + response.status + ').');
      const next = Number(response.headers.get('Upload-Offset'));
      if (!Number.isFinite(next) || next <= offset || next > file.size) {
        throw new Error('Invalid upload offset returned from the storage server.');
      }
      offset = next;
      failures = 0;
      progress(Math.round(100 * offset / file.size));
    } catch (cause) {
      if (++failures >= 4) throw cause;
      const check = await fetch(uploadUrl, {
        method:'HEAD', headers:{ ...authHeaders, 'Tus-Resumable':'1.0.0' },
      });
      if (!check.ok) throw new Error('Cannot resume interrupted upload.');
      const recoveredOffset = Number(check.headers.get('Upload-Offset'));
      if (!Number.isInteger(recoveredOffset) || recoveredOffset < offset || recoveredOffset > file.size) {
        throw new Error('Invalid resumed upload offset.');
      }
      offset = recoveredOffset;
      progress(Math.round(100 * offset / file.size));
    }
  }
}

export async function uploadCmsFile(
  client: SupabaseClient, file: File, userId: string, onProgress: (value: number) => void,
): Promise<CmsMediaRow> {
  const validation = checkMediaFile(file);
  if (validation) throw new Error(validation);
  const extension = allowed.get(file.type)!;
  const path = userId + '/' + crypto.randomUUID() + '.' + extension;
  if (file.size <= CHUNK_SIZE) {
    const { error } = await client.storage.from('nb-media-staging').upload(path, file, {
      upsert:false, cacheControl:'3600', contentType:file.type,
    });
    if (error) throw error;
    onProgress(100);
  } else {
    await resumableUpload(client, path, file, onProgress);
  }
  const { data, error } = await client.from('nb_media').insert({
    storage_path:path, original_name:file.name.slice(0,220), mime_type:file.type,
    size_bytes:file.size, alt_text:'', approved:false, uploaded_by:userId,
  }).select('id,storage_path,original_name,mime_type,size_bytes,alt_text,approved,uploaded_by,created_at').single();
  if (error || !data) {
    throw new Error('File uploaded, but saving metadata failed. Ask an administrator to reconcile: ' +
      (error?.message || 'unknown database error'));
  }
  return data as CmsMediaRow;
}
