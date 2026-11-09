import React from 'react';
import {SOCIAL_KEYS,isValidSocialProfile} from '../lib/cmsData';
import type {CmsHome,SocialKey} from '../lib/cmsData';

const LABELS:Record<SocialKey,string>={
  instagram:'Instagram',facebook:'Facebook',youtube:'YouTube',
  pinterest:'Pinterest',threads:'Threads',x:'X',tiktok:'TikTok',
  snapchat:'Snapchat',linkedin:'LinkedIn',
};
const ICONS:Record<SocialKey,string>=Object.fromEntries(
  SOCIAL_KEYS.map(key=>[key,'/social/'+key+'.svg'])
) as Record<SocialKey,string>;

interface Props {
  home?:CmsHome;
  variant?:'dark'|'light';
  showUnconfigured?:boolean;
}
/** An unconfigured social platform remains visibly branded but is never
 * linked to a guessed account, the platform homepage, or a phishing domain. */
export default function SocialLinks({home,variant='dark',showUnconfigured=false}:Props){
  const configured=SOCIAL_KEYS.filter(key=>isValidSocialProfile(key,home?.socialLinks?.[key]||''));
  if(!showUnconfigured && !configured.length)return null;

  const dark=variant==='dark';
  const itemBase='inline-flex min-h-12 min-w-12 shrink-0 items-center justify-center rounded-full border transition-[color,background-color,border-color,transform] duration-200';
  const activeColor=dark
    ? 'border-[#987d5f] bg-[#3a2f26] text-[#f3e4cb] hover:-translate-y-0.5 hover:border-[#e1c292] hover:bg-[#604832] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#f2d4a1]'
    : 'border-[#ac9273] bg-white text-[#533d26] hover:-translate-y-0.5 hover:bg-[#e7d8c1] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#926837]';
  const pendingColor=dark
    ? 'cursor-default border-[#655443] bg-[#2a231d] text-[#907f6c] opacity-75'
    : 'cursor-default border-[#d9cab4] bg-[#f3eee5] text-[#aa9a88] opacity-75';

  return <div className="min-w-0" data-testid="social-profile-icons">
    <nav className="flex flex-wrap items-center gap-2.5" aria-label="Nomaan Brothers social media channels">
      {SOCIAL_KEYS.map(key=>{
        const name=LABELS[key];
        const url=home?.socialLinks?.[key]||'';
        const enabled=isValidSocialProfile(key,url);
        if(!enabled&&!showUnconfigured)return null;
        const icon=<img src={ICONS[key]} alt="" aria-hidden="true" loading="lazy" decoding="async"
          className={'h-5 w-5 object-contain '+(dark?'brightness-0 invert':'brightness-0')}/>;
        return enabled
          ? <a key={key} href={url.trim()} target="_blank" rel="noopener noreferrer"
              aria-label={'Visit Nomaan Brothers on '+name} title={'Official '+name+' profile'}
              className={itemBase+' '+activeColor}>{icon}</a>
          : <span key={key} aria-label={name+' profile not connected yet'} role="img"
              title={name+' — official account not yet connected'}
              className={itemBase+' '+pendingColor}>{icon}</span>;
      })}
    </nav>
    {showUnconfigured&&configured.length===0&&
      <p className={'mt-3 max-w-[33ch] text-xs leading-5 '+(dark?'text-[#b0a08e]':'text-[#786b5d]')}>
        Official social profiles will be linked here once the showroom adds them.
      </p>}
  </div>;
}
