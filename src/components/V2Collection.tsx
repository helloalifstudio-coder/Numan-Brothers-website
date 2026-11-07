import React from 'react';
import { ArrowRight, ArrowUpRight, MapPin } from 'lucide-react';
import { CatalogProduct, productImage, productPath, productsForCollection } from '../storefront/catalog';
import { CollectionRoute, getDepartment, getRelatedCollectionLinks } from '../storefront/navigation';
import V2Link from './V2Link';
import V2Reveal from './V2Reveal';

interface Props { route: CollectionRoute; products: CatalogProduct[]; onNavigate: (path: string) => void; }
export function V2ProductGrid({ products, onNavigate }: { products: CatalogProduct[]; onNavigate: (path: string) => void }) {
  return <div className="grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-3 md:gap-x-6 md:gap-y-12 lg:grid-cols-4">
    {products.map((product, index) => (
      <V2Reveal key={product.id} delay={Math.min(index % 4, 3) * 0.04}>
        <V2Link href={productPath(product)} onNavigate={onNavigate} className="group block">
          <div className="relative aspect-[3/4] overflow-hidden bg-[#e9e0d2]">
            {productImage(product) ? <img src={productImage(product)} alt={product.title} loading="lazy" decoding="async"
              className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.06]" /> :
              <div className="flex h-full items-center justify-center font-serif text-3xl italic text-[#9a8668]">Nomaan</div>}
            <span className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#f8f3e9]/95 text-[#352b20] opacity-0 transition-all duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"><ArrowUpRight size={19}/></span>
          </div>
          <p className="mt-4 text-[9px] font-semibold uppercase tracking-[.18em] text-[#a17e4f]">Nomaan Brothers</p>
          <h3 className="mt-1.5 font-serif text-base leading-snug text-[#2d271f] md:text-xl">{product.title}</h3>
          {product.fabric && <p className="mt-1.5 text-xs leading-5 text-[#807366]">{product.fabric}</p>}
          <span className="mt-2 inline-flex items-center gap-2 text-[11px] font-medium text-[#82623f]">View garment <ArrowRight size={13}/></span>
        </V2Link>
      </V2Reveal>
    ))}
  </div>;
}

export default function V2Collection({ route, products, onNavigate }: Props) {
  const department = getDepartment(route.department);
  const links = getRelatedCollectionLinks(route.path).filter((item) => item.path !== route.path);
  const matches = productsForCollection(products, route.path);
  return <div className="min-h-[70vh] bg-[#fbf8f2] pb-24">
    <section className="relative overflow-hidden bg-[#2b241e] px-5 py-20 text-[#f7edde] md:px-12 md:py-28 lg:px-20">
      <div className="pointer-events-none absolute -right-24 -top-32 h-[510px] w-[510px] rounded-full border border-[#a28a6c]/20 bg-[radial-gradient(circle_at_center,#65513c,transparent_66%)]" aria-hidden="true"/>
      <div className="relative mx-auto max-w-[1330px]">
        <nav aria-label="Breadcrumb" className="mb-11 flex flex-wrap gap-2 text-[11px] uppercase tracking-[.15em] text-[#c6b59b]">
          <V2Link href="/" onNavigate={onNavigate}>Home</V2Link><span aria-hidden="true">/</span>
          {route.isDepartment ? <span aria-current="page">{department.title}</span> : <>
            <V2Link href={department.path} onNavigate={onNavigate}>{department.title}</V2Link><span aria-hidden="true">/</span><span aria-current="page">{route.title}</span>
          </>}
        </nav>
        <p className="mb-6 text-[10px] font-semibold uppercase tracking-[.28em] text-[#ddb98b]">The Nomaan edit / {department.title}</p>
        <h1 className="max-w-[850px] font-serif text-[clamp(3.4rem,7.5vw,7.4rem)] leading-[1] tracking-[-.06em]">{route.title}</h1>
        <p className="mt-7 max-w-xl text-sm leading-8 text-[#e0d2c1]">{route.description}</p>
      </div>
    </section>
    <div className="mx-auto max-w-[1440px] px-5 pt-12 md:px-12 lg:px-20">
      {links.length > 0 && (
        <section className="mb-16" aria-label="Related collection categories">
          <div className="mb-7 flex items-center justify-between border-b border-[#e2d7c8] pb-4">
            <h2 className="font-serif text-2xl text-[#2a241e]">Explore {department.title}</h2>
            <span className="text-[10px] uppercase tracking-[.15em] text-[#9c8059]">{links.length} categories</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {links.map((link) => (
              <V2Link key={link.path} href={link.path} onNavigate={onNavigate}
                className="inline-flex min-h-11 items-center gap-2 border border-[#ddcfbc] px-4 py-2 text-[12px] font-medium text-[#625342] transition-colors hover:border-[#9b7849] hover:bg-[#f1e7d7]">
                {link.label}<ArrowUpRight size={13}/>
              </V2Link>
            ))}
          </div>
        </section>
      )}
      <div className="mb-9 flex items-end justify-between gap-5 border-b border-[#e2d7c8] pb-5">
        <h2 className="font-serif text-[31px] tracking-[-.035em] text-[#2a241e] md:text-4xl">The collection</h2>
        <p className="text-xs text-[#84766a]">{matches.length} {matches.length === 1 ? 'style' : 'styles'}</p>
      </div>
      {matches.length ? <V2ProductGrid products={matches} onNavigate={onNavigate}/> :
        <V2Reveal className="relative overflow-hidden border border-[#dfd3c2] bg-[#f4ecdf] px-7 py-16 text-center md:py-24">
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-[.22em] text-[#9b784e]">Collection being curated</p>
          <h3 className="font-serif text-3xl text-[#29221c] md:text-5xl">Something special is on its way.</h3>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-8 text-[#74685b]">Photographs and confirmed products for this section will be added after the showroom catalogue is approved. Ask the store about current styles and availability.</p>
          <V2Link href="/contact" onNavigate={onNavigate} className="mt-8 inline-flex min-h-12 items-center gap-3 bg-[#2c241c] px-6 text-xs font-semibold uppercase tracking-[.1em] text-white">
            <MapPin size={15}/> Contact the showroom
          </V2Link>
        </V2Reveal>
      }
    </div>
  </div>;
}
