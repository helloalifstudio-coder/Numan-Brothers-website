import {describe,expect,test} from 'bun:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {validContactNumber,whatsappContact,callingContact} from '../src/lib/contactLinks';
import {rowToProduct,HOME_TEMPLATE} from '../src/lib/cmsData';
import {productPath} from '../src/storefront/catalog';
import V2Product from '../src/components/V2Product';

const product={
  id:'11111111-1111-4111-8111-111111111111',sku:'NB-SH-00001',slug:'royal-sherwani',
  title:'Royal Sherwani',department:'men',category_paths:['/men/sherwani'],
  description:'Silk embroidered',fabric:'Silk',sizes:['40','42'],image_urls:['https://example.com/a.webp'],
  video_url:null,price:12000,offer_price:9900,customizable:true,status:'published',
  sort_rank:0,created_at:'2026-01-01',updated_at:'2026-01-01'
} as const;

describe('Floating contact and independent product pages',()=>{
  test('validates verified phone numbers and encodes outbound messages',()=>{
    expect(validContactNumber('919876543210')).toBe(true);
    for(const bad of ['',undefined,'+919876543210','1','123<script>','001234567890']) {
      expect(validContactNumber(bad)).toBe(false);
      expect(whatsappContact(bad,'hello')).toBeNull();
      expect(callingContact(bad)).toBeNull();
    }
    expect(callingContact('919876543211')).toBe('tel:+919876543211');
    expect(whatsappContact('919876543210','Hello & more')).toBe('https://wa.me/919876543210?text=Hello%20%26%20more');
  });
  test('published record has a unique, shareable slug and retains garment details',()=>{
    const p=rowToProduct(product as any);
    expect(productPath(p)).toBe('/products/royal-sherwani');
    expect(p.sku).toBe('NB-SH-00001');
    expect(p.images).toHaveLength(1);
    const html=renderToStaticMarkup(React.createElement(V2Product,{
      product:p,home:{...HOME_TEMPLATE,contactWhatsapp:'919876543210',contactPhone:'919876543211'},
      whatsappNumber:'919876543210',contactPhone:'919876543211',onNavigate:()=>{},
    }));
    expect(html).toContain('Royal Sherwani');
    expect(html).toContain('Style code');
    expect(html).toContain('Choose your size for an enquiry');
    expect(html).toContain('Share this design');
    expect(html).toContain('tel:+919876543211');
    expect(html).toContain('wa.me/919876543210');
    expect(html).not.toContain('Add to cart');
  });
});
