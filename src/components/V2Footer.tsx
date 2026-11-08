import React from 'react';
import {ArrowUpRight,MapPin,Instagram,Facebook,Youtube} from 'lucide-react';
import V2Link from './V2Link';
import type {CmsHome,CmsCategoryRow} from '../lib/cmsData';
import {siteText} from '../lib/siteContent';

const men = [
  { label: 'Kurta Pyjama', path: '/men/kurta-pyjama' },
  { label: 'Sherwani', path: '/men/sherwani' },
  { label: 'Suits', path: '/men/suits' },
  { label: 'Jodhpuri', path: '/men/jodhpuri' },
  { label: 'Marriage Collection', path: '/men/marriage' },
];
const kids = [
  { label: 'Kurta Pyjama', path: '/kids/kurta-pyjama' },
  { label: 'Sherwani', path: '/kids/sherwani' },
  { label: 'Pathani', path: '/kids/pathani' },
  { label: 'Jodhpuri', path: '/kids/jodhpuri' },
  { label: 'Suits', path: '/kids/suits' },
];
export default function V2Footer({ onNavigate,home,categories=[] }: {onNavigate:(path:string)=>void;home?:CmsHome;categories?:CmsCategoryRow[]}) {
  const visible=(path:string)=>categories.length===0||categories.some(c=>c.path===path);
  const label=(path:string,fallback:string)=>categories.find(c=>c.path===path)?.label||fallback;
  return <footer className="bg-[#1d1916] px-6 pt-20 text-[#eee4d5] md:px-12 md:pt-24 lg:px-20">
    <div className="mx-auto max-w-[1330px]">
      <div className="grid gap-10 border-b border-[#594738] pb-16 sm:grid-cols-2 md:gap-12 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:pb-20">
        <div className="max-w-xs">
          <V2Link href="/" onNavigate={onNavigate} className="font-serif text-4xl leading-[1.05] tracking-[-.05em]">{siteText(home,'footer.brand')}</V2Link>
          <p className="mt-5 text-[10px] font-semibold uppercase tracking-[.23em] text-[#d8b586]">{siteText(home,'footer.tagline')}</p>
          <p className="mt-7 text-sm leading-8 text-[#b9aa9a]">{siteText(home,'footer.description')}</p>
        </div>
        <div>
          <h2 className="mb-6 text-[10px] font-bold uppercase tracking-[.22em] text-[#cfae81]">{siteText(home,'footer.men')}</h2>
          <ul className="space-y-4">{men.filter(item=>visible(item.path)).map((item) => <li key={item.path}><V2Link href={item.path} onNavigate={onNavigate} className="text-sm text-[#cfc3b5] transition-colors hover:text-white">{label(item.path,item.label)}</V2Link></li>)}</ul>
        </div>
        <div>
          <h2 className="mb-6 text-[10px] font-bold uppercase tracking-[.22em] text-[#cfae81]">{siteText(home,'footer.kids')}</h2>
          <ul className="space-y-4">{kids.filter(item=>visible(item.path)).map((item) => <li key={item.path}><V2Link href={item.path} onNavigate={onNavigate} className="text-sm text-[#cfc3b5] transition-colors hover:text-white">{label(item.path,item.label)}</V2Link></li>)}</ul>
        </div>
        <div>
          <h2 className="mb-6 text-[10px] font-bold uppercase tracking-[.22em] text-[#cfae81]">{siteText(home,'footer.find')}</h2>
          <p className="flex items-start gap-3 text-sm leading-7 text-[#cfc3b5]"><MapPin size={18} className="mt-1 shrink-0"/> {siteText(home,'footer.address')}</p>
          <V2Link href="/contact" onNavigate={onNavigate} className="mt-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[.12em] text-[#e6c69d]">{siteText(home,'footer.cta')} <ArrowUpRight size={16}/></V2Link>
          <nav className="mt-6 flex items-center gap-3" aria-label="Social media profiles">
            {([
              ['instagram',Instagram,'Instagram'],['facebook',Facebook,'Facebook'],['youtube',Youtube,'YouTube'],
            ] as const).map(([key,Icon,label])=>
              home?.socialLinks[key]&&<a key={key} href={home.socialLinks[key]} target="_blank" rel="noopener noreferrer"
                aria-label={'Open our '+label} className="flex h-11 w-11 items-center justify-center rounded-full border border-[#887258] hover:bg-white/15">
                <Icon size={18}/></a>)}
          </nav>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 py-7 text-[10px] font-semibold uppercase tracking-[.15em] text-[#998b7c]">
        <span>© {new Date().getFullYear()} {siteText(home,'footer.brand')}. {siteText(home,'footer.copyright')}</span>
        <span>{siteText(home,'footer.slogan')}</span>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2 border-t border-[#3c332a] py-5 text-xs text-[#b9ad9c]">
        <span>Website by</span>
        <a href="https://alif-growth-media.vercel.app/" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 font-semibold text-[#f2d4a1] underline-offset-4 hover:underline">
          <img src="https://alif-growth-media.vercel.app/favicon.png" alt="" loading="lazy"
            className="h-7 w-7 rounded-md object-contain"/>Alif Growth Media <ArrowUpRight size={14}/>
        </a>
      </div>
    </div>
  </footer>;
}
