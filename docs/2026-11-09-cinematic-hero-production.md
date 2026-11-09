# Nomaan Brothers cinematic homepage — production UX

**Date:** 9 November 2026 · **Pull request:** #22

## Visitor experience

The opening brand video (or an explicitly illustrative, branded motion poster when the owner has not uploaded footage) fills the first viewport on every fresh homepage load. It begins silently and loops inline. A visible **Skip intro** control, Escape-key support and a 5-second progress indicator keep the experience accessible.

After five seconds the introductory layer slides left over 900 milliseconds, revealing the original collection hero with its editable headlines, Men’s/Kids’ and tailoring CTAs, and responsive editorial image. The full-viewport film does not continue playing under the hero after the reveal. A **Replay brand film** button is present only after a real film has been published. Navigating back to the homepage within the same SPA load does not repeatedly block users.

On narrow phones the video fills the actual viewport with a portrait-safe center crop. The underlying hero stacks headline and a landscape image below it. Tablet/desktop widths use a flexible two-column layout. Reduced-motion and data-saver visitors go straight to the main hero. If autoplay or decoding fails, the animated poster remains available for the transition. Scrolling dismisses the opener rather than trapping users.

## Studio upload checklist

1. Open Studio → Website CMS → Homepage → Main hero → Hero opening film.
2. Upload an **approved**, compressed 5–8 second H.264 MP4 or supported WebM in the Media library. Prefer **under 5 MB** and keep people, garments and lettering in a safe central area. Audio must not be essential; autoplay is muted.
3. Set an approved **Hero poster / background photograph** to provide a quick visual while video loads and on the main hero. Empty photo/video fields intentionally use labeled illustrative artwork; they do **not** pretend to show actual shop inventory.
4. Save draft, then **Publish website changes**, then **Preview published cinematic introduction**. Refresh the storefront to see a fresh intro.
5. Review on 280–430px phones, tablets, wide displays, Safari and Chrome. Verify Skip Intro, Escape, touch/scroll skip, replay, reduced motion and slow networks.

## Release verification

The automated suite covers TypeScript, CSS, Bun, PostgreSQL/RLS, Vite build, 18 responsive viewport sizes and interactive Playwright tests for five-second timing, left-slide exit, skip/replay, reduced-motion/data-saver and failed-video fallbacks. Both Vercel production projects must deploy the same merged commit; no Netlify previews or repeated Netlify builds are permitted.

## Content dependency

The current Supabase homepage has **no published approved brand film or hero photograph**. The implementation operates with an illustrative animated poster until the showroom provides and publishes its authentic brand footage. Do not fabricate business footage, public reviews, contact details, stock items or owner policy commitments.
