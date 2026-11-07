import type { CatalogProduct } from './catalog';
import { productPaths } from './catalog';
import { getCollection } from './navigation';

/**
 * Curated colour moods complement the *approved* lead product photograph.
 * Never infer colours from arbitrary URLs or introduce unapproved imagery.
 */
export interface ProductTheme {
  name: string;
  accent: string;
  glow: string;
  backdrop: string;
  departmentPath: '/men' | '/kids';
  departmentLabel: string;
  collectionPath: string;
  collectionLabel: string;
}

const palettes = {
  sherwani: { name: 'The Royal Edit', accent: '#b88f59', glow: '#8d5949', backdrop: '#261a20' },
  wedding: { name: 'Celebration Atelier', accent: '#c6a478', glow: '#765346', backdrop: '#2b2021' },
  kurta: { name: 'Timeless Heritage', accent: '#b69b70', glow: '#596c52', backdrop: '#202720' },
  jodhpuri: { name: 'The Tailored Edit', accent: '#c4a477', glow: '#566c75', backdrop: '#1c272d' },
  kids: { name: 'Little Traditions', accent: '#b58155', glow: '#9f785c', backdrop: '#30241f' },
  everyday: { name: 'The Heritage Collection', accent: '#c4a078', glow: '#856e57', backdrop: '#27221d' },
} as const;

export function productTheme(product: CatalogProduct): ProductTheme {
  const paths = productPaths(product);
  const departmentPath: '/men' | '/kids' =
    product.department === 'kids' || paths.some(path => path.startsWith('/kids')) ? '/kids' : '/men';
  const departmentLabel = departmentPath === '/kids' ? 'Kids Wear' : "Men's Wear";
  const collectionPath = paths
    .filter(path => path.startsWith(departmentPath + '/'))
    .sort((a, b) => a.split('/').length - b.split('/').length)[0] || departmentPath;
  const collectionLabel = getCollection(collectionPath)?.title || departmentLabel;

  const joined = [collectionPath, ...paths].join(' ');
  const palette = departmentPath === '/kids' ? palettes.kids :
    /sherwani/.test(joined) ? palettes.sherwani :
    /marriage|sadi|pagdi|jutti/.test(joined) ? palettes.wedding :
    /jodhpuri|suit/.test(joined) ? palettes.jodhpuri :
    /kurta|pathani/.test(joined) ? palettes.kurta : palettes.everyday;

  return {
    ...palette,
    departmentPath,
    departmentLabel,
    collectionPath,
    collectionLabel,
  };
}
