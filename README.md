# Ivory

The **Museum With No Frontiers — Ivory** gallery: a curatorial collection —
it owns no native items of its own, and instead brings together ivory
artefacts already catalogued by other MWNF projects ([Discover Islamic
Art](https://islamicart.museumwnf.org/), [Discover Baroque
Art](https://baroqueart.museumwnf.org/) and [Sharing
History](https://sharinghistory.museumwnf.org/)) behind its own collection
filters, a full-text database search, partner profiles and their holdings,
country timelines and the item sheets themselves — built from the published
dataset.

A website is a light, static Vue 3 front-end for one published dataset. It
combines three `@museumwnf` packages from npmjs:

| Package | Role |
| --- | --- |
| `@museumwnf/ivory-data` | the dataset (JSON + `manifest.json`) |
| `@museumwnf/viewer-core` | application engine (routing, data access, the text runtime and the language service) |
| `@museumwnf/viewer-i18n` | the texts shared with the other MWNF websites (this one receives the `gallery` bundle: `core` + `layout` + `gallery`) |
| `@museumwnf/viewer-layout` | page structure (`PageShell` + sections), themed via `theme/tokens.css` |

Every one of these publishes publicly to npmjs, so `npm install` needs no
authentication anywhere — not in CI, not on a developer's own machine. Nothing
in this repository holds a token.

---

## What is where

| Path | Contents |
| --- | --- |
| `src/dataset.config.js` | the whole website declaration: dataset package, languages, page shell, the route map |
| `src/SiteShell.vue` | the gallery chrome — header (logo, search, language switcher), banner, navigation, footer — wrapped around `PageShell` |
| `src/views/` | one component per page of the gallery |
| `src/components/` | the pieces shared between pages (object grid, pagination, banners, partner map) |
| `src/composables/` | data access over the package: gallery data, collection search, timeline, glossary |
| `locales/` | this gallery's own texts, editable by translators (see below) |
| `theme/` | the visual identity: `tokens.css`, `overrides.css`, `assets/` |

### Two layers, one merge rule

The texts every MWNF gallery shares — the menu, the item-sheet labels, the
editorial pages about searching and about the Partners — come from
[`viewer-i18n`](https://github.com/museumwithnofrontiers/viewer-i18n) as the `gallery`
bundle. `locales/` holds only what belongs to *this* gallery, and may overload
any shared entry by spelling out the same name: `gallery.about.body` is
overloaded there with the Ivory text, while `ivory.credits.body` is a name
of this gallery's own, because there is no generic credits page to inherit.

The local file is applied last. **Local wins** — that is the only merge rule in
the system. A gallery cannot delete a shared entry; leaving it out means
inheriting it.

## Development

This site's tools run on the host: no Docker in this lane.

```bash
npm ci
npm run dev
```

No npm login is needed: every `@museumwnf` package installs anonymously from
npmjs. Nothing in this repository holds a token. Then open
<http://localhost:5173>.

`npm run build`, `npm run test` and `npm run lint` are the three checks CI runs
(build and test are blocking).

## Translator — editing the website's texts

You only need a GitHub account and a browser. The files under `locales/` hold
**this gallery's own texts**, one file per language — `en.json` is English,
`fr.json` French, and so on.

Texts shared with the other MWNF galleries — the menu, the labels of an item
sheet, the page about how to search — are not here: they live in
[`viewer-i18n`](https://github.com/museumwithnofrontiers/viewer-i18n) and are edited there,
the same way. This gallery can override any of them by writing the same entry
name in its own file. The museum content itself arrives already translated in
the dataset and is not edited anywhere.

1. **Open the folder** `locales/` on this repository's GitHub page and click
   the language file you want to change.
2. **Click the pencil** (✏️, top right). Change only the text between the
   second pair of quotation marks on a line — the part before the colon is the
   name of the entry and must stay exactly as it is.
3. **To start a new language**, copy all of `en.json`, create a file named with
   the two-letter language code (e.g. `it.json`), paste and translate. A
   language does not have to be complete: anything untranslated shows in
   English.
4. **Click "Commit changes…" then "Propose changes".**
5. **Wait for the automatic check.** A green tick means your change goes live
   by itself a few minutes later. If something is off, a comment appears
   explaining in plain language what to fix.

A text is **just text**, formatted with Markdown if you want: `**bold**`,
`*italic*`, `[a link](https://example.org)`. It may not contain HTML tags, and
it may not contain `{` or `}` — nothing is ever inserted into a text, so a
number or a date is placed next to it by the website rather than inside it.

## Webdesigner — theming the website

The whole visual identity lives in `theme/`: `tokens.css` (colours, fonts,
spacing — the normal surface), `overrides.css` (escape hatch) and `assets/`.
Follow the same pencil-button flow as above for small changes, or run `npm run
dev` for real design work. A change to a layout component itself is a
request for the `viewer-layout` package — open an issue there.

## Deployment

Every push to `main` builds and publishes the site to
<https://museumwithnofrontiers.github.io/ivory/> through the reusable workflows in
[`museumwithnofrontiers/viewer-workflows`](https://github.com/museumwithnofrontiers/viewer-workflows).
The base path comes from `BASE_PATH` at build time and defaults to the
repository name.
