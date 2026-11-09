import React, { useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import {type CmsHome,HOME_TEMPLATE,cleanHome,isSafeHttps,isValidSocialProfile,SOCIAL_KEYS,POLICY_KEYS} from '../../lib/cmsData';
import { SITE_PAGES,SITE_FIELDS,siteText,HOME_SECTIONS,FEATURED_CARDS,normalizeOrder,type SitePage } from '../../lib/siteContent';
import {ErrorText,Field,inputClass,outlineClass,primaryClass} from './StudioShared';
import AssetEditor from './AssetEditor';

interface Props {client:SupabaseClient; userId:string; canPublish:boolean; }
export default function CmsHomepage({client,userId,canPublish}:Props) {
  const [form,setForm]=useState<CmsHome>(HOME_TEMPLATE);
  const [publishedForm,setPublishedForm]=useState<CmsHome>(HOME_TEMPLATE);
  const [videoEditor,setVideoEditor]=useState<string|null>(null);
  const [page,setPage]=useState<SitePage>('home');
  const [dragged,setDragged]=useState<string|null>(null);
  const [version,setVersion]=useState<number|null>(null);
  const [history,setHistory]=useState<{id:number;version:number;published_at:string}[]>([]);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState<string|null>(null);
  const [error,setError]=useState<string|null>(null);
  useEffect(()=>{
    let active=true;
    const load=async()=>{
      const [draft,published,revisions] = await Promise.all([
        client.from('nb_home_drafts').select('content').eq('key','home').maybeSingle(),
        client.from('nb_home_public').select('content,version').eq('key','home').maybeSingle(),
        client.from('nb_home_revisions').select('id,version,published_at').eq('key','home')
          .order('version',{ascending:false}).limit(15),
      ]);
      if(!active)return;
      setError(draft.error?.message || published.error?.message || revisions.error?.message || null);
      setHistory((revisions.data||[]) as {id:number;version:number;published_at:string}[]);
      setForm(cleanHome(draft.data?.content ?? published.data?.content));
      setPublishedForm(cleanHome(published.data?.content));
      setVersion(typeof published.data?.version==='number'?published.data.version:null);
      setLoading(false);
    };
    void load();return()=>{active=false};
  },[client]);
  type HomeTextKey='heroTitle'|'heroEyebrow'|'heroSubtitle'|'heroImage'|'menImage'|'kidsImage'|'storyTitle'|'storyDescription'|'storyImage'|'contactWhatsapp'|'contactPhone'|'customizationImage';
  const update=(key:HomeTextKey,value:string)=>setForm(current=>({...current,[key]:value}));
  const updateCopy=(key:string,value:string)=>setForm(current=>({...current,siteText:{...current.siteText,[key]:value}}));
  const move=(field:'sectionOrder'|'featuredOrder',source:string,target:string)=>{
    setForm(current=>{
      const next=[...current[field]],from=next.indexOf(source),to=next.indexOf(target);
      if(from<0||to<0||from===to)return current;
      next.splice(from,1);next.splice(to,0,source);
      return {...current,[field]:next};
    });
  };
  const resetSection=(id:string,kind:'published'|'original')=>{
    const source=kind==='published'?publishedForm:HOME_TEMPLATE;
    const groups:Record<string,string[]>={
      hero:['Hero'],quick:['Quick links'],departments:['Department tiles'],
      directory:['Directory'],featured:['Featured cards'],story:['Story'],
      customization:['Customization'],visit:['Visit'],
    };
    const core:Record<string,HomeTextKey[]>={
      hero:['heroTitle','heroEyebrow','heroSubtitle','heroImage'],
      departments:['menImage','kidsImage'],story:['storyTitle','storyDescription','storyImage'],
      customization:['customizationImage'],visit:['contactWhatsapp','contactPhone'],
    };
    setForm(current=>{
      const text={...current.siteText};
      for(const field of SITE_FIELDS.home){
        if(!groups[id]?.includes(field.section))continue;
        if(Object.hasOwn(source.siteText,field.key))text[field.key]=source.siteText[field.key];
        else delete text[field.key];
      }
      const sectionVideos={...current.sectionVideos};
      if(source.sectionVideos[id])sectionVideos[id]=source.sectionVideos[id];
      else delete sectionVideos[id];
      const updated={...current,siteText:text,sectionVideos,featuredImages:id==='featured'?{...source.featuredImages}:current.featuredImages};
      for(const key of core[id]||[])Object.assign(updated,{[key]:source[key]});
      return updated;
    });
    setMessage('Section reset to '+(kind==='published'?'last published':'original template')+' content. Save and publish to update the website.');
  };
  const toggle=(id:string)=>setForm(current=>({...current,
    hiddenSections:current.hiddenSections.includes(id)?current.hiddenSections.filter(x=>x!==id):[...current.hiddenSections,id],
  }));
  const ordered=(field:'sectionOrder'|'featuredOrder',items:readonly {id:string;title:string;description?:string}[])=>
    <ol className="space-y-2" aria-label={field==='sectionOrder'?'Homepage section order':'Featured card order'}>
      {normalizeOrder(form[field],items.map(x=>x.id)).map((id,index,all)=>{
        const item=items.find(x=>x.id===id)!;
        return <li key={id} draggable onDragStart={()=>setDragged(id)} onDragOver={e=>e.preventDefault()}
          onDrop={e=>{e.preventDefault();if(dragged)move(field,dragged,id);setDragged(null)}}
          onDragEnd={()=>setDragged(null)} className="flex flex-wrap items-center gap-3 rounded-lg border border-stone-200 bg-white p-3">
          <span aria-hidden="true" className="cursor-grab text-lg text-stone-500">⋮⋮</span>
          <div className="min-w-0 flex-1"><strong className="text-sm">{index+1}. {item.title}</strong>
            {item.description&&<p className="mt-1 text-xs text-stone-500">{item.description}</p>}</div>
          <button type="button" className={outlineClass} disabled={index===0} onClick={()=>move(field,id,all[index-1])}>↑</button>
          <button type="button" className={outlineClass} disabled={index===all.length-1} onClick={()=>move(field,id,all[index+1])}>↓</button>
          {field==='sectionOrder'&&id!=='hero'&&<button type="button" className={outlineClass}
            aria-pressed={!form.hiddenSections.includes(id)} onClick={()=>toggle(id)}>
            {form.hiddenSections.includes(id)?'Show':'Hide'}</button>}
          {field==='sectionOrder'&&<>
            <div className="flex w-full flex-wrap gap-2 border-t border-stone-100 pt-2">
              <button type="button" className={outlineClass} onClick={()=>resetSection(id,'published')}>Revert section to live</button>
              <button type="button" className={outlineClass} onClick={()=>resetSection(id,'original')}>Restore original</button>
              <button type="button" className={outlineClass} onClick={()=>setVideoEditor(x=>x===id?null:id)}>
                {form.sectionVideos[id]?'Edit / remove video':'Add video'}
              </button>
            </div>
            {videoEditor===id&&<div className="w-full">
              <AssetEditor client={client} userId={userId} canPublish={canPublish}
                label={item.title+' · section video'} allowVideo
                selected={form.sectionVideos[id]?[form.sectionVideos[id]]:[]}
                onChange={urls=>setForm(current=>{
                  const sectionVideos={...current.sectionVideos};
                  if(urls[0])sectionVideos[id]=urls[0];else delete sectionVideos[id];
                  return {...current,sectionVideos};
                })}/>
            </div>}
          </>}
        </li>;
      })}
    </ol>;
  const save=async():Promise<boolean>=>{
    setSaving(true);setError(null);setMessage(null);
    try {
      if(form.heroTitle.trim().length<4)throw new Error('Hero headline must have at least four characters.');
      if(form.contactWhatsapp && !/^[1-9][0-9]{9,14}$/.test(form.contactWhatsapp))throw new Error('WhatsApp must be a verified international number (10–15 digits, including country code).');
      if(form.contactPhone && !/^[1-9][0-9]{9,14}$/.test(form.contactPhone))
        throw new Error('Phone number must contain an international country code, digits only.');
      if(SOCIAL_KEYS.some(key=>form.socialLinks[key].trim()&&!isValidSocialProfile(key,form.socialLinks[key])))
        throw new Error('Each social profile must be a valid HTTPS link to the matching platform account, not a general website or another service.');
      const content=cleanHome(form);
      const byteCount=new TextEncoder().encode(JSON.stringify(content)).length;
      if(byteCount>28000)throw new Error('Website content is too long ('+byteCount+' bytes). Shorten long paragraphs before saving.');
      const {error}=await client.from('nb_home_drafts').upsert({
        key:'home', content,updated_by:userId,
      },{onConflict:'key'});
      if(error)throw error;
      setMessage('Draft saved. Visitors are still seeing the last published version.');
      return true;
    }catch(e){setError(e instanceof Error?e.message:'Unable to save the draft.');return false}
    finally{setSaving(false)}
  };
  const publish=async()=>{
    if(!canPublish)return;
    if(!await save())return;
    setSaving(true);
    const {data,error}=await client.rpc('nb_publish_home');
    setSaving(false);
    if(error){setError(error.message);return;}
    setVersion(Number(data));
    setPublishedForm(cleanHome(form));
    const latest=await client.from('nb_home_revisions')
      .select('id,version,published_at').eq('key','home').order('version',{ascending:false}).limit(15);
    if(latest.error)setError(latest.error.message);
    else setHistory((latest.data||[]) as {id:number;version:number;published_at:string}[]);
    setMessage('Website content version '+data+' is published. Reload the public pages to see it.');
  };
  const assets = (key:'heroImage'|'menImage'|'kidsImage'|'storyImage'|'customizationImage',label:string)=>
    <AssetEditor client={client} userId={userId} canPublish={canPublish} label={label}
      selected={form[key]?[form[key]]:[]} onChange={urls=>update(key,urls[0]||'')}/>;

  return <section className="min-w-0 max-w-5xl space-y-7">
    <div><h2 className="font-serif text-3xl">Website CMS</h2>
      <p className="mt-2 text-sm text-stone-600">Manage every website page in one organized workspace. Change text, adjust cards and drag sections up or down. Save a private draft before publishing.</p>
      <p className="mt-2 text-xs font-semibold text-amber-800">Current published version: {version ?? 'None yet'}</p>
    </div>
    <nav className="flex max-w-full gap-2 overflow-x-auto overscroll-x-contain scroll-px-4 pb-3 lg:flex-wrap" aria-label="Website CMS page selector">
      {SITE_PAGES.map(tab=><button type="button" key={tab.id} className={(page===tab.id?primaryClass:outlineClass)+' shrink-0'}
        aria-current={page===tab.id?'page':undefined} onClick={()=>setPage(tab.id)}>{tab.title}</button>)}
    </nav>
    {loading?<p className="text-sm">Loading website content…</p>:<>
      {page==='home'&&<section className="space-y-5 rounded-xl border border-[#e1d4bf] bg-[#f5efe5] p-5 md:p-7">
        <div><h3 className="font-serif text-2xl">Drag-and-drop homepage layout</h3>
          <p className="mt-2 text-xs leading-6 text-stone-600">Drag the handle or use arrows to move sections up or down. Hide optional sections without deleting their content. The hero always remains available.</p></div>
        {ordered('sectionOrder',HOME_SECTIONS)}
        <div className="border-t border-[#e0cfb7] pt-4"><h4 className="mb-4 font-semibold">Featured garment cards</h4>
          {ordered('featuredOrder',FEATURED_CARDS)}</div>
        <div className="flex flex-wrap gap-3 border-t border-stone-300 pt-3">
          <button type="button" className={outlineClass} onClick={()=>setForm(current=>({...current,sectionOrder:[...publishedForm.sectionOrder],featuredOrder:[...publishedForm.featuredOrder],hiddenSections:[...publishedForm.hiddenSections]}))}>
            Revert layout to published</button>
          <button type="button" className={outlineClass} onClick={()=>setForm(current=>({...current,sectionOrder:[...HOME_TEMPLATE.sectionOrder],featuredOrder:[...HOME_TEMPLATE.featuredOrder],hiddenSections:[]}))}>
            Restore original layout</button>
        </div>
      </section>}
      {page==='home'&&<div className="nb-responsive-grid grid gap-5 rounded-lg border border-stone-200 bg-white p-4 md:grid-cols-2 md:p-7">
        <div className="md:col-span-2"><h3 className="font-serif text-2xl">Main hero</h3></div>
        <Field label="Headline"><input className={inputClass} value={form.heroTitle} maxLength={180} onChange={e=>update('heroTitle',e.target.value)}/></Field>
        <Field label="Eyebrow label"><input className={inputClass} value={form.heroEyebrow} maxLength={100} onChange={e=>update('heroEyebrow',e.target.value)}/></Field>
        <div className="md:col-span-2"><Field label="Introduction"><textarea rows={3} className={inputClass} value={form.heroSubtitle} onChange={e=>update('heroSubtitle',e.target.value)}/></Field></div>
        <div className="md:col-span-2">{assets('heroImage','Hero poster / background photograph')}</div>
         <div className="md:col-span-2 rounded-lg border border-[#e3cfb3] bg-[#fff8eb] p-4">
           <h3 className="mb-2 font-serif text-xl">Five-second cinematic brand introduction</h3>
           <p className="mb-3 text-xs leading-6 text-stone-600">Upload an approved MP4/WebM film. On opening the homepage it plays muted and inline for five seconds, slides left, and reveals the main hero. Visitors can skip; reduced-motion/data-saver visitors see the main hero immediately. Without a film, a branded animated poster runs the same introduction. The main hero poster and copy stay editable below.</p>
           <AssetEditor client={client} userId={userId} canPublish={canPublish} allowVideo label="Hero opening film · MP4/WebM, portrait-safe crop"
             selected={form.sectionVideos.hero?[form.sectionVideos.hero]:[]}
             onChange={urls=>setForm(current=>({...current,sectionVideos:{...current.sectionVideos,hero:urls[0]||''}}))}/>
           <p className="mt-3 text-xs leading-6 text-stone-600">For fast mobile playback use a compressed H.264 MP4, 5–8 seconds, ideally under 5 MB. Keep the subject centered because phone and desktop crops differ. The video starts muted. Upload via Media, save your draft, then publish before reviewing.</p>
           <a href="/" target="_blank" rel="noopener noreferrer"
             className="mt-4 inline-flex min-h-11 items-center border-b border-[#99744a] text-xs font-semibold text-[#674b2d] hover:text-[#2e2115]">
             Preview published cinematic introduction ↗
           </a>
         </div>
        <div className="md:col-span-2 border-t border-stone-200 pt-6"><h3 className="font-serif text-2xl">Department cover images</h3></div>
        <div>{assets('menImage',"Men's Wear photograph")}</div>
        <div>{assets('kidsImage',"Kids Wear photograph")}</div>
        <div className="md:col-span-2 border-t border-stone-200 pt-6"><h3 className="font-serif text-2xl">Story section</h3></div>
        <Field label="Section heading"><input className={inputClass} value={form.storyTitle} onChange={e=>update('storyTitle',e.target.value)} maxLength={180}/></Field>
        <div className="md:col-span-2"><Field label="Short story"><textarea rows={4} className={inputClass} value={form.storyDescription} onChange={e=>update('storyDescription',e.target.value)}/></Field></div>
        <div className="md:col-span-2">{assets('storyImage','Story photograph')}</div>
        <div className="md:col-span-2 border-t border-stone-200 pt-6"><h3 className="font-serif text-2xl">Customization section artwork</h3></div>
        <div className="md:col-span-2">{assets('customizationImage','Tailoring and customization photograph')}</div>
        <div className="md:col-span-2 border-t border-stone-200 pt-6"><h3 className="font-serif text-2xl">Contact information</h3>
          <p className="mt-2 text-xs leading-6 text-stone-600">Publish the verified business numbers to enable direct WhatsApp and Call floating buttons after the hero. Until then, visitors see a Contact showroom button, never a broken or unverified phone link.</p></div>
        <div className="md:col-span-2"><Field label="Verified WhatsApp number including country code (digits only, e.g. 91XXXXXXXXXX)">
          <input type="tel" className={inputClass} maxLength={15} value={form.contactWhatsapp}
            onChange={e=>update('contactWhatsapp',e.target.value.replace(/[^0-9]/g,''))} placeholder="Not published"/>
        </Field></div>
        <div className="md:col-span-2"><Field label="Phone number with country code (e.g. 918XXXXXXXXX)">
          <input type="tel" className={inputClass} value={form.contactPhone} maxLength={15}
            onChange={e=>update('contactPhone',e.target.value.replace(/[^0-9]/g,''))}
            placeholder="Not published until saved and approved"/>
        </Field></div>
      </div>}
      {page==='home'&&<section className="space-y-4 rounded-lg border border-stone-200 bg-white p-4 md:p-7">
         <h3 className="font-serif text-2xl">Featured style photography</h3>
         <p className="text-xs leading-6 text-stone-600">Choose approved photographs for each of the three homepage cards. Leave blank to use the first published garment photograph from that collection.</p>
         <div className="grid gap-4 xl:grid-cols-3">
           {(['one','two','three'] as const).map((key,index)=><AssetEditor key={key}
             client={client} userId={userId} canPublish={canPublish}
             label={['Sherwani card','Kurta card','Jodhpuri card'][index]}
             selected={form.featuredImages[key]?[form.featuredImages[key]]:[]}
             onChange={urls=>setForm(current=>({...current,featuredImages:{...current.featuredImages,[key]:urls[0]||''}}))}/>)}
         </div>
       </section>}
       {page==='policies'&&<section className="space-y-6 rounded-lg border border-stone-200 bg-white p-4 md:p-7">
         <h3 className="font-serif text-2xl">Owner-approved store policies</h3>
         <p className="text-xs leading-6 text-stone-600">Do not publish invented return windows, refund promises or legal terms. Confirm the wording with the shop owner and legal adviser. An empty policy displays a clear contact message.</p>
         {POLICY_KEYS.map(key=><Field key={key} label={key==='privacy'?'Privacy policy':key==='terms'?'Terms & conditions':'Returns & exchanges'}>
           <textarea className={inputClass} rows={9} maxLength={6000}
             placeholder="Awaiting owner-approved wording"
             value={form.legalPolicies[key]}
             onChange={e=>setForm(current=>({...current,legalPolicies:{...current.legalPolicies,[key]:e.target.value}}))}/>
         </Field>)}
       </section>}
       {page==='footer'&&<section className="rounded-lg border border-stone-200 bg-white p-5 md:p-7">
        <h3 className="font-serif text-2xl">Social media links</h3>
        <p className="mt-2 text-xs leading-6 text-stone-600">Paste the real store's full HTTPS profile URLs. Leave blank to hide each icon. The agency attribution uses Alif Growth Media’s verified website and logo.</p>
        <div className="nb-responsive-grid mt-4 grid gap-4 md:grid-cols-3">
          <p className="md:col-span-2 text-xs leading-6 text-stone-600">
            All nine branded icons are displayed in the footer. Only verified HTTPS profile URLs become clickable;
            unavailable accounts show clearly disabled icons. Add the official profile, save your draft,
            then publish the website to activate its link.
          </p>
          {SOCIAL_KEYS.map(key=><Field key={key} label={key[0].toUpperCase()+key.slice(1)+' profile URL'}>
            <input type="url" className={inputClass} placeholder="https://..." value={form.socialLinks[key]}
              onChange={e=>setForm(cur=>({...cur,socialLinks:{...cur.socialLinks,[key]:e.target.value}}))}/>
          </Field>)}
        </div>
      </section>}
      <section className="space-y-5 rounded-lg border border-stone-200 bg-white p-5 md:p-7">
        <div><p className="text-[11px] font-semibold uppercase tracking-[.2em] text-amber-800">{SITE_PAGES.find(tab=>tab.id===page)?.title}</p>
          <h3 className="mt-2 font-serif text-2xl">Editable text and card content</h3>
          <p className="mt-2 text-xs leading-6 text-stone-600">{SITE_PAGES.find(tab=>tab.id===page)?.description}. Collection data and garment images are managed in their own tabs.</p></div>
        <div className="nb-responsive-grid grid gap-4 md:grid-cols-2">
          {SITE_FIELDS[page].map(field=><label key={field.key}
            className={'block text-xs font-semibold text-stone-700 '+(field.multiline?'md:col-span-2':'')}>
            <span>{field.section} · {field.label}</span>
            {field.multiline?<textarea rows={3} maxLength={900} className={inputClass+' mt-2'}
              value={siteText(form,field.key)} onChange={e=>updateCopy(field.key,e.target.value)}/>:
              <input type="text" maxLength={240} className={inputClass+' mt-2'}
                value={siteText(form,field.key)} onChange={e=>updateCopy(field.key,e.target.value)}/>}
            {Object.hasOwn(form.siteText,field.key)&&<button type="button" className="mt-1 text-[11px] font-normal text-amber-800 underline"
              onClick={()=>setForm(current=>{const siteText={...current.siteText};delete siteText[field.key];return {...current,siteText};})}>Reset to default</button>}
          </label>)}
        </div>
      </section>
      <section className="space-y-3 rounded-lg border border-[#ded0bc] bg-[#faf7f0] p-5" aria-labelledby="homepage-versions-title">
        <h3 id="homepage-versions-title" className="font-serif text-xl">Published homepage versions</h3>
        <p className="text-xs leading-6 text-stone-600">Draft edits are private. Publishing creates a numbered snapshot and updates website copy, cards and layouts on all pages.</p>
        {history.length===0 ? <p className="text-xs text-stone-500">No published homepage revisions yet.</p> :
          <ol className="space-y-2">
            {history.map(item=><li key={item.id} className="flex flex-wrap justify-between gap-2 border-b border-[#e8dccb] py-2 text-xs">
              <span className="font-semibold text-[#5a4533]">Version {item.version}</span>
              <time dateTime={item.published_at} className="text-[#756958]">
                {new Date(item.published_at).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'})}
              </time>
            </li>)}
          </ol>}
      </section>
      <div className="flex flex-wrap gap-3">
        <button type="button" className={outlineClass} disabled={saving} onClick={()=>void save()}>Save draft</button>
        {canPublish&&<button type="button" className={primaryClass} disabled={saving} onClick={()=>void publish()}>Publish website changes</button>}
      </div>
      {message&&<p role="status" className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">{message}</p>}
      <ErrorText message={error}/>
    </>}
  </section>;
}
