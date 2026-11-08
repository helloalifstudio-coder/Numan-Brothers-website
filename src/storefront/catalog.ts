import { Product } from '../types';
import { isCollectionPath, normalizePath } from './navigation';

/**
 * Legacy products are mapped conservatively. Unrecognized garments aren't
 * misrepresented as other categories; owners can later assign collectionPaths
 * on approved product records from their CMS/ERP.
 */
export type CatalogProduct = Product & {
  collectionPaths?: string[];
  collectionPath?: string;
  department?: 'men' | 'kids';
  published?: boolean;
  isPublished?: boolean;
  videoUrl?: string;
  slug?:string;
  sku?:string;
  originalPrice?:number;
  offerPrice?:number;
  customizable?:boolean;
};

const words = (p: Product): string =>
  [p.title || '', p.category || '', p.type || ''].join(' ').toLowerCase();

/** Public catalogue uses the unique product slug; old UUID links remain supported. */
export const isProductSlug=(slug:unknown):slug is string =>
  typeof slug==='string' && slug.length<=120 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
export const productPath=(product:Pick<Product,'id'> & {slug?:string}):string =>
  '/products/'+encodeURIComponent(isProductSlug(product.slug)?product.slug:product.id);
export const productImage = (product: Product): string => {
  const images = Array.isArray(product.images) ? product.images.filter((image) => /^https:\/\//.test(image)) : [];
  return images.find((image) => !image.includes('img.youtube.com')) || images[0] || '';
};
