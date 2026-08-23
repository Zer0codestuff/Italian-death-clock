# Project instructions

## Purpose and architecture

`Il conto della pensione` is a local Vite React TypeScript one-page story for Italian workers aged 20 to 45. `src/App.tsx` composes seven scenes, `src/components/Charts.tsx` renders SVG charts, and `src/lib/simulators.ts` owns the personal and macro formulas. Runtime data comes from the two JSON packs in `public/data`.

## Run, build and test

Use the bundled Node and pnpm runtime when available:

```bash
pnpm install
pnpm dev
pnpm test
pnpm lint
pnpm build
```

## Current status and recent changes

The complete local site, responsive narrative, source catalog, simulators, chart layer, tests and SVG favicon are implemented. The first pass includes browser-local loading and error states, reduced-motion support and source-linked methodology panels.

## Constraints and known issues

- Keep every claim paired with a visible truth label and direct source/year context.
- Treat official projections as conditional model outputs, not observations.
- Keep all currency outputs in constant 2026 euros unless explicitly labelled otherwise.
- The macro simulator is a transparent flow proxy, not a national accounts or INPS balance model.
- Verify the rendered site at 375px and desktop widths after meaningful UI changes.

## Do not

- Do not edit `research/editorial-model.md`, `research/italy-data.md`, `research/international-data.md`, `public/data/italy.json` or `public/data/international.json`.
- Do not claim a precise pension-system collapse date.
- Do not call a simulation result a user's INPS pension.
- Do not imply that high amounts or multiple benefits prove abuse.
- Do not add analytics, personal data collection, hosting metadata or deployment configuration.
