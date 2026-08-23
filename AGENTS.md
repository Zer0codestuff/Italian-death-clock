# Project instructions

## Purpose and architecture

`Il conto della pensione` is a local Vite React TypeScript one-page story for Italian workers aged 20 to 45. `src/App.tsx` composes seven scenes, `src/components/Charts.tsx` renders SVG charts, `src/lib/copy.ts` contains the bilingual interface copy, and `src/lib/simulators.ts` owns the personal and macro formulas. `src/lib/i18n.tsx` persists the selected language and updates document metadata, while `src/lib/language.ts` exposes the context and hook. Runtime data comes from the two JSON packs in `public/data`.

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

The complete local site, responsive narrative, source catalog, simulators, chart layer, tests and SVG favicon are implemented. The interface audit fixed color contrast, control sizing, range progress, numeric input editing, section navigation and responsive layouts. The source catalog is now part of the header navigation. Personal inputs precede their output on narrow screens, and dense comparisons expose clear horizontal-scroll or stacked layouts. A persistent header control switches the full interface, charts, tables, source metadata and number formatting between Italian and English. A production Docker and Caddy setup is ready for Railway deployment from GitHub.

The current UI has been checked at 1440px, 901px, 768px, 375px and 320px, including both languages and the production preview. Automated axe checks report no violations at desktop and 375px. The production build, TypeScript check and 17 tests pass.

## Constraints and known issues

- Keep every claim paired with a visible truth label and direct source/year context.
- Treat official projections as conditional model outputs, not observations.
- Keep all currency outputs in constant 2026 euros unless explicitly labelled otherwise.
- The macro simulator is a transparent flow proxy, not a national accounts or INPS balance model.
- Verify the rendered site at 375px and desktop widths after meaningful UI changes.
- Keep the mobile scroll hint, keyboard focus and horizontal overflow on the pension-pillar matrix. The wide table is intentional below desktop width.
- The subtle hero background gradient makes axe mark some contrast checks as incomplete. Manually verify hero colors against the dark base when changing that palette.

## Do not

- Do not edit `research/editorial-model.md`, `research/italy-data.md`, `research/international-data.md`, `public/data/italy.json` or `public/data/international.json`.
- Do not claim a precise pension-system collapse date.
- Do not call a simulation result a user's INPS pension.
- Do not imply that high amounts or multiple benefits prove abuse.
- Do not add analytics, personal data collection, or deployment providers beyond the current Railway setup.
