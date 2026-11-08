import React, { useState } from 'react';
import { ArrowRight, ArrowUpRight, Compass, Sparkles } from 'lucide-react';
import type { Product } from '../types';
import type {CmsHome,CmsCategoryRow} from '../lib/cmsData';
import {siteText} from '../lib/siteContent';
import { productImage, productsForCollection } from '../storefront/catalog';
import { getDepartment, type DepartmentId } from '../storefront/navigation';
import V2Link from './V2Link';
import V2Reveal from './V2Reveal';

interface Props {
  products: Product[];
  home: CmsHome;
  categories?: CmsCategoryRow[];
  onNavigate: (path: string) => void;
}

/**
 * A single navigational map of the existing CMS taxonomy. All destinations
 * are registered collection routes, not manually repeated links or mock data.
 */
export default function V2HomeDiscovery({ products, home, categories=[], onNavigate }: Props) {
  const [active, setActive] = useState<DepartmentId>('men');
  const department = getDepartment(active);
  const photo = active === 'kids'
    ? home.kidsImage || productImage(productsForCollection(products, '/kids')[0] || {} as Product)
    : home.menImage || productImage(productsForCollection(products, '/men')[0] || {} as Product);
  const featured = active === 'men'
    ? siteText(home,'home.directoryMen')
    : siteText(home,'home.directoryKids');
  const visible=(path:string)=>categories.length===0||categories.some(c=>c.path===path);
  const label=(path:string,fallback:string)=>categories.find(c=>c.path===path)?.label||fallback;
  const cards=department.groups.map(group=>({...group,
    items:group.items.filter(item=>visible(item.path))})).filter(group=>group.items.length>0);
  return <section id="collection-directory" className="scroll-mt-28 border-y border-[#dacebd] bg-[#eae2d6] px-5 py-20 md:px-12 md:py-28 lg:px-20"
    aria-labelledby="directory-title">
    <div className="mx-auto max-w-[1330px]">
      <V2Reveal className="flex flex-wrap items-end justify-between gap-7">
        <div className="max-w-[760px]">
          <p className="mb-4 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.26em] text-[#876641]"><Compass size={15}/> {siteText(home,'home.directoryEyebrow')}</p>
          <h2 id="directory-title" className="font-serif break-words text-[clamp(2.45rem,5.8vw,5.8rem)] leading-[1.04] tracking-[-.055em] text-[#28221c]">
            {siteText(home,'home.directoryTitle')}
          </h2>
          <p className="mt-6 max-w-xl text-sm leading-7 text-[#665a4c]">{siteText(home,'home.directoryDescription')}</p>
        </div>
        <V2Link href="/search" onNavigate={onNavigate}
          className="inline-flex min-h-12 items-center gap-3 border-b border-[#9d7b51] text-[11px] font-bold uppercase tracking-[.14em] text-[#62472b]">
          {siteText(home,'home.directorySearch')} <ArrowUpRight size={17}/>
        </V2Link>
      </V2Reveal>
      <div className="mt-11 flex w-full max-w-[520px] min-w-0 gap-1 rounded-full border border-[#c9b69b] bg-[#f6f0e6]/65 p-1 sm:mt-14 sm:gap-2 sm:p-1.5" role="group" aria-label="Choose a collection department">
        {(['men','kids'] as const).map(id => <button key={id} type="button"
          aria-pressed={active === id} onClick={() => setActive(id)}
          className={'flex min-h-12 min-w-0 flex-1 items-center justify-center gap-1 rounded-full px-2 text-[11px] font-bold uppercase tracking-[.06em] transition-colors min-[360px]:gap-3 min-[360px]:px-5 min-[360px]:text-xs min-[360px]:tracking-[.12em] '+
            (active === id ? 'bg-[#29221b] text-[#f7ead5] shadow-md' : 'text-[#655647] hover:bg-white/75')}>
          {getDepartment(id).title} <ArrowRight size={15} className={active === id ? 'opacity-100' : 'opacity-45'}/>
        </button>)}
      </div>
      <div className="nb-responsive-grid mt-7 grid gap-5 lg:grid-cols-[minmax(0,.78fr)_minmax(0,1.22fr)]">
        <div className="relative isolate min-h-[310px] overflow-hidden bg-[#342a22] text-white md:min-h-[400px] lg:min-h-[530px]">
          {photo ? <img key={active + photo} src={photo} alt="" loading="lazy" decoding="async"
            className="absolute inset-0 h-full w-full object-cover object-top opacity-65 motion-safe:animate-[nb-ambient-arrival_850ms_ease-out_both]"/> :
            <div className={'absolute inset-0 ' + (active==='men' ?
              'bg-[radial-gradient(ellipse_at_65%_10%,#a27e58_0%,transparent_55%),linear-gradient(135deg,#3b2d23,#171512)]' :
              'bg-[radial-gradient(ellipse_at_45%_20%,#c4a27b_0%,transparent_60%),linear-gradient(130deg,#6f5543,#29231e)]')}/>}
          <div className="absolute inset-0 bg-gradient-to-t from-[#191510]/95 via-[#191510]/35 to-[#191510]/15"/>
          <div className="relative flex h-full min-h-[310px] flex-col justify-between p-7 md:min-h-[400px] md:p-10 lg:min-h-[530px]">
            <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.21em] text-[#f0d6ad]"><Sparkles size={15}/> Discover / {active==='men'?'01':'02'}</span>
            <div>
              <h3 className="font-serif break-words text-[clamp(2.3rem,4.7vw,5.5rem)] leading-[1.04] tracking-[-.055em]">{siteText(home,active==='men'?'home.menCardTitle':'home.kidsCardTitle')}</h3>
              <p className="mt-5 max-w-sm text-sm leading-7 text-[#efdec7]">{featured}</p>
              <V2Link href={department.path} onNavigate={onNavigate}
                className="mt-7 inline-flex min-h-12 max-w-full flex-wrap items-center gap-2 border border-[#f1dabc]/80 px-4 min-[360px]:gap-3 min-[360px]:px-6 text-[11px] font-semibold uppercase tracking-[.12em] text-white transition-colors hover:bg-[#f3dfbd] hover:text-[#29221b]">
                Explore all {siteText(home,active==='men'?'home.menCardTitle':'home.kidsCardTitle')} <ArrowUpRight size={17}/>
              </V2Link>
            </div>
          </div>
        </div>
        <div key={active} className={'nb-responsive-grid grid min-w-0 content-start gap-3 sm:grid-cols-2 ' + (cards.length===1?'sm:grid-cols-1':'')}>
          {cards.map((group, index) =>
            <div key={group.title} className="border border-[#d6c7b2] bg-[#f8f3e9] p-6 shadow-[0_15px_32px_-28px_rgba(50,35,15,.5)] md:p-7">
              <div className="flex items-start justify-between gap-3 border-b border-[#e3d7c5] pb-5">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#a58358]">{String(index+1).padStart(2,'0')} / Edit</span>
                  <h4 className="mt-2 font-serif text-[23px] leading-tight tracking-[-.03em] text-[#30251c]">{group.title}</h4>
                </div>
                {group.landingPath && <V2Link href={group.landingPath} onNavigate={onNavigate}
                  aria-label={'Explore all '+group.title}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#b99d78] text-[#715233] transition-colors hover:bg-[#efe1cd]">
                  <ArrowUpRight size={19}/>
                </V2Link>}
              </div>
              <ul className="mt-3">
                {group.items.map(item=><li key={item.path}>
                  <V2Link href={item.path} onNavigate={onNavigate}
                    className="group/link flex min-h-11 items-center justify-between gap-3 border-b border-[#e7ddcf]/80 py-3 text-[13px] font-medium text-[#625548] transition-colors hover:text-[#8b633b]">
                    <span>{label(item.path,item.label)}</span>
                    <ArrowRight size={15} className="shrink-0 opacity-55 transition-transform group-hover/link:translate-x-1 group-hover/link:opacity-100"/>
                  </V2Link>
                </li>)}
              </ul>
            </div>
          )}
        </div>
      </div>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[#cfc0a9] pt-6 text-xs text-[#786754]">
        <p>{siteText(home,'home.directoryBottom')}</p>
        <V2Link href="/contact" onNavigate={onNavigate} className="inline-flex min-h-11 items-center gap-2 font-semibold text-[#765536] hover:underline">
          {siteText(home,'home.directoryContact')} <ArrowUpRight size={16}/>
        </V2Link>
      </div>
    </div>
  </section>;
}
