# Italian Death Clock

An Italian and English one-page data story about the Italian pension system. It combines official projections, observed demographic data and a clearly labelled purchasing-power example. The countdown points to the projected 2036 spending peak, not to a collapse date.

Six scroll-driven scenes use transparent cut-paper illustrations, accessible HTML and SVG data. Motion follows reading progress, never hijacks scrolling, and falls back to a static presentation when reduced motion is enabled.

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

The site loads the untouched Italian data pack from `public/data/italy.json` at runtime. The international pack remains available in the repository but is not required by the published story. Interactive inputs stay in the browser and are not submitted anywhere.

## Deploy on Railway

Railway builds the production image from `Dockerfile`. The build stage compiles the Vite app, then Caddy serves the generated `dist` directory on Railway's assigned `PORT`. The service exposes `/health` for deployment checks and falls back to `index.html` for client-side routes.

Live site: [italian-death-clock-production.up.railway.app](https://italian-death-clock-production.up.railway.app)

Deploy the public GitHub repository and select the branch to publish:

```text
Zer0codestuff/Italian-death-clock
```

No runtime environment variables are required.

## Structure

- `src/App.tsx` composes the six scenes, scroll choreography and interactive example.
- `src/styles.css` owns the responsive black, warm-white and signal-red visual system.
- `src/lib/statementCopy.ts` contains the complete Italian and English narrative.
- `src/lib/storyMath.ts` contains the replacement-rate interpolation and inflation example.
- `src/lib/i18n.tsx` owns the persistent language state and document metadata.
- `src/lib/language.ts` exposes the language context and hook.
- `public/assets/` contains six transparent editorial illustrations.
- `src/lib/data-integrity.test.ts` and related tests check data, sources, localization and story calculations.
- `research/` and `public/data/` are source-of-truth inputs and must not be rewritten by the UI.

The header language control switches all public copy, chart labels and number formats between Italian and English. The selection stays in browser storage. Source links, truth labels, years, units and scope notes remain beside the claims they support.
