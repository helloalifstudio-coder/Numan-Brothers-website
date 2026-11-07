import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, MapPin } from 'lucide-react';
import { Product } from '../types';
import { productImage } from '../storefront/catalog';
import V2Link from './V2Link';
import V2Reveal from './V2Reveal';

interface Props { product: Product; onNavigate: (path: string) => void; }
export default function V2Product({ product, onNavigate }: Props) {
  const images = (product.images || []).filter((image) => /^https:\/\//.test(image));
  const [selectedImage, setSelectedImage] = useState(0);
  const contact = 'https://wa.me/919908597337?text=' +
    encodeURIComponent('Hello Nomaan Brothers, I would like to enquire about ' + product.title + ' (' + product.id + ').');
  return <div className="min-h-[65vh] bg-[#fbf8f2] px-5 pb-28 pt-9 md:px-12 lg:px-20">
    <div className="mx-auto max-w-[1330px]">
      <V2Link href="/men" onNavigate={onNavigate} className="mb-11 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.15em] text-[#8d714e]"><ArrowLeft size={15}/> Back to collections</V2Link>
      <div className="grid gap-11 lg:grid-cols-[1.14fr_.86fr] lg:gap-20">
        <V2Reveal>
          <div className="relative aspect-[3/4] overflow-hidden bg-[#e8dfd1]">
            {(images[selectedImage] || productImage(product)) ? <img src={images[selectedImage] || productImage(product)}
              alt={product.title} loading="eager" fetchPriority="high" decoding="async" className="h-full w-full object-cover object-top"/> :
              <div className="flex h-full items-center justify-center font-serif text-6xl italic text-[#9a8266]">Nomaan</div>}
          </div>
          {images.length > 1 && <div className="mt-4 flex gap-3 overflow-auto pb-2" aria-label="Product images">
            {images.map((image, index) => <button key={image + index} type="button"
              aria-label={'View image ' + (index + 1)} aria-pressed={selectedImage === index}
              onClick={() => setSelectedImage(index)}
              className={'h-20 w-16 shrink-0 overflow-hidden border-2 ' + (selectedImage === index ? 'border-[#9b7648]' : 'border-transparent')}>
              <img src={image} alt="" loading="lazy" className="h-full w-full object-cover object-top"/>
            </button>)}
          </div>}
        </V2Reveal>
        <V2Reveal className="lg:sticky lg:top-36 lg:self-start">
          <p className="mb-6 text-[10px] font-semibold uppercase tracking-[.24em] text-[#9f794b]">Nomaan Brothers · Collection preview</p>
          <h1 className="font-serif text-[clamp(2.8rem,4.3vw,5rem)] leading-[1.06] tracking-[-.05em] text-[#2a231d]">{product.title}</h1>
          <div className="mt-8 h-px w-20 bg-[#bba07a]" />
          <p className="mt-8 text-sm leading-8 text-[#74685a]">For current prices, fitting options and availability, contact the showroom directly.</p>
          <dl className="mt-9 space-y-4 border-y border-[#e1d4c1] py-6 text-sm">
            {product.fabric && <div className="flex flex-wrap justify-between gap-4"><dt className="text-[#857565]">Fabric</dt><dd className="max-w-[65%] text-right font-medium text-[#362b21]">{product.fabric}</dd></div>}
            {Array.isArray(product.sizes) && product.sizes.length > 0 && <div className="flex flex-wrap justify-between gap-4"><dt className="text-[#857565]">Listed sizes</dt><dd className="max-w-[65%] text-right font-medium text-[#362b21]">{product.sizes.join(', ')}</dd></div>}
            <div className="flex flex-wrap justify-between gap-4"><dt className="text-[#857565]">Product reference</dt><dd className="font-medium text-[#362b21]">{product.id}</dd></div>
          </dl>
          <a href={contact} target="_blank" rel="noopener noreferrer"
            className="mt-8 flex min-h-14 items-center justify-between bg-[#30251b] px-7 text-xs font-semibold uppercase tracking-[.14em] text-[#fbf3e8] transition-colors hover:bg-[#765332]">
            Enquire about this style <ArrowUpRight size={19}/>
          </a>
          <V2Link href="/contact" onNavigate={onNavigate} className="mt-3 flex min-h-14 items-center justify-between border border-[#b7a080] px-7 text-xs font-semibold uppercase tracking-[.14em] text-[#5b4934] hover:bg-[#f1e5d4]">
            Visit our showroom <MapPin size={17}/>
          </V2Link>
          <p className="mt-5 text-xs leading-6 text-[#94877a]">Images and product details in this preview require final confirmation by the store before public launch.</p>
        </V2Reveal>
      </div>
      <V2Link href="/men" onNavigate={onNavigate} className="mt-14 inline-flex items-center gap-3 border-b border-[#a68960] pb-2 text-xs font-semibold uppercase tracking-[.12em] text-[#674c30]">Discover other collections <ArrowRight size={15}/></V2Link>
    </div>
  </div>;
}
