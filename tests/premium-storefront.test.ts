import React from 'react';
import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Product } from '../src/types';
import V2Product from '../src/components/V2Product';
import V2HomeDiscovery from '../src/components/V2HomeDiscovery';
import { productTheme } from '../src/storefront/productTheme';
import { getDepartment } from '../src/storefront/navigation';
import { HOME_TEMPLATE } from '../src/lib/cmsData';
import { DEPARTMENTS } from '../src/storefront/navigation';

const makeProduct = (title:string):Product=>({
  id:'11111111-1111-4111-8111-111111111111',title,category:'sherwanis',
  price:0,mrp:0,images:['https://cdn.example.com/sherwani.webp'],
  fabric:'Silk blend',length:'',sizes:['40','42'],description:'Fine detailing.',
  specs:[],badges:[],colors:[],rating:0,reviewsCount:0,type:'Set',
  hasBottom:true,sizeChart:{top:[]},reviews:[],
});

describe('photo-synced product editorial experience',()=>{
  test('chooses palettes by the real garment collection, not by image URL',()=>{
    expect(productTheme({...makeProduct('Royal Sherwani'),collectionPaths:['/men/sherwani']}).name)
      .toBe('The Royal Edit');
    expect(productTheme({...makeProduct('Kids Sherwani'),department:'kids',collectionPaths:['/kids/sherwani']}).departmentPath)
      .toBe('/kids');
    expect(productTheme({...makeProduct('Kurta Pyjama'),collectionPaths:['/men/kurta-pyjama']}).name)
      .toBe('Timeless Heritage');
    expect(productTheme({...makeProduct('Bandhgala'),collectionPaths:['/men/jodhpuri']}).name)
      .toBe('The Tailored Edit');
  });
  test('renders distinct decorative blur and accessible, crisp garment image',()=>{
    const html=renderToStaticMarkup(React.createElement(V2Product,{
      product:makeProduct('Royal Sherwani'),onNavigate:()=>{},
    }));
    expect(html).toContain('blur-[68px]');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('alt="Royal Sherwani"');
    expect(html).toContain('Product breadcrumbs');
    expect(html).toContain('/men/sherwani');
    expect(html).toContain('Continue your journey');
    expect(html).toContain('Fine detailing.');
    expect(html).not.toContain('Enquire about this design</');
  });
  test('does not create an enquiry link without a verified WhatsApp number',()=>{
    const html=renderToStaticMarkup(React.createElement(V2Product,{
      product:makeProduct('Sherwani'),whatsappNumber:'123<script>',onNavigate:()=>{},
    }));
    expect(html).not.toContain('wa.me');
  });
  test('uses the correct department breadcrumb for kids',()=>{
    const html=renderToStaticMarkup(React.createElement(V2Product,{
      product:{...makeProduct('Kids Sherwani'),department:'kids',collectionPaths:['/kids/sherwani']},
      onNavigate:()=>{},
    }));
    expect(html).toContain('href="/kids"');
    expect(html).toContain('href="/kids/sherwani"');
  });
});

describe('homepage guided collection directory',()=>{
  test('renders current men department taxonomy with linkable destinations',()=>{
    const html=renderToStaticMarkup(React.createElement(V2HomeDiscovery,{
      products:[],home:HOME_TEMPLATE,onNavigate:()=>{},
    }));
    expect(html).toContain('id="collection-directory"');
    expect(html).toContain('aria-pressed="true"');
    for(const group of getDepartment('men').groups){
      for(const item of group.items)expect(html).toContain('href="'+item.path+'"');
    }
  });
  test('taxonomy stays in two departments and avoids invented catalogue routes',()=>{
    expect(DEPARTMENTS.map(x=>x.id)).toEqual(['men','kids']);
    for(const department of DEPARTMENTS)for(const group of department.groups)
      for(const item of group.items)expect(item.path.startsWith(department.path+'/')).toBe(true);
  });
});
