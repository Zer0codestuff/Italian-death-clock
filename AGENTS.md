# Project instructions

## Purpose and architecture

`Italian Death Clock` is a Vite React TypeScript one-page data story that explains the Italian pension system to a general audience. `src/App.tsx` composes six linear scenes and the source footer. `src/lib/statementCopy.ts` contains the bilingual narrative, `src/lib/storyMath.ts` owns the contribution-adjusted pension estimate and inflation conversion, and `src/lib/i18n.tsx` persists the selected language. The live story loads official Italian data from `public/data/italy.json`; the countdown and spending chart use its official peak object. The international pack remains in the repository but is not required by the page.

The interface uses pure black, warm white and signal red. `src/styles.css` provides a continuous editorial layout with a thin page progress line and scroll-driven animations. The page renders all six original illustrations as decorative context, including spending, purchasing power and policy levers. Exact data remains in HTML, CSS and SVG.

## Run, build and test

Use the bundled Node and pnpm runtime when available:

```bash
pnpm install
pnpm dev
pnpm test
pnpm lint
pnpm build
```

Railway builds the root `Dockerfile` and serves the Vite output through Caddy. The container listens on Railway's `PORT`, exposes `/health`, and supports SPA fallbacks. No runtime variables are required.

## Current status and recent changes

The opening timer is anchored to 1 January of the loaded official peak year, currently 2036, only as a visual countdown, not as a collapse date. The personal scene asks for age, accrued contribution years, current gross annual pay and average inflation. It shows the estimated future gross payment first, followed by its purchasing-power equivalent in constant 2026 euros. The estimate assumes continuous work to age 67, adjusts the official average replacement rate against the projected average contribution period, and stops before showing an amount when the current ordinary 20-year minimum is not met. It is not an INPS pension calculation.

Italian and English copy are present. The current redesign presents the evidence as a linear manifesto, keeps truth labels and direct source links beside the claims, and retains the personal gross-payment and constant-2026-euro comparison. TypeScript, the production build and all 22 tests pass locally on 7 September 2026. Final visual checks passed at 375px and 1440px in both languages, including the source drawer, loaded images, 44px controls, keyboard focus, and zero horizontal overflow. Railway production is `https://italian-death-clock-production.up.railway.app`; the service tracks `main`, the repository's only branch.

## Constraints and known issues

- Keep every claim paired with a visible truth label and direct source/year context.
- Treat official projections as conditional model outputs, not observations.
- Keep all purchasing-power outputs in constant 2026 euros and label future nominal amounts with their inflation scenario.
- Keep the countdown and spending labels tied to the loaded official peak year and value, and retain the explanation that the source specifies a year, not an exact day.
- Verify the rendered site at 375px and desktop widths after meaningful UI changes.
- Preserve reduced-motion behavior, 44px controls, visible keyboard focus and zero document-level horizontal overflow.
- Keep image-generated illustrations decorative to the explanation. Exact quantities must remain accessible as text or SVG.

Known drift risk: the hero and mobile spending checkpoint copy still repeat the current 2036, 17.3%, 2022 and 2070 values even though the chart and countdown consume the loaded peak object. Consolidate these values before changing the data pack. The untracked `src/gold.css` file is an unused visual experiment with selectors from an older component set; it remains local and is excluded from the release, together with unused experimental changes in `src/components/Charts.tsx`.

## Do not

- Do not edit `research/editorial-model.md`, `research/italy-data.md`, `research/international-data.md`, `public/data/italy.json` or `public/data/international.json`.
- Do not call a simulation result a user's INPS pension.
- Do not imply that high amounts or multiple benefits prove abuse.
- Do not add analytics, personal data collection, or deployment providers beyond the current Railway setup.
- Do not reintroduce dashboard cards, macro sliders, international comparisons, glass effects or gradients.

## Restored motion

Restored heading and policy-row entrances, illustration movement, demographic bar interpolation and spending-line drawing on 7 September 2026, at the user's request. Motion follows each visual within the current linear layout and respects reduced-motion preferences. Preserve these animations. Build and 22 tests passed; browser checks at 375px and 1440px found no horizontal overflow. The release includes the linear redesign and restored cinematic image motion.

Corrected image motion after visual feedback. The hero now starts at scroll progress zero and also animates on load. Image progress uses stable layout offsets over a longer visible scroll interval. Restored the three missing illustrations and the mobile demographic image. Verified changing image transforms for all six illustrations at 375px and 1440px with no horizontal overflow. Do not replace image movement with heading reveals alone.

The user chose stronger cinematic scroll motion. PAYG, demographic, spending and policy illustrations now use sticky tracks, larger image framing, perspective rotations and deeper zoom. Tracks are 110svh on desktop and 100svh on mobile; reduced-motion mode retains the compact static layout. Keep motion driven by scrolling rather than adding continuous floating loops. Build and all 22 tests passed after this change. Browser checks confirmed sticky travel, changing progress and no horizontal overflow at 375px and 1440px.
