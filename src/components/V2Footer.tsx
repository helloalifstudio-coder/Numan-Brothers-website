import React from 'react';
import { ArrowUpRight, MapPin } from 'lucide-react';
import V2Link from './V2Link';

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
export default function V2Footer({ onNavigate }: { onNavigate: (path: string) => void }) {
  return <footer className="bg-[#1d1916] px-6 pt-20 text-[#eee4d5] md:px-12 md:pt-24 lg:px-20">
    <div className="mx-auto max-w-[1330px]">
      <div className="grid gap-12 border-b border-[#594738] pb-20 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div className="max-w-xs">
          <V2Link href="/" onNavigate={onNavigate} className="font-serif text-4xl leading-[1.05] tracking-[-.05em]">Nomaan <em>Brothers</em></V2Link>
          <p className="mt-5 text-[10px] font-semibold uppercase tracking-[.23em] text-[#d8b586]">The Designer Sherwani House</p>
          <p className="mt-7 text-sm leading-8 text-[#b9aa9a]">Traditional occasionwear for men and kids, presented with a sense of heritage and celebration.</p>
        </div>
        <div>
          <h2 className="mb-6 text-[10px] font-bold uppercase tracking-[.22em] text-[#cfae81]">Men's Wear</h2>
          <ul className="space-y-4">{men.map((item) => <li key={item.path}><V2Link href={item.path} onNavigate={onNavigate} className="text-sm text-[#cfc3b5] transition-colors hover:text-white">{item.label}</V2Link></li>)}</ul>
        </div>
        <div>
          <h2 className="mb-6 text-[10px] font-bold uppercase tracking-[.22em] text-[#cfae81]">Kids Wear</h2>
          <ul className="space-y-4">{kids.map((item) => <li key={item.path}><V2Link href={item.path} onNavigate={onNavigate} className="text-sm text-[#cfc3b5] transition-colors hover:text-white">{item.label}</V2Link></li>)}</ul>
        </div>
        <div>
          <h2 className="mb-6 text-[10px] font-bold uppercase tracking-[.22em] text-[#cfae81]">Find Us</h2>
          <p className="flex items-start gap-3 text-sm leading-7 text-[#cfc3b5]"><MapPin size={18} className="mt-1 shrink-0"/> Mandi Bazar, Warangal, Telangana</p>
          <V2Link href="/contact" onNavigate={onNavigate} className="mt-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[.12em] text-[#e6c69d]">Visit / Enquire <ArrowUpRight size={16}/></V2Link>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 py-7 text-[10px] font-semibold uppercase tracking-[.15em] text-[#998b7c]">
        <span>© {new Date().getFullYear()} Nomaan Brothers. All rights reserved.</span>
        <span>Tradition in every occasion · Warangal</span>
      </div>
    </div>
  </footer>;
}
