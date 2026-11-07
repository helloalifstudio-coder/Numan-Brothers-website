import React, { useRef } from 'react';
import { ArrowRight, MapPin } from 'lucide-react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';

interface EditorialHeroProps {
  image: string;
  badge: string;
  title: string;
  subtitle: string;
  onExploreCollection: () => void;
  onExploreSherwanis: () => void;
}

/**
 * A progressive, motion-aware editorial hero.
 * The image is loaded eagerly for LCP; scroll movement is restrained
 * and disabled when a visitor requests reduced motion.
 */
export default function EditorialHero({
  image,
  badge,
  title,
  subtitle,
  onExploreCollection,
  onExploreSherwanis,
}: EditorialHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], [0, 45]);
  const entrance = reducedMotion ? false : { opacity: 0, y: 22 };

  return (
    <section
      ref={sectionRef}
      aria-label="Featured collections"
      className="relative isolate flex min-h-[560px] items-center overflow-hidden bg-stone-950 text-stone-50 md:min-h-[650px] lg:min-h-[720px]"
    >
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <motion.img
          src={image}
          alt=""
          loading="eager"
          fetchPriority="high"
          decoding="async"
          referrerPolicy="no-referrer"
          className="h-full w-full scale-[1.06] object-cover object-top opacity-65 lg:object-[center_30%]"
          style={reducedMotion ? undefined : { y: imageY }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950/95 via-stone-950/70 to-stone-950/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-stone-950/20" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-24 md:px-10 lg:px-12">
        <motion.div
          initial={entrance}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl"
        >
          <p className="mb-6 inline-flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-200 md:text-xs">
            <span className="h-px w-8 bg-amber-200/80" aria-hidden="true" />
            {badge || 'Occasionwear · Warangal'}
          </p>
          <h2 className="max-w-[13ch] font-serif text-4xl font-medium leading-[1.13] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
            {title || 'The Designer Sherwani House'}
          </h2>
          <p className="mt-7 max-w-lg text-sm leading-7 text-stone-200 md:text-base md:leading-8">
            {subtitle || 'Discover groomwear, festive styles and traditional menswear in Mandi Bazar, Warangal.'}
          </p>
          <div className="mt-9 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={onExploreCollection}
              className="inline-flex min-h-12 items-center justify-center gap-3 rounded-sm bg-[#ead9b7] px-7 py-3 text-xs font-semibold uppercase tracking-[0.13em] text-stone-950 transition-colors duration-200 hover:bg-white"
            >
              Explore new arrivals <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onExploreSherwanis}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-sm border border-stone-100/50 px-7 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-stone-100 transition-colors duration-200 hover:border-white hover:bg-white/10"
            >
              Groom collections
            </button>
          </div>
          <a
            href="https://www.google.com/maps/search/?api=1&query=Nomaan+Brothers+Dresses+Mandi+Bazar+Warangal"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-10 inline-flex items-center gap-2 text-xs tracking-wide text-stone-200 underline decoration-stone-400/70 underline-offset-4 hover:text-white"
          >
            <MapPin className="h-4 w-4" aria-hidden="true" />
            Find us in Mandi Bazar, Warangal
          </a>
        </motion.div>
      </div>

      <div className="pointer-events-none absolute bottom-6 right-6 hidden items-center gap-3 text-[10px] font-medium uppercase tracking-[0.25em] text-stone-200/75 md:flex">
        <span className="h-px w-10 bg-stone-200/60" />
        Crafted for every occasion
      </div>
    </section>
  );
}
