import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// This is the shape of @museumwnf/viewer-core/testing's `defineViewerConfig()`,
// kept here rather than called: that helper sits in the same barrel
// (`testing/index.js`) as `mountSite`, which imports `createViewer.js`, which
// imports the raw `AppRoot.vue`. Vite and Vitest load `vite.config.js` with
// plain Node, before any `.vue`-aware transform exists, so importing the
// barrel from here fails immediately with
// `ERR_UNKNOWN_FILE_EXTENSION` on `AppRoot.vue` — reproducible with nothing
// but Node itself:
// `node --input-type=module -e "import('@museumwnf/viewer-core/testing')"`.
// Filed as metanull/viewer-core#86. `tests/smoke.test.js` imports the same
// barrel safely, because Vitest loads test files through its own transform
// pipeline rather than plain Node. Switch this back to
// `...defineViewerConfig({ dataPackage: '@museumwnf/__DATASET__-data', plugins: [vue()] })`
// once the package exposes it somewhere that does not pull in `.vue`.
export default defineConfig({
  // GitHub Pages serves the site under /<repo>/; the deploy workflow sets
  // BASE_PATH accordingly. Local dev and root deployments use /.
  base: process.env.BASE_PATH ?? '/',
  plugins: [vue()],
  resolve: {
    alias: {
      // viewer-core reads every JSON of the data package through this alias.
      '@inventory-data': fileURLToPath(
        new URL('./node_modules/@museumwnf/__DATASET__-data', import.meta.url),
      ),
    },
  },
  optimizeDeps: {
    // viewer-core ships .vue source that esbuild pre-bundling cannot parse;
    // viewer-layout must not be pre-bundled either or its chunk gets a second
    // copy of the Vue runtime in dev (both packages share the app's vue).
    // The /i18n subpath is listed as well as the package: Vite pre-bundles a
    // subpath as its own entry, and a second copy of the text module would be
    // a second, empty set of texts for whatever imported it.
    exclude: ['@museumwnf/viewer-core', '@museumwnf/viewer-core/i18n', '@museumwnf/viewer-layout'],
    // The runtime deps reach the browser through those excluded packages, so
    // the dev-server dependency scan cannot discover them until the website's
    // own views import them directly. Without this list a late discovery
    // pre-bundles a second copy of Vue next to the raw one already loaded,
    // and the dev server crashes on boot ("Cannot read properties of null"
    // in runtime-core). Listing them pre-bundles each exactly once, and the
    // excluded packages get the same copy.
    include: ['vue', 'vue-router'],
  },
  test: {
    environment: 'jsdom',
    // The smoke test mounts the app, which lazily loads the home view and
    // through it whatever the route declares. On a cold cache that is Vite's
    // first transform of the whole view graph plus several megabytes of JSON,
    // and it does not fit in vitest's 5 s default. The budget is for the
    // machine, not the assertion.
    testTimeout: 60000,
    server: {
      deps: {
        // viewer-core ships .vue source; Node cannot load it unless Vitest
        // processes the package instead of externalizing it. viewer-layout
        // is listed too because its composed views (`/views`) import
        // viewer-core: loaded natively, they would reach the same .vue files
        // through Node and fail, and would also get a second copy of
        // viewer-core's records next to the inlined one.
        inline: ['@museumwnf/viewer-core', '@museumwnf/viewer-layout'],
      },
    },
  },
})
