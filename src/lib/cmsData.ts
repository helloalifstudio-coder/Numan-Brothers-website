import type { Product } from '../types';
import type { CatalogProduct } from '../storefront/catalog';
import { getCmsClient, cmsProjectUrl } from './supabaseClient';

export interface CmsProductRow {
  id: string;
  sku: string;
  slug: string;
  title: string;
  department: 'men' | 'kids';
  category_paths: string[];
  description: string;
  fabric: string;
  sizes: string[];
  image_urls: string[];
  video_url: string | null;
  price: number | null;
  status: 'draft' | 'published' | 'archived';
  sort_rank: number;
  created_at: string;
  updated_at: string;
}

export interface CmsMediaRow {
  id: string;
  storage_path: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  alt_text: string;
  approved: boolean;
  uploaded_by: string;
  created_at: string;
}
export interface CmsCategoryRow {
  path: string;
  department: 'men' | 'kids';
  label: string;
  description: string;
  image_url: string | null;
  active: boolean;
  sort_order: number;
}

export interface CmsHome {
  heroTitle: string;
  heroEyebrow: string;
  heroSubtitle: string;
  heroImage: string;
  menImage: string;
  kidsImage: string;
  storyTitle: string;
  storyDescription: string;
  storyImage: string;
  contactWhatsapp: string;
}
export const HOME_TEMPLATE: CmsHome = {
  heroTitle: 'For the moments you remember.',
  heroEyebrow: 'The Designer Sherwani House',
  heroSubtitle: 'Modern heritage menswear and kidswear, discovered in the heart of Mandi Bazar, Warangal.',
  heroImage: '',
  menImage: '',
  kidsImage: '',
  storyTitle: 'A sense of occasion.',
  storyDescription: 'From wedding ensembles to traditional everyday styles, discover the silhouettes that feel right for your celebration.',
  storyImage: '',
  contactWhatsapp: '',
};
export const homeKeys = Object.keys(HOME_TEMPLATE) as (keyof CmsHome)[];
export const cleanHome = (value: unknown): CmsHome => {
  const record = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
  return homeKeys.reduce((next, key) => {
    const raw = record[key];
    const value = typeof raw === 'string' ? raw.slice(0, key.includes('Description') || key.includes('Subtitle') ? 900 : 300) : HOME_TEMPLATE[key];
    next[key] = key === 'contactWhatsapp'
      ? (/^[1-9][0-9]{9,14}$/.test(value) ? value : '')
      : key.toLowerCase().includes('image') ? (value && isSafeHttps(value) ? value : '') : value;
    return next;
  }, { ...HOME_TEMPLATE });
};
export const isSafeHttps = (url: string): boolean => {
  try { const parsed = new URL(url); return parsed.protocol === 'https:' && !parsed.username && !parsed.password; }
  catch { return false; }
};
export const mediaPublicUrl = (path: string): string => {
  const client = getCmsClient();
  return client?.storage.from('nb-media').getPublicUrl(path).data.publicUrl || '';
};

export function rowToProduct(row: CmsProductRow): CatalogProduct {
  const images = Array.isArray(row.image_urls) ? row.image_urls.filter(isSafeHttps) : [];
  const p: Product = {
    id: row.id, title: row.title, price: row.price ?? 0, mrp: row.price ?? 0,
    images, category: row.department, fabric: row.fabric || '', length: '',
    sizes: Array.isArray(row.sizes) ? row.sizes : [], description: row.description || '',
    specs: [], badges: [], colors: [], rating: 0, reviewsCount: 0, type: 'Set',
    hasBottom: false, sizeChart: { top: [] }, reviews: [],
  };
  return { ...p, collectionPaths: row.category_paths || [], department: row.department,
    videoUrl: row.video_url && isSafeHttps(row.video_url) ? row.video_url : undefined,
    published: row.status === 'published' };
}

export interface PublishedData {
  products: CatalogProduct[];
  homepage: CmsHome;
  categories: CmsCategoryRow[];
  error: string | null;
}
export async function loadPublishedData(): Promise<PublishedData> {
  const client = getCmsClient();
  if (!client) return { products: [], homepage: HOME_TEMPLATE, categories: [], error: 'CMS not connected. Configure a dedicated Nomaan Brothers Supabase project.' };
  try {
    const [productsResult, homeResult, categoriesResult] = await Promise.all([
      client.from('nb_products')
        .select('id,sku,slug,title,department,category_paths,description,fabric,sizes,image_urls,video_url,price,status,sort_rank,created_at,updated_at')
        .eq('status','published').order('sort_rank', { ascending: true }).limit(500),
      client.from('nb_home_public').select('content').eq('key','home').maybeSingle(),
      client.from('nb_categories').select('path,department,label,description,image_url,active,sort_order').eq('active',true),
    ]);
    const error = productsResult.error || homeResult.error || categoriesResult.error;
    if (error) throw error;
    return {
      products: (productsResult.data || []).map((p) => rowToProduct(p as CmsProductRow)),
      homepage: cleanHome(homeResult.data?.content),
      categories: (categoriesResult.data || []) as CmsCategoryRow[],
      error: null,
    };
  } catch (error) {
    return { products: [], homepage: HOME_TEMPLATE, categories: [],
      error: error instanceof Error ? error.message : 'Unable to read the published catalogue.' };
  }
}

/** The CMS Auth client provides additional row-level permission enforcement in SQL. */
export function allowedCmsRole(role: unknown): role is 'owner' | 'admin' | 'editor' {
  return role === 'owner' || role === 'admin' || role === 'editor';
}
export function canPublishRole(role: unknown): boolean { return role === 'owner' || role === 'admin'; }
