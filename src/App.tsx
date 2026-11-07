import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, ArrowRight, ArrowUpRight, MapPin, MessageCircle } from 'lucide-react';
import { PRODUCTS } from './data';
import { Product } from './types';
import { subscribeProducts } from './lib/firestoreService';
import { CatalogProduct, productPath, publicProducts } from './storefront/catalog';
import { getCollection } from './storefront/navigation';
import { useStoreHistory } from './storefront/history';
import V2Header from './components/V2Header';
import V2Home from './components/V2Home';
import V2Collection, { V2ProductGrid } from './components/V2Collection';
import V2Product from './components/V2Product';
import V2Footer from './components/V2Footer';
import V2Link from './components/V2Link';
import V2Reveal from './components/V2Reveal';

/**
 * Public V2 is intentionally browse-and-enquire only.
 * The retired PIN-admin, checkout, rewards, and return flows are NOT mounted.
 * Product subscription is read-only; seedProducts is never called.
 * A server-authorized admin/CMS and ERP-backed catalogue are release blockers.
 */
export default function App() {
  const { path, url, navigate } = useStoreHistory();
  const [products, setProducts] = useState<CatalogProduct[]>(PRODUCTS);
  useEffect(() => {
    let active = true;
    const unsubscribe = subscribeProducts((items: CatalogProduct[]) => {
      if (active && Array.isArray(items) && items.length > 0) setProducts(items);
    });
    return () => { active = false; unsubscribe?.(); };
  }, []);

  const published = useMemo(() => publicProducts(products), [products]);
  const collection = getCollection(path);
  const selectedId = path.startsWith('/products/') ? path.slice('/products/'.length) : null;
  const product = selectedId ? published.find((item) => productPath(item) === path) : undefined;
  const searchQuery = path === '/search' ? new URLSearchParams(url.split('?')[1] || '').get('q')?.trim() || '' : '';
  const matches = useMemo(() => {
    const query = searchQuery.toLocaleLowerCase('en-IN');
    return query ? published.filter((p) =>
      [p.title, p.fabric, p.category, ...(p.badges || [])].join(' ').toLowerCase().includes(query)
    ) : [];
  }, [published, searchQuery]);
  const title = path === '/' ? 'Traditional Menswear & Kidswear in Warangal' :
    collection ? collection.title : product ? product.title :
    path === '/search' ? 'Search Collections' : path === '/contact' ? 'Visit Our Showroom' : 'Page Not Found';

  return <div className="min-h-screen bg-[#fbf8f2]">
    <Helmet>
      <title>{title} | Nomaan Brothers</title>
      <meta name="description" content="Explore men's and kids' traditional occasionwear at Nomaan Brothers, Mandi Bazar, Warangal. Browse collections and enquire about styles." />
      <meta name="theme-color" content="#fbf8f2"/>
      <meta property="og:title" content={title + ' | Nomaan Brothers'} />
    </Helmet>
    <V2Header path={path} onNavigate={navigate}/>
    <main id="main-content" className="min-h-[40vh]">
      {path === '/' ? <V2Home products={published} onNavigate={navigate}/> :
       collection ? <V2Collection route={collection} products={published} onNavigate={navigate}/> :
       product ? <V2Product key={product.id} product={product} onNavigate={navigate}/> :
       path === '/search' ? <section className="mx-auto min-h-[70vh] max-w-[1360px] px-5 py-16 md:px-12">
         <V2Reveal>
           <p className="mb-5 text-[10px] font-bold uppercase tracking-[.24em] text-[#a37f50]">Discover the catalogue</p>
           <h1 className="font-serif text-[clamp(3rem,6vw,5.5rem)] tracking-[-.05em] text-[#29221c]">Search <em>collections</em></h1>
           <p className="mt-5 mb-12 text-sm text-[#817164]">{searchQuery ? 'Results for "' + searchQuery + '"' : 'Enter a product name or browse a collection.'} · {matches.length} styles</p>
         </V2Reveal>
         {matches.length ? <V2ProductGrid products={matches} onNavigate={navigate}/> :
          <div className="border border-[#e4d5c2] bg-[#f5ece0] px-7 py-14 text-center">
            <h2 className="font-serif text-3xl">No matching styles yet.</h2>
            <p className="mt-4 text-sm leading-7 text-[#766b5e]">Try searching for Sherwani, Kurta or Jodhpuri, or explore the departments.</p>
            <V2Link href="/men" onNavigate={navigate} className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[#805e38]">Browse Men's Wear <ArrowRight size={16}/></V2Link>
          </div>}
       </section> :
       path === '/contact' ? <section className="relative min-h-[70vh] overflow-hidden bg-[#2b241e] px-6 py-20 text-[#f8eddd] md:px-12 md:py-32">
         <div className="pointer-events-none absolute -right-24 top-0 h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,#644f38,transparent_70%)]"/>
         <div className="relative mx-auto max-w-[1050px]">
           <V2Link href="/" onNavigate={navigate} className="mb-12 inline-flex items-center gap-2 text-[11px] uppercase tracking-[.18em] text-[#dcc6a4]"><ArrowLeft size={15}/> Back home</V2Link>
           <p className="mb-7 text-[10px] font-bold uppercase tracking-[.27em] text-[#dcba85]">Visit the boutique</p>
           <h1 className="max-w-[12ch] font-serif text-[clamp(3.6rem,7vw,7rem)] leading-[1] tracking-[-.06em]">Your next look starts <em>here.</em></h1>
           <p className="mt-8 max-w-xl text-base leading-8 text-[#ded2c3]">Nomaan Brothers, Mandi Bazar, Warangal, Telangana. Ask about the collection, sizes and availability before your visit.</p>
           <div className="mt-10 flex flex-wrap gap-3">
             <a href="https://www.google.com/maps/search/?api=1&query=Nomaan+Brothers+Dresses+Mandi+Bazar+Warangal"
               target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center gap-3 bg-[#e2c9a4] px-7 text-xs font-bold uppercase tracking-[.12em] text-[#2b2118]">
               <MapPin size={17}/> Find directions <ArrowUpRight size={17}/>
             </a>
             <a href="https://wa.me/919908597337?text=Hello%20Nomaan%20Brothers%2C%20I%20would%20like%20to%20enquire%20about%20your%20collections."
               target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center gap-3 border border-[#e2c9a4] px-7 text-xs font-bold uppercase tracking-[.12em] text-[#f8e9d0]">
               <MessageCircle size={17}/> WhatsApp enquiry
             </a>
           </div>
           <p className="mt-12 max-w-lg text-xs leading-6 text-[#af9e8a]">Store details and the enquiry number are inherited from the existing site and require owner confirmation before public launch.</p>
         </div>
       </section> :
       <section className="mx-auto min-h-[60vh] max-w-3xl px-6 py-24 text-center">
         <p className="text-[10px] font-bold uppercase tracking-[.24em] text-[#9e7a4f]">404 / Unavailable collection</p>
         <h1 className="mt-7 font-serif text-5xl">We couldn't find this page.</h1>
         <p className="mt-6 text-sm text-[#74685d]">Use the collection navigation to discover available styles.</p>
         <V2Link href="/" onNavigate={navigate} className="mt-9 inline-flex min-h-12 items-center gap-3 bg-[#32271d] px-7 text-xs font-semibold uppercase tracking-[.12em] text-white">Return home <ArrowRight size={16}/></V2Link>
       </section>}
    </main>
    <V2Footer onNavigate={navigate}/>
  </div>;
}
