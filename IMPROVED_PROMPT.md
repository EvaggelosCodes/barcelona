# The Improved Brief (rewritten from "make this website much better")

## One-line goal
Turn the Barcelona boys-trip briefing into an **award-grade editorial one-pager** — bold
oversized typography, smooth scroll-driven motion, full-bleed cinematic imagery, and the
four real agents front-and-centre — without gimmicks (no mouse-chasing cursors, no particle
soup). Reference bar: the kind of sites on Awwwards / the Medium "coolest websites" list —
craft over tricks.

## Design direction
- **Aesthetic:** "after-dark dispatch" — neon-magenta / sunset-gold / blood-red on deep
  indigo, glassmorphism panels, fine film grain, confident negative space.
- **Type:** Montserrat 900 display (Greek-capable — fixes the old Bebas/Impact fallback),
  IBM Plex Sans body, JetBrains Mono labels. Headlines huge, tight tracking, line-by-line
  rise reveals.
- **Motion:** entrance reveals on scroll, parallax on every image layer, kinetic dual-row
  marquee, animated counters/meters. All gated behind `prefers-reduced-motion`.

## What "much better" means, concretely
1. **Real squad photos** as the centrepiece — big editorial portrait rows, duotone that
   resolves to colour on hover, accent glow per agent, graceful initials fallback.
2. **Hero:** parallax cinematic backdrop, line-reveal headline, agent avatar cluster,
   live countdown, scroll cue.
3. **Interactive logic upgrades:** prophecy generator (no immediate repeats + share/copy
   toast), night simulator (chaos meter + restart, leak-free timers), budget (animated
   grand-total + overrun counters).
4. **Bugs fixed:** correct `lang="el"`, Greek-capable fonts, timer cleanup, reduced-motion,
   focus-visible rings, semantic nav with active-section tracking + mobile menu.
5. **Performance/craft:** rAF-batched scroll handlers, lazy images, no new heavy deps.

## Hard constraints
- Stack stays: TanStack Start + React 19 + Tailwind v4 + shadcn/ui. No framework swaps.
- No external runtime deps added.
- Greek copy and the inside jokes are sacred — keep voice, only restructure presentation.

## Photos
Drop 4 files in `public/squad/`: `evag.jpg`, `stavros.jpg`, `stefanos.jpg`, `giorgos.jpg`
(3:4 portrait crops). Auto-loaded; initials fallback until present.

## Optional (needs Higgsfield credits)
Generate bespoke cinematic Barcelona hero + mission-zone imagery to replace the stock JPGs.
Blocked at time of build: free workspace had 1.16 credits, min 2/image.
