# website-template

Template repository for MWNF websites. Every new website repo
(`museumwithnofrontiers/<dataset>`, public) is created **once** from this template — it is
never installed as a dependency and never updated in existing websites.

A website is a light, static Vue 3 front-end for one published dataset. It
combines three `@museumwnf` packages from npmjs:

| Package | Role |
| --- | --- |
| `@museumwnf/<dataset>-data` | the dataset (JSON + `manifest.json`) |
| `@museumwnf/viewer-core` | application engine (routing, data access, texts, language, shared views) |
| `@museumwnf/viewer-layout` | page structure (`PageShell` + sections), themed via `theme/tokens.css` |
| `@museumwnf/viewer-i18n` | the shared texts of this kind of website |

---

## Admin — creating a new website

1. **Run the tool.** From a `viewer-workflows` checkout (or its container, the
   same way `propagate.mjs` runs):

   ```
   node tools/new-website.mjs --slug <slug> --class gallery|exhibition|standalone --namespace <ns> --title "<Site name>" [--dry-run] [--settings-only] [--no-merge]
   ```

   - `--slug` — the dataset key (e.g. `islamicart`), used for the repo name
     (`museumwithnofrontiers/<slug>`) and the data package
     (`@museumwnf/<slug>-data`); replaces every `__DATASET__` placeholder.
   - `--class` — `standalone`, `gallery` or `exhibition`. A product website (a
     whole virtual museum) is `standalone`; the DXA families are `gallery` or
     `exhibition`. Sets `viewerI18n.class` and picks the shared texts bundle
     this website receives — see
     [`viewer-i18n`](https://github.com/museumwithnofrontiers/viewer-i18n) for
     what each bundle contains. Replaces every `__SITE_CLASS__` placeholder.
   - `--namespace` — this website's own texts namespace: one lowercase word,
     no hyphens (`carpets`, `waterInIslam`). Sets `viewerI18n.namespace`.
     Replaces every `__SITE_NAMESPACE__` placeholder.
   - `--title` — the site's display name, used wherever the scaffold needs a
     human-readable name.
   - `--dry-run` — print what the tool would do without creating or changing
     anything.
   - `--settings-only` — re-applies the repo settings below to an existing
     repo, without creating one or opening the first PR; this is also how to
     re-apply them later if a setting has drifted or the tool has gained a new
     one.
   - `--no-merge` — opens the first PR but leaves it for review instead of
     merging it.

   The tool creates the repository from this template under the org, enables
   **Pages** (source: GitHub Actions), creates the `main-requires-pr` ruleset
   and the classic branch protection with the four required checks (`ci /
   Build (blocking)`, `ci / Test (blocking)`, `ci / Texts (blocking)`,
   `locales / Validate locale files`), switches on allow-auto-merge,
   delete-branch-on-merge, CodeQL default setup, and Dependabot security fixes
   and alerts, verifies the template link, then opens the first PR: it
   replaces the placeholders above and installs `@museumwnf/<slug>-data@latest`
   — using `@latest` rather than a bare `npm install` so it resolves whatever
   major the dataset has actually reached, meaning this step cannot be wrong
   for a dataset published past 1.x (the data package must already be
   published on npmjs for this to succeed) — and commits `package-lock.json`,
   which CI needs because it runs `npm ci`.

   There is nothing to register with `viewer-core`/`viewer-layout`/`viewer-i18n`
   or the dataset package for this: a website is discovered from the
   `website-template` link GitHub records when the repository is created, so it
   becomes a downstream consumer of all four the moment it exists, and every
   one of them is public — no access grant to request.

   The tool needs an operator logged in with `gh` and admin rights on the org;
   it never stores a token.

   **What the tool does not do**, which stays by hand afterwards:
   - The **texts PR** — this website's editorial copy comes from the
     extractor, not the tool. See inventory-app's
     [`docs/deployment/new-website.md`](https://github.com/museumwithnofrontiers/inventory-app/blob/main/docs/deployment/new-website.md).
   - The **catalogue and sheet declaration** — step 2 below.
   - The **theme** — see "Webdesigner — theming the website" below.
   - The **`.new-architecture/<slug>` submodule** pointer in inventory-app —
     also documented in `docs/deployment/new-website.md` above.
2. **Declare the catalogue and the sheet.** A scaffolded website already has
   four real pages — a landing page, a results page, a record page and an
   About page — and none of them is written here: they are the composed
   views of `@museumwnf/viewer-layout/views` (see "Composed views" below),
   driven by declarations. The results and record pages read `catalogue` and
   `sheet` from `src/composables/useCatalogue.js`: `catalogue` says what the
   results page filters on (which facets, what the URL carries for them, the
   date rule, the page size) and how a row looks; `sheet` says which fields a
   record shows, in what order, under which `sheet.field.*` labels. Adjust
   both to the dataset — a facet is one line in `facets` and one in
   `controls`, a field is one line — and the cards and the record on display
   come from `home` in `src/dataset.config.js`. The About page reads its own
   `about` declaration, next to `home` in the same file; replace its
   `__SITE_NAMESPACE__.about.body` text in `locales/en.json` with what the
   dataset is and who published it. A page that is not one of the composed
   views' shape is the website's own component on the same content
   components, registered on the same route name.
3. **Merge the first PR** (the placeholder replacement). The deploy workflow
    publishes the site to `https://museumwithnofrontiers.github.io/<dataset>/`.

The CI, deploy and audit workflows carry an
`if: ${{ !endsWith(github.repository, '/website-template') }}` guard so the
template itself — which has no lockfile and an unresolvable `__DATASET__`
dependency — does not report failing checks. It checks the repository name
rather than a fixed owner, so it keeps working across any future rename or
move of the owning account; the condition is false only in a repository
actually named `website-template`, so it is true in every repository created
from the template and the checks simply run there.

The deployed base path comes from the `BASE_PATH` environment variable at
build time; the deploy workflow defaults it to `/<repo>/` for Pages. For a
root deployment (custom domain), pass `base_path: /` to the deploy workflow.

---

## Translator — editing the website's texts

You only need a GitHub account and a browser. The files under `locales/` hold
**this website's own texts**, one file per language — `en.json` is English,
`fr.json` French, and so on.

Texts shared with the other websites of the same kind — the labels of an item
sheet, the navigation, the buttons — are not here: they live in
[`viewer-i18n`](https://github.com/museumwithnofrontiers/viewer-i18n) and are edited there,
the same way. This website can override any of them by writing the same entry
name in its own file. The museum content itself arrives already translated and
is not edited anywhere.

1. **Open the folder.** Bookmark this link on the website's GitHub page:
   `locales/`. Click the language file you want to change.
2. **Click the pencil** (✏️, top right of the file view). The file opens in an
   editable text box. Change only the text between the second pair of
   quotation marks on a line — the part before the colon is the name of the
   entry and must stay exactly as it is.
3. **To start a new language**, open `en.json`, copy all of its content, then
   create the new file (Add file → Create new file) named with the two-letter
   language code, e.g. `ar.json`, paste, and translate the texts. A language
   does not have to be complete: anything you have not translated shows in
   English.
4. **Click "Commit changes…" then "Propose changes".** GitHub asks nothing
   else — it saves your edit as a proposal.
5. **Wait for the automatic check.** After a minute or two, the proposal page
   shows a green tick and your change goes live on the website by itself a few
   minutes later. If something is off, a comment appears explaining in plain
   language what to fix — edit again on the same page and the check reruns.

A text is **just text**, formatted with Markdown if you want: `**bold**`,
`*italic*`, `[a link](https://example.org)`. It may not contain HTML tags, and
it may not contain `{` or `}` — nothing is ever inserted into a text, so a
number or a date is placed next to it by the website rather than inside it.

---

## Webdesigner — theming the website

The website's whole visual identity lives in the `theme/` folder:
`tokens.css` (colors, fonts, spacing — the normal surface), `overrides.css`
(escape hatch) and `assets/` (logo, banner, sponsor images). Small changes can
be made straight in the browser with the pencil button, like the translator
flow above — styling changes are reviewed, they do not merge automatically.
For real design work, use the live preview:

1. **One-time setup:**
   - Install **Docker Desktop** (docker.com) and **GitHub Desktop**
     (desktop.github.com), each with default settings.
   - In GitHub Desktop: File → Clone repository → pick this website's repo.
   - No npm login is needed: every `@museumwnf` package installs anonymously
     from npmjs. Nothing in this repository holds a token.
2. **Start the preview:** open a terminal in the folder (GitHub Desktop:
   Repository → Open in Command Prompt) and run:

   ```bash
   docker compose up
   ```

   The first start downloads everything and takes a few minutes; wait until a
   line shows `Local: http://localhost:5173/`, then open
   **http://localhost:5173** in your browser.
3. **Edit `theme/`, watch it live.** Every save refreshes the browser
   automatically. `tokens.css` lists every knob with a comment; put images
   into `theme/assets/` and reference them from `src/dataset.config.js`
   (banner, sponsor logos). Anything a token cannot express goes into
   `overrides.css`. A change to a layout component itself is a request for the
   `viewer-layout` package — open an issue there and a developer pairs on it.
4. **Propose your changes:** in GitHub Desktop, write a short summary bottom
   left → **Commit** → **Push origin** → **Create Pull Request** (opens in the
   browser → green **Create pull request** button). After a colleague approves
   it, the change merges and deploys by itself. Stop the preview with
   `Ctrl+C` in the terminal when done.

---

## Developer notes

The platform has one architecture, and every website follows it. These are its
rules; each one exists because a site that broke it cost something real. The
pass that imposed them is metanull/inventory-app#1683, and the scaffold in this
repository already obeys all eleven — a new website starts compliant and stays
that way by not undoing them.

**1. `src/dataset.config.js` is the whole declaration.** Routes, languages,
shell, media host, outbound links. Before the application mounts, the website
reads nothing from its package but `manifest.json`. `src/main.js` needs no edit
after the placeholders are replaced.

### A gallery or exhibition website

A `gallery` or `exhibition` website does not write its platform pages in
`src/dataset.config.js`: `@museumwnf/viewer-layout/dxa` exports them already
composed, and `standardRoutes(family, config)` returns them as route entries
a website spreads into `extraViews` — see the commented-out examples right
above `extraViews` in `src/dataset.config.js`.

`standardRoutes('gallery', config)` provides the About page, the Credits
page, the search how-to page, the partners list, a partner's profile, the
search results page, the timeline results page, the timeline gallery, the
collection results page, the collection search form and a partner's objects
page. Only Credits needs a per-site string, passed as `config.creditsBody`.

`standardRoutes('exhibition', config)` provides the search how-to page, the
partners list, a partner's (or institution's) profile, the search results
page, the timeline results page, the timeline gallery, the collection
results page, the collection search form and a partner's (or institution's)
objects page — the institution pages share the partner pages' component,
with no separate route to write. About, the theme gallery, the theme pages
and the related-content page stay out of the factory for now, blocked on the
Theme epic (inventory-app#1729). Exhibition's per-site strings are the five
keys of `config.partnerObjects`: `emptyPartner`, `emptyInstitution`,
`institutionSummary`, `partnerProfileLabel`, `institutionProfileLabel`.

Every route name and path the factory registers is pinned inside
viewer-layout to what every live DXA site already uses — never redeclare one
of them here, or a second declaration of the same address will drift from
the first. The website's own routes stay in `src/dataset.config.js`: home,
item, and the entrances into the collection, the timeline and the partners
section — pages that read this dataset's own shape rather than the shape the
factory already covers.

Full page, prop and slot detail: viewer-layout's README,
["DXA family pages"](https://github.com/museumwithnofrontiers/viewer-layout#dxa-family-pages).

**2. Records and translations come from viewer-core, lazily.** `entityRef`,
`byId`, `loadTranslations`, `translations`, `tr` — see `src/composables/useCatalogue.js`,
which is derivation over those and holds no state of its own. Rename it after
the website. Nothing in `src/` imports `@inventory-data` directly, and nothing
keeps a second cache. In particular, never resolve a language with an
interpolated dynamic import: `` import(`@inventory-data/translations/items.${lang}.json`) ``
cannot be resolved statically, so a bundler pulls in every language of that
entity eagerly. On a large dataset that is a build which never finishes in CI —
which is what happened, on three sites.

**3. Glossary highlighting is the renderer's.** Pass `[{ id, spelling }]` to
`md`/`mdInline` and viewer-core marks each occurrence while it parses. Wrapping
a `<span>` into the text beforehand puts markup where a record's text should be,
and it is escaped like any other raw HTML.

**4. One site language, negotiated once.** `offeredLanguages()` in the config
decides what the site offers: what the package declares for it, kept where the
items carry content. Never derive it from `manifest.languages`, which lists
every language the project ever touched — most with no translation file, so the
switcher would offer languages whose pages are all English.

**5. A record's language is not the site's.** An item sheet reads
`useRecordLanguage(record, { entity: 'items' })`: the site language where the
record carries it, English where it does not, the record's first language
otherwise. The visitor may toggle it there, and that toggle never touches the
site language or the address.

**6. Every field is Markdown, escaped in one place.** `md`, `mdInline` and
`mdStrip` in the composable are viewer-core's renderers and the only place a
record becomes HTML. A tag that slipped past the importer appears on the page as
the characters it is; when that happens the fix belongs in the importer, not in
a view.

**7. The shell is `@museumwnf/viewer-layout`'s `SiteShell`, from config.**
`src/SiteShell.vue` only mounts it and fills the `#brand` slot with the
header lockup, because a label is a text and a text needs the running
application; the menu, the language switcher and the link lists are built by
`SiteShell` itself from `config.navigation` (see the package's README, "Site
shell"). A shape it cannot express is a request to
[`viewer-layout`](https://github.com/museumwithnofrontiers/viewer-layout), not a chrome
component built here.

**8. One routing convention.** Every route named, sections kebab-case, the page
and all filters in the query, `meta.entities` naming what the view reads.
Addresses the site used to publish go in `legacyRoutes`, redirect-only. The
catch-all is viewer-core's; do not declare a second one.

**9. A website owns its theme, and nothing else.** `theme/tokens.css` for the
chrome, `src/styles/site.css` for the views' own content styles. Layout belongs
to `viewer-layout`, behaviour to `viewer-core`.

**10. CI is thin and pinned.** The five workflows below call
`museumwithnofrontiers/viewer-workflows` at an exact version.

**11. A page is composed of platform components, or is the site's own by
choice.** The landing page, the results page, the record page and the About
page are viewer-layout's `HomeView`, `CatalogueResultsView`, `RecordView` and
`TextPageView`, named in `views` (the first three) or on their own route (the
last) and driven by a declaration — what the page filters on, which fields it
shows, under which labels. No page here carries a copy of the query state,
the pagination, a facet builder, a date predicate, a field engine, a glossary
handler or a result row: those are viewer-core's, once, and the components
are viewer-layout's. A page whose shape the composed views do not have is a
component of this website, written on the same content components and
registered on the same route name; that is a choice made in the open, not a
copy made by habit.

### Composed views

Nine whole pages, made of viewer-layout's content components on viewer-core's
engine, that a website names in a declaration instead of writing. This
template already names three of them (`HomeView`, `CatalogueResultsView`,
`RecordView`, in `config.views`) and one more on its own route
(`TextPageView`, for the About page). The other five are there for the page
a website adds next — an essay page, a partner list, a search form, a link
list, a timeline — without writing one from scratch. Full declarations and
slots are in [`viewer-layout`](https://github.com/museumwithnofrontiers/viewer-layout)'s
README, "Composed views".

| View | One line |
| --- | --- |
| `HomeView` | The landing page: a title, an intro, section cards and one featured record. |
| `CatalogueResultsView` | A filtered, paginated list or grid of one entity, from a facet/control spec. |
| `RecordView` | One record's sheet: fields, sections, media, credits, related records. |
| `EssayView` | A themed page in a tree (an exhibition theme, a chapter), with navigation, tabs and a picture panel. |
| `LinkListView` | A titled list of link groups — further reading, external resources. |
| `TextPageView` | One block of body text and an optional back link — this template's About page. |
| `TimelineResultsView` | A filtered timeline of dated events, with an entrance-only mode for the form alone. |
| `PartnerListView` | Partners grouped by country or tier, with an optional A-Z toggle. |
| `SearchFormView` | An advanced-search entrance: keyword rows, facets or one-at-a-time radio choices. |

A page whose shape none of these have is the website's own component, on the
same content components (`@museumwnf/viewer-layout/content`), registered on
the same route name — the escape hatch stays open; nothing about a composed
view is mandatory.

Two more things worth knowing before writing a page:

- **Texts come from two layers**, merged in `src/main.js` with `mergeMessages`:
  the `@museumwnf/viewer-i18n` bundle for this kind of website, then this
  website's `locales/`, which wins. Read one with `$t('name')` in a template or
  `useI18n()` from `@museumwnf/viewer-core` in a script, and render Markdown with
  `<I18nText keypath="…">`. Entry names must be **written out in full** at the
  call site: CI checks that every one resolves, and it can only check the names
  it can see. Nothing is ever interpolated into a text — a number or a date is
  placed next to it by the view.
- **`npm run test`** runs `tests/smoke.test.js`, on the shared testing kit
  (`mountSite`, `checkRoutes`, `checkSectionMeta`, `checkTextsRendered` from
  `@museumwnf/viewer-core/testing`) rather than a local copy of the same
  mounting and assertion code every website used to carry. It asserts the
  rules above that a test can reach: named routes with a section each,
  declared entities, no generic entity pages, the landing page's cards, the
  results page's rows and filter panel, the record page's sheet, the About
  page's body text, and the language rule through `checkOfferedLanguages`.
  Add website-specific tests next to it. There is no Markdown test here — the
  renderers are viewer-core's and are tested there.

And on rule 10, the pinned CI:

- CI (`.github/workflows/`) is a set of thin callers of
  [`museumwithnofrontiers/viewer-workflows`](https://github.com/museumwithnofrontiers/viewer-workflows);
  build, test and texts block, ESLint + `npm audit` report, text-only PRs
  validate and auto-merge, a weekly audit opens issues on findings.
- Those callers pin an **exact** `viewer-workflows` version, never a moving
  major tag. Do not "simplify" them to `@v1`: that tag is frozen at v1.1.2 and
  force-moving it would deploy unverified CI to every website at once. New
  releases arrive as a Dependabot pull request — the `github-actions` ecosystem
  covers reusable-workflow refs — so this site's own CI validates a release
  before it is adopted, and green minor/patch bumps auto-merge.
- **`@museumwnf` npm packages are deliberately not managed by Dependabot.**
  They publish publicly to npmjs, which Dependabot can read without a token —
  the GitHub Packages restriction that used to block it is gone — but
  `.github/dependabot.yml` still ignores the scope, and it stays that way by
  design: website-template is not a propagate target (a new site's platform
  versions are set once, at creation, from what live sites already run), so
  the versions declared here are updated by hand instead, deliberately kept
  close to what the release-then-propagate run has already put on live
  sites. An independent Dependabot bump here could hand a newly scaffolded
  site a platform version no live site has run yet. Dependabot still keeps
  third-party dependencies and GitHub Actions current, which both resolve
  fine. The procedure, and the reasoning, are in
  [MAINTENANCE.md](https://github.com/museumwithnofrontiers/viewer-workflows/blob/main/MAINTENANCE.md).

## Licence

This package is Content of the MWNF Website under the [MWNF legal
notice](https://www.museumwnf.org/about/legal-notice), which governs its use
(non-commercial, personal, educational and scientific use is permitted, with
attribution and mandatory reporting — see the notice for the full terms). The
notice text also ships in this package as `LICENSE.md`. Every website
scaffolded from this template inherits both the notice and the `license`
field in `package.json`.
