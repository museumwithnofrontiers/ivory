import {
  languageLabels, mwnfLinks, offeredLanguages, sectionMeta, useDataPackage,
} from '@museumwnf/viewer-core'
import {
  CatalogueResultsView, HomeView, RecordView, TextPageView,
} from '@museumwnf/viewer-layout/views'
import SiteShell from './SiteShell.vue'
import { catalogue, sheet } from './composables/useCatalogue.js'

// The whole declaration of this website. Before it mounts, the website reads
// nothing from its package but the manifest: the languages it offers, their
// labels and its name come from `manifest.site`, and every record is loaded by
// the route that reads it. Nothing else in `src/` imports `@inventory-data`.

const { manifest } = useDataPackage()

// The languages the package declares for this site, kept where the item
// translations actually carry them. Pass `{ declared: [...] }` to offer fewer
// than the package declares — a site whose chrome is English-only, say.
//
// A record may carry more languages than the site offers; its own page reads
// those from `useRecordLanguage`, without touching the site language.
const languages = offeredLanguages()

// Every route names the section it belongs to and the entities its own view
// reads on top of that; this website has no chrome entities every page loads
// regardless, so `sectionMeta()` takes none.
const meta = sectionMeta()

// The About page: viewer-layout's TextPageView on one body entry and a link
// back to the landing page — no records, no facets. A second static page
// (credits, a legal notice) is one more spec and one more route the same way.
const about = {
  body: '__SITE_NAMESPACE__.about.body',
  back: { label: 'core.action.back', to: { name: 'home' } },
}

export default {
  // The dataset package this website renders. Must match the alias in
  // vite.config.js and the dependency in package.json.
  datasetPackage: '@museumwnf/__DATASET__-data',

  // The website's name, as the package declares it. The fallback is what a
  // package predating `manifest.site` still shows.
  siteName: manifest.site?.names?.en ?? '__DATASET__',

  features: {
    // No generic entity pages. viewer-core can publish one list and one detail
    // page per exported entity, which is useful for looking at a new dataset
    // and wrong for a website: those routes expose the data package's shape
    // rather than the site's. Set `entities: entityNames` from
    // `useDataPackage()` temporarily while exploring; ship `[]`.
    entities: [],
  },

  // The three slots every website has — the home page, a list page, a record
  // page — are the composed views of viewer-layout: pages made of the shared
  // components on the shared engine, driven by the declarations below rather
  // than by a page written here. `home` is the route `/`; `list` and `detail`
  // are what `features.entities` would publish, named here so that switching
  // it on while exploring a dataset shows real pages too. A website whose
  // page is not that shape writes its own component on the same components,
  // and registers it on the same route name; nothing else changes.
  views: { home: HomeView, list: CatalogueResultsView, detail: RecordView },

  // What the landing page shows. Every text is an entry name, written out,
  // that the view resolves — a translator's file changes the page. The
  // record on display is one item with an image, picked once per visit.
  home: {
    title: '__SITE_NAMESPACE__.identity.title',
    intro: '__SITE_NAMESPACE__.home.intro',
    cards: [
      {
        title: '__SITE_NAMESPACE__.nav.catalogue',
        description: '__SITE_NAMESPACE__.home.catalogueText',
        action: 'core.action.browse',
        to: { name: 'catalogue' },
      },
    ],
    featured: {
      entity: 'items',
      heading: '__SITE_NAMESPACE__.home.itemOnDisplay',
      action: 'core.action.viewDetails',
      route: 'item',
      eyebrow: 'type',
      meta: ['location', 'dates'],
    },
  },

  // The site language. One per visit, negotiated once by viewer-core: an
  // explicit `?lang=`, then the remembered choice, then the browser, then
  // English.
  languages,

  shell: SiteShell,

  // Everything @museumwnf/viewer-layout's SiteShell reads to build the menu,
  // the language switcher, the header/footer link lists and the search
  // submit — see its README, "Site shell". A label is an entry name, resolved
  // by SiteShell itself (it installs the catalogue), so nothing here builds
  // menu markup by hand any more.
  navigation: {
    languages: languageLabels(languages),
    links: [
      { section: 'home', label: 'core.nav.home', to: { name: 'home' } },
      { section: 'catalogue', label: '__SITE_NAMESPACE__.nav.catalogue', to: { name: 'catalogue' } },
      { section: 'about', label: '__SITE_NAMESPACE__.nav.about', to: { name: 'about' } },
    ],
  },

  // Where this website's media lives. `mediaUrl(path, size)` builds an address
  // from a path the data package carries; no view reads `import.meta.env` and
  // no host is written anywhere but here.
  media: {
    legacyHost: 'https://images.museumwnf.org',
  },

  // Every address this website links out to, by name. `mwnfLinks` is the
  // portal and its siblings every website links to; a website adds to it
  // rather than copying it (`links: { ...mwnfLinks, ownPage: '...' }`).
  links: mwnfLinks,

  // The route map. Every route is named, sections are kebab-case, the page
  // and every filter live in the query, and each route says which section it
  // belongs to (the shell reads `useSection()` for the banner and the menu).
  // Each route declares the entities its view reads, so the router loads them
  // before the view is created and no page renders against records that are
  // not there yet.
  //
  // The 'home' name is the slot `views.home` fills. The routes below are the
  // results page, the record page and the About page on the composed views,
  // each driven by a spec passed as route props: the catalogue spec says what
  // the list filters on and how a row looks, the sheet spec says which fields
  // a record shows under which labels, and the about spec is one body entry.
  //
  // A gallery or exhibition website does not write its platform pages here at
  // all: `@museumwnf/viewer-layout/dxa` exports them already composed and
  // confirmed byte-identical within their family's own site pair, and
  // `standardRoutes(family, config)` returns them as ready-made route
  // entries. Such a website spreads `...standardRoutes('<family>', config)`
  // first in `extraViews`, keeping only its own routes after it — home, item
  // and the entrances into the collection, the timeline and the partners
  // section, which stay the website's own because they read this dataset's
  // shape rather than the shape the factory already covers. Route names and
  // paths are pinned inside the factory to what every DXA site already
  // registers, so a deep link or a `legacyRoutes` entry targeting one of them
  // keeps resolving unmodified — never redeclare one of those names or paths
  // here. This scaffold is `standalone`, which has no standard routes: the
  // examples below stay commented out on purpose, and a `standalone` build
  // must never carry a live import of the DXA entry point.
  //
  // A gallery website:
  //
  //   import { standardRoutes } from '@museumwnf/viewer-layout/dxa'
  //
  //   extraViews: [
  //     ...standardRoutes('gallery', { creditsBody: '__SITE_NAMESPACE__.credits.body' }),
  //     // + this website's own routes: home, item, collection entrance,
  //     // timeline entrance, partners entrance
  //   ]
  //
  // An exhibition website:
  //
  //   import { standardRoutes } from '@museumwnf/viewer-layout/dxa'
  //
  //   extraViews: [
  //     ...standardRoutes('exhibition', {
  //       partnerObjects: {
  //         emptyPartner: '__SITE_NAMESPACE__.partnerObjects.emptyPartner',
  //         emptyInstitution: '__SITE_NAMESPACE__.partnerObjects.emptyInstitution',
  //         institutionSummary: '__SITE_NAMESPACE__.partner.monumentsInExhibition',
  //         partnerProfileLabel: '__SITE_NAMESPACE__.partnerObjects.partnerProfile',
  //         institutionProfileLabel: '__SITE_NAMESPACE__.partnerObjects.institutionProfile',
  //       },
  //     }),
  //     // + this website's own routes: home, item, collection entrance,
  //     // timeline entrance, partners entrance
  //   ]
  extraViews: [
    {
      path: '/catalogue',
      name: 'catalogue',
      component: CatalogueResultsView,
      props: { spec: catalogue },
      meta: meta('catalogue', 'items', 'countries'),
    },
    {
      path: '/item/:id',
      name: 'item',
      component: RecordView,
      props: (route) => ({ spec: sheet, id: route.params.id }),
      meta: meta('catalogue', 'items', 'countries', 'partners'),
    },
    {
      path: '/about',
      name: 'about',
      component: TextPageView,
      props: { spec: about },
      meta: meta('about'),
    },
  ],

  // Addresses this website was published under before, each resolving onto a
  // canonical route above. Redirect-only: no view, no second way to reach a
  // page. A website that has never moved leaves this empty.
  legacyRoutes: [],

  // The unmatched-address page is viewer-core's, on a catch-all it adds
  // itself. Pass `notFound: false` to leave it out, or a component to replace
  // it — do not declare a `/:pathMatch(.*)*` route here.
}
