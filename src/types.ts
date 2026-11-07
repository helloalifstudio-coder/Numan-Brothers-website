/** Public catalogue types. Administrative data is handled by the Supabase CMS. */
export interface Colorway { name:string; hex:string }
export interface SpecItem { label:string; value:string }
export interface MeasurementRow {
  size:string; chestOrWaist:string; length:string; extra?:string;
}
export interface SizeChartData { top:MeasurementRow[]; bottom?:MeasurementRow[] }
export interface Review {
  id:string;name:string;rating:number;date:string;comment:string;verified:boolean;
}
export interface Product {
  id:string;
  title:string;
  price:number;
  mrp:number;
  images:string[];
  category:string;
  fabric:string;
  length:string;
  sizes:string[];
  description:string;
  specs:SpecItem[];
  badges:string[];
  colors:Colorway[];
  rating:number;
  reviewsCount:number;
  type:'Set'|'Top Only'|'Unstitched';
  hasBottom:boolean;
  sizeChart:SizeChartData;
  reviews:Review[];
}
