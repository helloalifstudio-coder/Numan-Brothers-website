import React from 'react';
import {Instagram,Facebook,Youtube,Pin,AtSign,Twitter,Music2,Ghost,Linkedin} from 'lucide-react';
import type {CmsHome,SocialKey} from '../lib/cmsData';
import {SOCIAL_KEYS,isSafeHttps} from '../lib/cmsData';

const DETAILS={
  instagram:{name:'Instagram',Icon:Instagram},
  facebook:{name:'Facebook',Icon:Facebook},
  youtube:{name:'YouTube',Icon:Youtube},
  pinterest:{name:'Pinterest',Icon:Pin},
  threads:{name:'Threads',Icon:AtSign},
  x:{name:'X',Icon:Twitter},
  tiktok:{name:'TikTok',Icon:Music2},
  snapchat:{name:'Snapchat',Icon:Ghost},
  linkedin:{name:'LinkedIn',Icon:Linkedin},
} as const satisfies Record<SocialKey,{name:string;Icon:typeof Instagram}>;
export default function SocialLinks({home,variant='dark'}:{home?:CmsHome;variant?:'dark'|'light'}){
  const links=SOCIAL_KEYS.filter(key=>home?.socialLinks?.[key]&&isSafeHttps(home.socialLinks[key]));
  if(links.length===0)return null;
  return <nav className="mt-6 flex flex-wrap items-center gap-3" aria-label="Official social media profiles">
    {links.map(key=>{
      const {name,Icon}=DETAILS[key];
      return <a key={key} href={home!.socialLinks[key]} target="_blank" rel="noopener noreferrer"
        title={'Nomaan Brothers on '+name} aria-label={'Visit Nomaan Brothers on '+name}
        className={'inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border transition-colors '+
          (variant==='dark'?'border-[#887258] text-[#f4e6d0] hover:bg-white/15':'border-[#b49a79] text-[#503723] hover:bg-[#e7d7bf]')}>
        <Icon size={19} strokeWidth={1.7}/>
      </a>;
    })}
  </nav>;
}
