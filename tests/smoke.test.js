import { describe, expect, it, vi } from 'vitest'
import { loadEntities, mergeMessages } from '@museumwnf/viewer-core'
import {
  checkOfferedLanguages, checkRoutes, checkSectionMeta, checkTextsRendered, mountSite as mountApp,
} from '@museumwnf/viewer-core/testing'
import { catalogues as sharedTexts } from '@museumwnf/viewer-i18n/gallery'
import ownTexts from '../locales/en.json'
import config from '../src/dataset.config.js'
// The data package's own manifest, read the same way `useDataPackage()`
// does (the `@inventory-data` alias `defineViewerConfig` sets up) — never a
// URL literal, so the assertions below track whatever the package ships.
import manifest from '@inventory-data/manifest.json'

// The same two layers main.js assembles, in the same order: the shared bundle
// first, this gallery's own file last. Mounting without them would prove
// nothing about the chrome — every text would render as its own name.
const messages = mergeMessages(sharedTexts, { en: ownTexts })

// Mounted on the address under test, as a visitor arrives from a link. The
// kit's own `mountSite` does the work every website's smoke test repeated.
function mountSite(hash = '#/') {
  return mountApp(config, messages, hash)
}

describe('website smoke test', () => {
  it('mounts against the configured data package', async () => {
    const { app, host } = await mountSite()

    expect(host.querySelector('.mwnf-page')).not.toBeNull()

    // The website's own Home view (registered under the route name 'home')
    // must replace viewer-core's generic home view.
    expect(host.querySelector('.vc-home')).toBeNull()

    app.unmount()
  }, 20000)

  // The collection results and the item sheet run on the platform's composed
  // views (metanull/viewer-core#50): the tiles, the dependent options and the
  // pages come from the spec, the sheet's rows from the sheet spec, and what
  // only this gallery has — the panel in the aside, the related-content
  // container — fills the views' slots.
  it('renders the collection results on the composed results view', async () => {
    const { app, host } = await mountSite('#/collection-results')
    await vi.waitFor(() => expect(host.querySelector('.mwnf-grid__tile')).not.toBeNull(), { timeout: 20000 })
    expect(host.querySelector('.mwnf-catalogue')).not.toBeNull()
    expect(host.querySelector('.mwnf-catalogue__aside .mwnf-filter')).not.toBeNull()
    expect(host.querySelector('.mwnf-summary__count')).not.toBeNull()
    // Nine a page. Ivory's 56 items span more than one page.
    expect(host.querySelectorAll('.mwnf-grid__tile').length).toBe(9)
    expect(host.querySelectorAll('.mwnf-pagination').length).toBe(2)
    app.unmount()
  }, 60000)

  // The collection entrance and the header search results run on the
  // platform's composed views: the facet dropdowns, the from/to year buckets
  // and the navigate-on-choice behaviour are `SearchFormView`'s (`mode:
  // 'facets'`, CollectionSearch.vue); the boolean keyword grammar over the
  // haystack is `CatalogueResultsView`'s `narrow` (SearchResults.vue).
  it('renders the collection entrance on the composed search form view', async () => {
    const { app, host } = await mountSite('#/collection')
    await vi.waitFor(() => expect(host.querySelector('.mwnf-search-form')).not.toBeNull(), { timeout: 20000 })
    // The country dropdown plus at least one populated tag category.
    expect(host.querySelectorAll('.mwnf-search-form .mwnf-facet').length).toBeGreaterThan(1)
    // The shared from/to year buckets (`dates: 'buckets'`).
    expect(host.querySelector('.mwnf-search-form__dates')).not.toBeNull()
    expect(host.textContent).toContain('this Gallery’s database')
    app.unmount()
  }, 30000)

  it('returns every renderable object for the all-objects sentinel', async () => {
    const { app, host } = await mountSite('#/search?q=all-objects')
    await vi.waitFor(() => expect(host.querySelector('.mwnf-grid__tile')).not.toBeNull(), { timeout: 20000 })
    expect(host.textContent).toContain('All objects')
    app.unmount()
  }, 30000)

  it('renders a keyword search on the composed results view', async () => {
    const [items] = await loadEntities(['items'])
    // Its own internal name is always in its own haystack, so searching for
    // its first word is guaranteed at least one hit whatever that word is.
    // Ivory's own names carry Markdown emphasis (`*Infant Jesus…*`), so the
    // leading punctuation is stripped — the boolean search itself does not
    // tokenise on a bare `*`.
    const term = items[0].internal_name.match(/[\p{L}\p{N}]+/u)[0]
    const { app, host } = await mountSite(`#/search?q=${encodeURIComponent(term)}`)
    await vi.waitFor(() => expect(host.querySelector('.mwnf-grid__tile')).not.toBeNull(), { timeout: 20000 })
    expect(host.textContent).toContain(`“${term}”`)
    app.unmount()
  }, 30000)

  it('offers the two ways out of an empty keyword search', async () => {
    const { app, host } = await mountSite('#/search?q=zzz-nonexistent-keyword-zzz')
    await vi.waitFor(() => expect(host.querySelector('.mwnf-catalogue')).not.toBeNull(), { timeout: 20000 })
    expect(host.textContent).toContain('No items match your search.')
    expect(host.querySelector('a[href="#/how-to-search"]')).not.toBeNull()
    expect(host.querySelector('a[href="#/collection"]')).not.toBeNull()
    app.unmount()
  }, 30000)

  it('renders the search how-to essay on the composed text page view', async () => {
    const { app, host } = await mountSite('#/how-to-search')
    await vi.waitFor(() => expect(host.textContent).toContain('Boolean Full Text Search'), { timeout: 20000 })
    expect(host.querySelector('a[href="#/collection"]')).not.toBeNull()
    app.unmount()
  }, 30000)

  // The about and credits pages are `TextPageView` specs: no shell logic of
  // their own, `back: true` for the generic history-or-nothing link.
  it('renders the about page on the composed text page view', async () => {
    const { app, host } = await mountSite('#/about')
    // Ivory is curatorial-only: its `gallery.about.body` override names the
    // gallery it is dedicated to, rather than an owned project's own name.
    expect(host.textContent).toContain('This Gallery is dedicated to')
    expect(host.textContent).toContain('Ivory')
    expect(host.querySelector('.mwnf-prose')).not.toBeNull()
    app.unmount()
  }, 20000)

  it('renders the credits page on the composed text page view', async () => {
    const { app, host } = await mountSite('#/credits')
    expect(host.textContent).toContain('LOCAL PROJECT TEAMS')
    expect(host.querySelector('.mwnf-prose')).not.toBeNull()
    app.unmount()
  }, 20000)

  it('renders the item sheet on the composed record view', async () => {
    const [items] = await loadEntities(['items'])
    const { app, host } = await mountSite(`#/item/${items[0].id}`)
    await vi.waitFor(() => expect(host.querySelector('.mwnf-sheet__label')).not.toBeNull(), { timeout: 20000 })
    expect(host.querySelector('.mwnf-record')).not.toBeNull()
    expect(host.querySelector('.languages')).not.toBeNull()
    expect(host.querySelector('.mwnf-sheet-related')).not.toBeNull()
    // Ivory owns no native project: items[0] is borrowed from Discover
    // Baroque Art (ivory-data 1.0.1), so the sheet's own source line reads
    // that project's name, not a "Discover Ivory Art" this site never had.
    expect(host.querySelector('.mwnf-sheet-source').textContent).toContain('Discover Baroque Art')
    app.unmount()
  }, 60000)

  // metanull/inventory-app#1727 phase 4: the source-database chip's colour and
  // text come from `dataset.config.js`'s `projectColors` map and the manifest
  // name, keyed by the item's `project_id`.
  it('colours and names the source-database chip from the manifest projects section', async () => {
    const { app, host } = await mountSite('#/item/da8131c4-37b0-5710-a8a7-07aeac9637d5')
    await vi.waitFor(() => expect(host.querySelector('.mwnf-sheet-source .mwnf-chip')).not.toBeNull(), { timeout: 20000 })
    const line = host.querySelector('.mwnf-sheet-source__line')
    expect(line.textContent).toContain('Discover Baroque Art')
    expect(line.querySelector('.mwnf-chip').classList.contains('mwnf-chip--DBA')).toBe(true)
    app.unmount()
  }, 60000)

  // metanull/inventory-app#1727 phase 4: the "added within Explore Islamic Art
  // Collections" notice is driven by `dataset.config.js`'s `noticeProjects`
  // list of project ids, not a literal legacy project-code check — it must
  // show for that project's own records and stay off everyone else's,
  // including the sibling Discover Islamic Art project sharing its chip
  // colour.
  it('shows the explore-partner notice only for the project dataset.config.js lists', async () => {
    const epm = await mountSite('#/item/521d6cfc-68ec-53af-a60c-48b720b5bbf7')
    await vi.waitFor(() => expect(epm.host.querySelector('.mwnf-sheet-source')).not.toBeNull(), { timeout: 20000 })
    expect(epm.host.querySelector('.mwnf-sheet-notice')).not.toBeNull()
    epm.app.unmount()

    const isl = await mountSite('#/item/703b6c7e-f4d6-51d7-9caa-1fade8284326')
    await vi.waitFor(() => expect(isl.host.querySelector('.mwnf-sheet-source')).not.toBeNull(), { timeout: 20000 })
    expect(isl.host.querySelector('.mwnf-sheet-notice')).toBeNull()
    isl.app.unmount()
  }, 60000)

  // metanull/inventory-app#1727 phase 4 / #1753: the related-database and
  // artistic-introduction blocks are purely manifest-driven — a borrowed
  // Discover Islamic Art record carries both URLs.
  it('renders the related-database and artistic-introduction links from the manifest', async () => {
    const [items] = await loadEntities(['items'])
    const item = items.find((i) => i.id === '6b0ea1b6-8a90-55b4-aeb3-3d454a64eeec')
    const project = manifest.projects[item.project_id]

    const { app, host } = await mountSite(`#/item/${item.id}`)
    await vi.waitFor(() => expect(host.querySelector('.mwnf-sheet-related')).not.toBeNull(), { timeout: 20000 })
    const links = () => Array.from(host.querySelectorAll('.mwnf-sheet-related a'))

    expect(project.related_database_url).toBeTruthy()
    expect(host.textContent).toContain('Search Related Database')
    expect(links().some((a) => a.getAttribute('href') === project.related_database_url)).toBe(true)

    if (project.artistic_introduction_url) {
      expect(host.textContent).toContain('Artistic Introduction')
      expect(links().some((a) => a.getAttribute('href') === project.artistic_introduction_url)).toBe(true)
    } else {
      expect(host.textContent).not.toContain('Artistic Introduction')
    }

    app.unmount()
  }, 60000)

  // metanull/inventory-app#1727 phase 4: `useCollection.js`'s tile meta line
  // reads the borrowed item's project name off the manifest too.
  it('shows the source project on a collection-results tile, from the manifest', async () => {
    const [items] = await loadEntities(['items'])
    const [islProjectId] = Object.entries(manifest.projects).find(([, p]) => p.name.en === 'Discover Islamic Art')
    const item = items.find((i) => i.project_id === islProjectId)
    const { app, host } = await mountSite(`#/search?q=${encodeURIComponent(item.internal_name)}`)
    await vi.waitFor(() => expect(host.querySelector('.mwnf-grid__tile')).not.toBeNull(), { timeout: 20000 })
    expect(host.textContent).toContain('for project Discover Islamic Art')
    app.unmount()
  }, 30000)

  // `RecordView`'s default `source` slot renders the credit as soon as the
  // website declares `site.origin` (dataset.config.js), independently of the
  // sheet spec's own `citation.permalink: false`.
  it('renders the source credit on the item sheet, addressed to this deployed site', async () => {
    const [items] = await loadEntities(['items'])
    const item = items[0]
    const { app, host } = await mountSite(`#/item/${item.id}`)
    await vi.waitFor(() => expect(host.querySelector('.mwnf-source-credit')).not.toBeNull(), { timeout: 20000 })
    const link = host.querySelector('.mwnf-source-credit a')
    // The full current route, `?lang=en` and all, follows the item's own
    // path — the assertion only pins the two ends `sourceUrl()` guarantees.
    const address = `${config.site.origin}/#/item/${item.id}`
    expect(link.textContent).toBe(link.getAttribute('href'))
    expect(link.getAttribute('href').startsWith(address)).toBe(true)
    app.unmount()
  }, 60000)

  // Ivory's own items carry no dynasty data, unlike carpets' — the layout's
  // glossary tool and dynasty popouts (@museumwnf/viewer-layout/content) are
  // still available to this gallery's item sheet, but there is no fixture id
  // here whose dynasty translation carries a history to assert on, so that
  // part of carpets' equivalent test is not ported. Documented deviation.

  // The timeline entrance/results and the gallery run on the platform's
  // composed views: the country and period controls, the events list and the
  // "See gallery" cross-link come from the spec in composables/gallery.js.
  it('renders the timeline results on the composed timeline view', async () => {
    const { app, host } = await mountSite('#/timeline-results?country=gr')
    await vi.waitFor(() => expect(host.querySelectorAll('.mwnf-timeline__row').length).toBe(11), { timeout: 20000 })
    expect(host.querySelector('.mwnf-summary').textContent).toContain('11')
    // A Greece event's own description, not just a row count — its
    // translation loads asynchronously, behind the spec's own `tr`.
    await vi.waitFor(() => expect(host.textContent).toContain('Filiki Etaireia'), { timeout: 20000 })
    // The join to member items finds Greece's two dated ivory objects even
    // with no period chosen.
    expect(host.querySelector('.mwnf-timeline__gallery').textContent).toContain('2')
    app.unmount()
  }, 60000)

  it('renders the timeline gallery on the composed results view', async () => {
    const { app, host } = await mountSite('#/timeline/gallery?country=gr')
    await vi.waitFor(() => expect(host.querySelectorAll('.mwnf-grid__tile').length).toBe(2), { timeout: 20000 })
    expect(host.querySelector('.mwnf-summary').textContent).toContain('Greece')
    expect(host.textContent).toContain('Decorative ivory plaque')
    app.unmount()
  }, 60000)

  // The composed entrance's own country control writes the inventory id
  // (`grc`), not the legacy two-letter code (`gr`) the gallery's own deep
  // links carry. Both addresses must produce the same rows and the same
  // gallery count.
  it('filters the timeline the same way on the inventory id as on the legacy code', async () => {
    const { app, host } = await mountSite('#/timeline-results?country=grc')
    await vi.waitFor(() => expect(host.querySelectorAll('.mwnf-timeline__row').length).toBe(11), { timeout: 20000 })
    expect(host.querySelector('.mwnf-summary').textContent).toContain('11')
    await vi.waitFor(() => expect(host.textContent).toContain('Filiki Etaireia'), { timeout: 20000 })
    expect(host.querySelector('.mwnf-timeline__gallery').textContent).toContain('2')
    app.unmount()
  }, 60000)

  it("submits the timeline entrance's country control (an id) to a results address that actually filters", async () => {
    const { app, host } = await mountSite('#/timeline')
    await vi.waitFor(() => expect(host.querySelector('.mwnf-facet__select')).not.toBeNull(), { timeout: 20000 })
    // `controls: [{ key: 'country' }, { key: 'begin' }, ...]` — the country
    // select is the first of the three the entrance renders.
    const countrySelect = host.querySelectorAll('.mwnf-facet__select')[0]
    countrySelect.value = 'grc'
    countrySelect.dispatchEvent(new window.Event('change', { bubbles: true }))
    host.querySelector('form.mwnf-timeline__filters').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }))
    await vi.waitFor(() => expect(host.querySelectorAll('.mwnf-timeline__row').length).toBe(11), { timeout: 20000 })
    expect(host.querySelector('.mwnf-timeline__caption').textContent).toContain('Greece')
    app.unmount()
  }, 60000)

  // The partner pages run on the platform's composed views: the grouping,
  // the A-Z toggle, the record's language, the map and the member-items grid
  // come from the specs in composables/gallery.js.
  it('renders the partners list on the composed partner-list view', async () => {
    const { app, host } = await mountSite('#/partners')
    await vi.waitFor(() => expect(host.querySelector('.mwnf-partner-list__row')).not.toBeNull(), { timeout: 20000 })
    expect(host.textContent).toContain('Germany')
    expect(host.textContent).toContain('Museum of Islamic Art at the Pergamon Museum, State Museums')
    // The object count is this website's own copy over the shared entry, not
    // a generic count.
    expect(host.textContent).toContain('6 object(s) in this site')
    app.unmount()
  }, 60000)

  it('renders a partner profile on the composed record view', async () => {
    const { app, host } = await mountSite('#/partner/559ab197-7289-5af4-a295-1118bde9afce')
    // `.mwnf-record` renders as soon as the id resolves; the name and city
    // only once the translation load the view kicks off settles.
    await vi.waitFor(() => expect(host.textContent).toContain('Museum of Islamic Art at the Pergamon Museum, State Museums'), { timeout: 20000 })
    expect(host.textContent).toContain('Berlin')
    // The map is the layout's `PartnerMap`, not the deleted local component.
    expect(host.querySelector('.mwnf-partner-map')).not.toBeNull()
    // This DXA gallery carries no exhibition-theme or other `EssayView` page
    // for the credit to double-check against, so the partner profile — the
    // other `RecordView` this site renders, with its own `citation: false`
    // — stands in: the `source` slot is independent of the citation switch,
    // so the credit still renders here too.
    expect(host.querySelector('.mwnf-source-credit')).not.toBeNull()
    app.unmount()
  }, 60000)

  it("renders a partner's objects on the composed grid results view", async () => {
    const { app, host } = await mountSite('#/partner/559ab197-7289-5af4-a295-1118bde9afce/objects')
    await vi.waitFor(() => expect(host.querySelectorAll('.mwnf-grid__tile').length).toBe(6), { timeout: 20000 })
    expect(host.textContent).toContain('Museum of Islamic Art at the Pergamon Museum, State Museums')
    app.unmount()
  }, 60000)

  it('declares every canonical route by name, and every legacy shape as a redirect', () => {
    expect(checkRoutes(config, {
      names: [
        'home', 'collection', 'collection-results', 'item', 'search-results', 'search-how-to',
        'partners', 'partner', 'partner-objects', 'timeline', 'timeline-results', 'timeline-gallery',
        'about', 'credits',
      ],
      legacyPaths: [
        '/database-item/:uid(.*)/:language',
        '/partner/:country/:id/:language',
        '/partner-objects/:country/:id/:page',
        '/timeline-gallery/:country/:start/:end/:page',
      ],
    })).toEqual([])
  })

  // inventory-app#1731: `standardRoutes('gallery', config)` provides 11 of
  // these 14 entries (every one but home/item/timeline), identically for
  // every DXA gallery site — this pins the exact set `config.extraViews`
  // declares.
  it('pins every route name to the same path as before standardRoutes was adopted', () => {
    const routes = config.extraViews
      .map((r) => ({ name: r.name, path: r.path }))
      .sort((a, b) => a.name.localeCompare(b.name))

    expect(routes).toEqual([
      { name: 'about', path: '/about' },
      { name: 'collection', path: '/collection' },
      { name: 'collection-results', path: '/collection-results' },
      { name: 'credits', path: '/credits' },
      { name: 'home', path: '/' },
      { name: 'item', path: '/item/:id' },
      { name: 'partner', path: '/partner/:id' },
      { name: 'partner-objects', path: '/partner/:id/objects' },
      { name: 'partners', path: '/partners' },
      { name: 'search-how-to', path: '/how-to-search' },
      { name: 'search-results', path: '/search' },
      { name: 'timeline', path: '/timeline' },
      { name: 'timeline-gallery', path: '/timeline/gallery' },
      { name: 'timeline-results', path: '/timeline-results' },
    ])
  })

  // Every route needs a section for the menu to know where it is (the shell's
  // `useSection()`), which the config-driven `SiteShell` also relies on for
  // the active menu entry and the banner-title fallback.
  it('gives every route a section', () => {
    expect(checkSectionMeta(config)).toEqual([])
  })

  // The one behaviour a config-driven shell could silently lose: the layout's
  // `SiteShell` marks a `config.navigation.links` entry active by comparing
  // its own `section` to `useSection()`, exactly as the local shell used to.
  it('marks the current section active in the menu, and renders the header, footer and search', async () => {
    const { app, host } = await mountSite('#/partners')
    await vi.waitFor(() => expect(host.querySelector('a[href="#/partners"]')).not.toBeNull(), { timeout: 20000 })

    const active = host.querySelector('.mwnf-nav__link--active')
    expect(active?.getAttribute('href')).toBe('#/partners')
    expect(active?.getAttribute('aria-current')).toBe('page')
    // A sibling entry stays unmarked.
    expect(host.querySelector('a[href="#/timeline"]')?.classList.contains('mwnf-nav__link--active')).toBe(false)

    // The header/footer link lists and the header search box are
    // `config.navigation`'s now, not a local computed list.
    expect(host.querySelector('a[href="#/"]')).not.toBeNull()
    expect(host.querySelector('a[href="https://www.museumwnf.org/about"]')).not.toBeNull()
    expect(host.querySelector('.mwnf-header__search-input')).not.toBeNull()

    app.unmount()
  }, 20000)

  it('offers the languages the package declares for the site, where the items carry them', () => {
    expect(checkOfferedLanguages(config)).toEqual([])
  })

  it('reads nothing but the manifest before it mounts', () => {
    expect(config.media.legacyHost).toMatch(/^https:/)
    expect(Object.keys(config.links)).toEqual(
      expect.arrayContaining(['portal', 'galleries', 'myCollection', 'about', 'contact', 'legalNotice', 'credits', 'cookies']),
    )
  })

  // What this website contributes to a legacy address is the mapping: a dbUid
  // path to an item, a country and legacy id to a partner, the page number out
  // of the path. That the router turns such an entry into a redirect is
  // viewer-core's own test.
  it('maps a legacy address onto the canonical route', async () => {
    const [items, partners] = await loadEntities(['items', 'partners'])
    const [itemFor, partnerFor, objectsFor, galleryFor] = config.legacyRoutes

    const item = items.find((i) => i.backward_compatibility)
    expect(await itemFor.resolve({ uid: item.backward_compatibility.split(':').join('/') })).toEqual({
      name: 'item',
      params: { id: item.id },
    })
    expect(await itemFor.resolve({ uid: 'mwnf3/objects/NOPE/xx/Mus00/0' })).toBeNull()

    const partner = partners.find((p) => (p.backward_compatibility ?? '').split(':').length >= 4)
    const [, , legacyId, country] = partner.backward_compatibility.split(':')
    expect(await partnerFor.resolve({ country, id: legacyId })).toEqual({
      name: 'partner',
      params: { id: partner.id },
    })
    expect(await objectsFor.resolve({ country, id: legacyId, page: '3' })).toEqual({
      name: 'partner-objects',
      params: { id: partner.id },
      query: { page: '3' },
    })

    // The page number and the period leave the path for the query, and an
    // open bound stops being the literal 'any'.
    expect(galleryFor.resolve({ country: 'uk', start: 'any', end: '1500', page: '2' })).toEqual({
      name: 'timeline-gallery',
      query: { country: 'uk', end: '1500', page: '2' },
    })
  }, 20000)

  // The chrome is two layers now, and either one failing is silent: a missing
  // entry renders as its own name rather than as an error. This asserts the
  // rendered page, so a bundle that installs but never reaches the components
  // fails here too.
  it('renders the shared texts and its own over them', async () => {
    const { app, host } = await mountSite()

    const text = host.textContent
    // From viewer-i18n: the layout's skip link, and two of the gallery's own
    // shared entries — one in the menu, one in the standing notice.
    expect(text).toContain('Skip to content')
    expect(text).toContain('All MWNF Galleries')
    expect(text).toContain('Tip:')
    // Nothing rendered as a bare entry name, which is what a missing text
    // looks like — there is no exception to throw for one. Every namespace a
    // page on this site actually reads is listed, not just ivory's own — a
    // raw shared key otherwise passes unseen: the record/sheet/timeline/
    // partner pages read the neutral namespaces directly, on top of
    // `gallery`, this site's own product section.
    expect(checkTextsRendered(host, {
      namespaces: ['ivory', 'core', 'layout', 'catalogue', 'record', 'sheet', 'timeline', 'partner', 'gallery'],
    })).toEqual([])

    app.unmount()
  }, 20000)

  // The footer's attribution and terms-of-use link come from the data
  // package's `manifest.rights` (viewer-core's `useSiteRights()`), read by
  // the layout's own `SiteShell` — nothing this site declares beyond the
  // version pin.
  it('renders the footer attribution and the terms-of-use link from the data package rights', async () => {
    const { app, host } = await mountSite()

    const attribution = host.querySelector('.mwnf-footer__attribution')
    expect(attribution).not.toBeNull()
    expect(attribution.textContent).toContain('Content © Museum With No Frontiers, used under the MWNF legal notice.')

    const terms = attribution.querySelector('a.mwnf-footer__terms')
    expect(terms.textContent).toBe('Terms of use')
    expect(terms.getAttribute('href')).toBe('https://www.museumwnf.org/about/legal-notice')

    app.unmount()
  }, 20000)
})
