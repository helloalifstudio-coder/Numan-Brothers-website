import React, { useRef } from 'react';
import { ArrowDownRight, ArrowRight, ArrowUpRight, MapPin, MoveDownRight } from 'lucide-react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { Product } from '../types';
import { productsForCollection, productImage } from '../storefront/catalog';
import V2Link from './V2Link';
import V2Reveal from './V2Reveal';

interface Props { products: Product[]; onNavigate: (path: string) => void; }
const photo = 'https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?auto=format&fit=crop&w=1800&q=85';
const photoTwo = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80';

export default function V2Home({ products, onNavigate }: Props) {
  const hero = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: hero, offset: ['start start', 'end start'] });
  const imageY = useTransform(scrollYProgress, [0, 1], [0, 72]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, -35]);
  const scrollLine = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const getImage = (route: string, fallback = '') =>
    productImage(productsForCollection(products, route)[0] || {} as Product) || fallback;

  const edits = [
    { eyebrow: '01 / Groom collection', title: 'The Sherwani Edit', description: 'Wedding silhouettes for the moment that matters.', route: '/men/sherwani',
      image: getImage('/men/sherwani', photo), tone: 'bg-[#2b2926]' },
    { eyebrow: '02 / The classics', title: 'Kurta & Pyjama', description: 'Timeless occasion-ready dressing.', route: '/men/kurta-pyjama',
      image: getImage('/men/kurta-pyjama', photoTwo), tone: 'bg-[#44392d]' },
    { eyebrow: '03 / Heritage fits', title: 'Jodhpuri', description: 'Structured elegance for celebration.', route: '/men/jodhpuri',
      image: getImage('/men/jodhpuri', ''), tone: 'bg-[#545045]' },
  ];

  return <div className="overflow-hidden bg-[#fbf8f2]">
    {/* An immersive cover with a real heading and accessible normal scrolling. */}
    <section ref={hero} className="relative isolate min-h-[620px] overflow-hidden bg-[#211b17] text-[#fff8ed] md:min-h-[730px] lg:min-h-[min(860px,calc(100svh-106px))]" aria-labelledby="v2-home-title">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_28%_35%,#5d4939_0,transparent_56%)]" />
      <div className="absolute inset-y-0 right-0 w-[100%] md:w-[65%] lg:w-[57%]">
        <motion.img src={photo} alt="" fetchPriority="high" loading="eager" decoding="async"
          className="h-full w-full scale-[1.10] object-cover object-center opacity-[.60] md:opacity-90"
          style={reduce ? undefined : { y: imageY }} />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#211b17] via-[#211b17]/90 to-[#211b17]/30 md:via-[#211b17]/75 md:to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#211b17]/70 via-transparent to-[#211b17]/10" />
      <div className="relative mx-auto flex min-h-[620px] max-w-[1440px] flex-col justify-center px-6 pb-24 pt-20 md:min-h-[730px] md:px-12 lg:min-h-[min(860px,calc(100svh-106px))] lg:px-20">
        <motion.div style={reduce ? undefined : { y: textY }} className="relative z-10 max-w-[660px]">
          <motion.div initial={reduce ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: .7, ease: [0.22,1,0.36,1] }}>
            <div className="mb-8 flex items-center gap-4 text-[10px] font-semibold uppercase tracking-[.26em] text-[#e9c797]">
              <span className="h-px w-10 bg-[#cba777]"/> The Designer Sherwani House
            </div>
            <h1 id="v2-home-title" className="max-w-[12ch] font-serif text-[clamp(3.8rem,7.7vw,8.1rem)] font-normal leading-[.93] tracking-[-.065em]">
              For the <em className="font-normal text-[#dec59d]">moments</em> you remember.
            </h1>
            <p className="mt-8 max-w-[465px] text-sm leading-8 text-[#e0d6c7] md:text-base">
              Modern heritage menswear and kidswear, discovered in the heart of Mandi Bazar, Warangal.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <V2Link href="/men" onNavigate={onNavigate} className="inline-flex min-h-12 items-center gap-4 border border-[#f1dfbd] bg-[#e9d2ad] px-7 py-3 text-[11px] font-bold uppercase tracking-[.12em] text-[#281f16] transition-colors hover:bg-[#fff1d8]">
                Explore men's wear <ArrowUpRight size={17}/>
              </V2Link>
              <V2Link href="/kids" onNavigate={onNavigate} className="inline-flex min-h-12 items-center gap-4 border border-white/50 px-7 py-3 text-[11px] font-semibold uppercase tracking-[.12em] text-white transition-colors hover:bg-white/10">
                Kids collection <ArrowRight size={17}/>
              </V2Link>
            </div>
          </motion.div>
        </motion.div>
        <motion.div className="absolute bottom-8 left-6 flex items-center gap-3 text-[10px] font-medium uppercase tracking-[.22em] text-white/75 md:left-12 lg:left-20"
          style={reduce ? undefined : { opacity: scrollLine }}>
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/40"><MoveDownRight size={14}/></span> Scroll to discover
        </motion.div>
        <div className="absolute bottom-9 right-7 hidden border-l border-white/40 pl-5 text-[10px] uppercase tracking-[.24em] text-[#e3d6c4] lg:block">
          Nomaan Brothers · Warangal
        </div>
      </div>
    </section>

    <div className="border-b border-[#e7dccc] px-6 py-6 md:px-10">
      <div className="mx-auto flex max-w-[1330px] flex-wrap items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-[.19em] text-[#806d53]">
        <span>For weddings & celebrations</span><span className="hidden h-px w-24 bg-[#bc9b6c] md:block"/><span>Men's Wear / Kids Wear</span>
        <span className="hidden h-px w-24 bg-[#bc9b6c] md:block"/><span>Mandi Bazar, Warangal</span>
      </div>
    </div>

    <section className="mx-auto max-w-[1440px] px-5 pb-20 pt-24 md:px-12 md:pb-28 md:pt-32 lg:px-20" aria-labelledby="departments-title">
      <V2Reveal className="mb-10 flex flex-wrap items-end justify-between gap-4 md:mb-16">
        <div>
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[.28em] text-[#a37d50]">Find your occasion</p>
          <h2 id="departments-title" className="max-w-[730px] font-serif text-[clamp(2.8rem,5.5vw,5.5rem)] leading-[1.04] tracking-[-.05em] text-[#29221b]">
            Two worlds. <em className="text-[#97774f]">One tradition.</em>
          </h2>
        </div>
        <p className="max-w-xs text-sm leading-7 text-[#73685e]">Explore our clothing departments, organized for effortless discovery.</p>
      </V2Reveal>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
        <V2Reveal className="group relative min-h-[490px] overflow-hidden bg-[#332b24] text-white md:min-h-[620px]">
          <img src={getImage('/men', photo)} loading="lazy" decoding="async" alt="Traditional menswear collection preview"
            className="absolute inset-0 h-full w-full object-cover object-top opacity-75 transition-transform duration-700 group-hover:scale-[1.045]"/>
          <div className="absolute inset-0 bg-gradient-to-t from-[#1b1815]/95 via-[#1b1815]/5 to-black/5"/>
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-5 px-7 pb-9 md:px-11 md:pb-12">
            <div><span className="text-[10px] uppercase tracking-[.27em] text-[#ebd6b2]">Collection 01</span>
              <h3 className="mt-3 font-serif text-5xl tracking-[-.04em] md:text-6xl">Men's Wear</h3>
              <p className="mt-3 text-sm text-[#eee2d2]">Sherwani · Kurta Pyjama · Suits · More</p>
            </div>
            <V2Link href="/men" onNavigate={onNavigate} aria-label="Explore men's wear"
              className="flex h-13 w-13 shrink-0 items-center justify-center rounded-full border border-white/70 transition-colors hover:bg-white hover:text-[#241d17]"><ArrowUpRight/></V2Link>
          </div>
        </V2Reveal>
        <V2Reveal delay={0.1} className="group relative min-h-[490px] overflow-hidden bg-[#c7bba4] md:min-h-[620px]">
          {/* An illustrated placeholder avoids presenting adult product photographs as kidswear. */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,#eee3cb_0,transparent_50%),linear-gradient(130deg,#c2ad8a,#f4e5cc_70%,#a58e6b)]"/>
          <div className="absolute left-[45%] top-[12%] h-[370px] w-[240px] rotate-[-16deg] rounded-[48%_48%_12%_12%] border-[22px] border-[#8e7250]/25 bg-[#d6c19b]/30 shadow-[30px_40px_90px_rgba(50,34,18,.2)] md:h-[460px] md:w-[290px]"/>
          <div className="absolute left-[30%] top-[17%] h-[330px] w-[170px] rotate-[15deg] rounded-[46%_46%_18%_18%] border-[12px] border-[#f8ead1]/45 bg-[#d9bf93]/15 md:h-[430px] md:w-[210px]"/>
          <div className="absolute left-10 top-10 flex h-24 w-24 items-center justify-center rounded-full border border-[#9b7f58]/55 text-[9px] uppercase tracking-[.18em] text-[#816744] md:h-28 md:w-28">Little<br/>Traditions</div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#6d5135]/70 via-transparent to-transparent"/>
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-5 px-7 pb-9 text-white md:px-11 md:pb-12">
            <div><span className="text-[10px] uppercase tracking-[.27em] text-[#fff1d9]">Collection 02</span>
              <h3 className="mt-3 font-serif text-5xl tracking-[-.04em] md:text-6xl">Kids Wear</h3>
              <p className="mt-3 text-sm text-[#fff2df]">A special edit for every celebration</p>
            </div>
            <V2Link href="/kids" onNavigate={onNavigate} aria-label="Explore kids wear"
              className="flex h-13 w-13 shrink-0 items-center justify-center rounded-full border border-white/70 text-white transition-colors hover:bg-white hover:text-[#241d17]"><ArrowUpRight/></V2Link>
          </div>
        </V2Reveal>
      </div>
    </section>

    <section className="bg-[#eee7db] px-5 py-24 md:px-12 md:py-28 lg:px-20" aria-labelledby="featured-title">
      <div className="mx-auto max-w-[1330px]">
        <V2Reveal className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <div><p className="mb-4 text-[10px] font-bold uppercase tracking-[.28em] text-[#a37d50]">The curated edit</p>
            <h2 id="featured-title" className="font-serif text-[clamp(2.8rem,5vw,5.1rem)] leading-[1.02] tracking-[-.045em] text-[#29221b]">Explore by <em>style.</em></h2></div>
          <V2Link href="/men" onNavigate={onNavigate} className="inline-flex items-center gap-3 border-b border-[#a98d6a] pb-2 text-[11px] font-bold uppercase tracking-[.14em] text-[#6b502d]">All men's collections <ArrowRight size={16}/></V2Link>
        </V2Reveal>
        <div className="grid gap-5 md:grid-cols-3">
          {edits.map((edit, i) => (
            <V2Reveal key={edit.route} delay={i * 0.075} className={'group overflow-hidden ' + edit.tone}>
              <V2Link href={edit.route} onNavigate={onNavigate} className="block">
                <div className="relative aspect-[3/4] overflow-hidden">
                  {edit.image ? <img src={edit.image} alt="" loading="lazy" decoding="async"
                    className="h-full w-full object-cover object-top opacity-85 transition-transform duration-700 group-hover:scale-[1.045]"/>
                    : <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_60%_30%,#80705c,transparent_60%)]">
                      <span className="font-serif text-7xl italic text-white/15">{String(i + 1).padStart(2,'0')}</span></div>}
                  <span className="absolute left-6 top-6 text-[10px] font-semibold uppercase tracking-[.18em] text-white/95">{edit.eyebrow}</span>
                  <span className="absolute bottom-5 right-5 flex h-11 w-11 items-center justify-center rounded-full border border-white/70 text-white transition-colors group-hover:bg-white group-hover:text-[#29221b]"><ArrowUpRight size={19}/></span>
                </div>
                <div className="bg-[#faf7f0] p-6"><h3 className="font-serif text-[28px] leading-tight tracking-[-.03em] text-[#28231e]">{edit.title}</h3>
                  <p className="mt-2 text-[13px] leading-6 text-[#81786e]">{edit.description}</p></div>
              </V2Link>
            </V2Reveal>
          ))}
        </div>
      </div>
    </section>

    <section className="relative overflow-hidden bg-[#211b17] px-5 py-24 text-[#f9efe0] md:px-12 md:py-32 lg:px-20">
      <div className="mx-auto grid max-w-[1330px] items-center gap-14 md:grid-cols-[.93fr_1.07fr] md:gap-20">
        <V2Reveal>
          <p className="mb-6 text-[10px] font-semibold uppercase tracking-[.29em] text-[#d8b581]">An invitation to discover</p>
          <h2 className="max-w-[10ch] font-serif text-[clamp(3.1rem,5.3vw,6rem)] leading-[1.03] tracking-[-.045em]">A sense of <em className="text-[#e0bd89]">occasion.</em></h2>
          <p className="mt-7 max-w-md text-sm leading-8 text-[#d7cabc]">From wedding ensembles to traditional everyday styles, discover the details and silhouettes that feel right for your celebration.</p>
          <V2Link href="/men/marriage" onNavigate={onNavigate} className="mt-9 inline-flex items-center gap-4 border-b border-[#d8bd93] pb-3 text-xs font-semibold uppercase tracking-[.12em] text-[#ead7b8]">Marriage collection <ArrowDownRight size={17}/></V2Link>
        </V2Reveal>
        <V2Reveal className="relative">
          <div className="absolute -right-5 -top-5 h-full w-full border border-[#a88e70]/50" aria-hidden="true"/>
          <img src={getImage('/men/kurta-pyjama', photoTwo)} alt="Traditional garment styling" loading="lazy" decoding="async" className="relative z-10 aspect-[4/5] w-full object-cover object-top"/>
        </V2Reveal>
      </div>
    </section>

    <section className="px-6 py-24 text-center md:py-28" aria-labelledby="visit-title">
      <V2Reveal className="mx-auto max-w-[790px]">
        <MapPin className="mx-auto mb-7 h-7 w-7 text-[#a47d4e]" strokeWidth={1.2}/>
        <p className="mb-5 text-[10px] font-bold uppercase tracking-[.27em] text-[#9b7649]">Experience the collection in person</p>
        <h2 id="visit-title" className="font-serif text-[clamp(2.8rem,5vw,5.7rem)] leading-[1.05] tracking-[-.045em] text-[#282019]">Come discover <em>Nomaan Brothers.</em></h2>
        <p className="mx-auto mt-6 max-w-xl text-sm leading-8 text-[#71685e]">Find our showroom in Mandi Bazar, Warangal. Explore styles, ask questions, and plan your visit.</p>
        <V2Link href="/contact" onNavigate={onNavigate} className="mt-9 inline-flex min-h-12 items-center gap-4 bg-[#2b231b] px-8 py-3 text-[11px] font-semibold uppercase tracking-[.15em] text-white hover:bg-[#644a30]">
          Plan your visit <ArrowUpRight size={17}/>
        </V2Link>
      </V2Reveal>
    </section>
  </div>;
}
