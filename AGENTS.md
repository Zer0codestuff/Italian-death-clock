# Project instructions

## Purpose and architecture

`Italian Death Clock` is a Vite React TypeScript one-page data story that explains the Italian pension system to a general audience. `src/App.tsx` composes six minimal scenes and the source footer. `src/lib/statementCopy.ts` contains the bilingual narrative, `src/lib/storyMath.ts` owns the replacement-rate interpolation and real-to-nominal example, and `src/lib/i18n.tsx` persists the selected language. The live story loads official Italian data from `public/data/italy.json`. The international pack remains in the repository but is not required by the page.

The interface uses pure black, warm white and signal red. Scroll progress drives sticky story scenes without scroll hijacking. The two transparent editorial illustrations are `public/assets/payg-flow.png` and `public/assets/demographic-load.png`; exact data remains in HTML, CSS and SVG.

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

The statement redesign replaces the former dashboard, macro controls and personal pension estimate. The opening timer is anchored to 1 January 2036 only as a visual countdown to the official peak year, not as a collapse date. The personal example shows a projected gross replacement rate, 13 annual payments, 2026 purchasing power and the matching future face value under an explicit 2% inflation scenario. It is not an INPS pension calculation.

Italian and English are complete. The current implementation has been visually checked at 1440px and 375px, including scroll states, language switching, loading, source links and horizontal bounds. TypeScript, the production build and 18 tests pass locally. Railway production remains at `https://italian-death-clock-production.up.railway.app`; publish this branch only after its pull request is ready.

## Constraints and known issues

- Keep every claim paired with a visible truth label and direct source/year context.
- Treat official projections as conditional model outputs, not observations.
- Keep all purchasing-power outputs in constant 2026 euros and label future nominal amounts with their inflation scenario.
- Keep the countdown tied to the official 2036 peak year and retain the explanation that the source specifies a year, not an exact day.
- Verify the rendered site at 375px and desktop widths after meaningful UI changes.
- Preserve reduced-motion behavior, 44px controls, visible keyboard focus and zero document-level horizontal overflow.
- Keep image-generated illustrations decorative to the explanation. Exact quantities must remain accessible as text or SVG.

## Do not

- Do not edit `research/editorial-model.md`, `research/italy-data.md`, `research/international-data.md`, `public/data/italy.json` or `public/data/international.json`.
- Do not claim a precise pension-system collapse date.
- Do not call a simulation result a user's INPS pension.
- Do not imply that high amounts or multiple benefits prove abuse.
- Do not add analytics, personal data collection, or deployment providers beyond the current Railway setup.
- Do not reintroduce dashboard cards, macro sliders, international comparisons, glass effects, gradients or decorative motion.
