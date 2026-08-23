# Il conto della pensione

An Italian and English one-page editorial explainer for workers aged 20 to 45. It combines verified Italy and international pension data with two transparent browser-local simulators. The visual language is urgent, but the product never turns a conditional projection into a collapse date.

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

## Deploy on Railway

Railway builds the production image from `Dockerfile`. The build stage compiles the Vite app, then Caddy serves the generated `dist` directory on Railway's assigned `PORT`. The service exposes `/health` for deployment checks and falls back to `index.html` for client-side routes.

Live site: [italian-death-clock-production.up.railway.app](https://italian-death-clock-production.up.railway.app)

Deploy the public GitHub repository and select the branch to publish:

```text
Zer0codestuff/Italian-death-clock
```

No runtime environment variables are required.

## Structure

- `src/App.tsx` contains the seven-scene narrative and simulator controls.
- `src/components/Charts.tsx` contains accessible SVG data visualizations.
- `src/lib/i18n.tsx` owns the persistent language state and document metadata.
- `src/lib/language.ts` exposes the language context and hook.
- `src/lib/copy.ts` contains the Italian and English interface copy.
- `src/lib/simulators.ts` contains the personal and macro formulas.
- `src/lib/data-integrity.test.ts` checks source links and country scope.
- `research/` and `public/data/` are source-of-truth inputs and must not be rewritten by the UI.

The header language control switches all public copy, chart labels, data tables and number formats between Italian and English. The selection stays in browser storage. Source links, truth labels, years, units and scope notes remain beside the claims they support.
