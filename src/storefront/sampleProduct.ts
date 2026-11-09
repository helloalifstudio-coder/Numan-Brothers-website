import type {CatalogProduct} from './catalog';
/** Visual QA fixture only. Never inserted into the owner’s product inventory. */
export const SAMPLE_SHERWANI:CatalogProduct={
 id:'11111111-1111-4111-8111-111111111112',
 slug:'sample-plain-sherwani',
 sku:'NB-SHW-DEMO-001',
 title:'Sample Plain Sherwani — Demo Only',
 category:'men',department:'men',collectionPaths:['/men/sherwani/plain'],
 price:0,mrp:0,originalPrice:undefined,offerPrice:undefined,
 images:['/editorial/sherwani.svg','/editorial/kurta.svg','/editorial/jodhpuri.svg'],
 fabric:'Illustrative sample — actual fabric to be confirmed',sizes:['38','40','42','44'],
 description:'DEMO / NOT FOR SALE. This sample product demonstrates the garment gallery, size selection, sharing and catalogue navigation. All artwork is illustrative, not actual Nomaan Brothers inventory.',
 length:'',specs:[],badges:['Demo preview'],colors:[],rating:0,reviewsCount:0,
 type:'Set',hasBottom:false,sizeChart:{top:[]},reviews:[],customizable:true,
 published:true,isPublished:true,
};
