# Il conto della pensione

An Italian-language, one-page editorial explainer for workers aged 20 to 45. It combines verified Italy and international pension data with two transparent browser-local simulators. The visual language is urgent, but the product never turns a conditional projection into a collapse date.

## Run locally

The project uses Vite, React and TypeScript.

```bash
pnpm install
pnpm dev
```

Useful checks:

```bash
pnpm test
pnpm lint
pnpm build
```

The site loads the untouched JSON packs from `public/data/italy.json` and `public/data/international.json` at runtime. Simulator inputs stay in the browser and are not submitted anywhere.

## Structure

- `src/App.tsx` contains the seven-scene narrative and simulator controls.
- `src/components/Charts.tsx` contains accessible SVG data visualizations.
- `src/lib/simulators.ts` contains the personal and macro formulas.
- `src/lib/data-integrity.test.ts` checks source links and country scope.
- `research/` and `public/data/` are source-of-truth inputs and must not be rewritten by the UI.

All public copy is Italian. Source links, truth labels, years, units and perimeter notes are shown near the claims they support.
