import { describe, expect, it, vi } from 'vitest'
import { loadEntities, mergeMessages } from '@museumwnf/viewer-core'
import {
  checkOfferedLanguages, checkRoutes, checkSectionMeta, checkTextsRendered, mountSite,
} from '@museumwnf/viewer-core/testing'
import { catalogues as sharedTexts } from '@museumwnf/viewer-i18n/__SITE_CLASS__'
import ownTexts from '../locales/en.json'
import config from '../src/dataset.config.js'

// The same two layers main.js assembles, in the same order: the shared bundle
// first, this website's own file last. Mounting without them would prove
// nothing about the chrome — every text would render as its own name.
const messages = mergeMessages(sharedTexts, { en: ownTexts })

describe('website smoke test', () => {
  it('mounts against the configured data package', async () => {
    const { app, host } = await mountSite(config, messages)

    expect(host.querySelector('.mwnf-page')).not.toBeNull()

    // The composed landing page (named in `config.views.home`) replaces
    // viewer-core's generic home view: the title, the cards and the record
    // on display come from `config.home`, not from a page written here.
    expect(host.querySelector('.vc-home')).toBeNull()
    expect(host.querySelector('.mwnf-home__title').textContent.trim()).not.toBe('')
    expect(host.querySelector('.mwnf-cards__card')).not.toBeNull()

    // The one thing this template's own test checks that the shared kit
    // cannot: the placeholder site name renders in the header lockup, the
    // #brand slot SiteShell.vue fills.
    expect(host.textContent).toContain('__DATASET__')

    app.unmount()
  }, 20000)

  // The other pages a scaffolded website starts with, rendered against the
  // data package by the composed views, each on an application mounted on
  // that page's address — as a visitor arrives from a link. The results page
  // lists records under the filter panel the catalogue spec declares; the
  // record page shows a record's sheet under the labels the sheet spec
  // declares; the About page renders the one body entry the about spec names.
  it('renders the composed results page from the catalogue spec', async () => {
    const { app, host } = await mountSite(config, messages, '#/catalogue')
    await vi.waitFor(() => expect(host.querySelector('.mwnf-list__row')).not.toBeNull(), { timeout: 20000 })
    expect(host.querySelector('.mwnf-filter')).not.toBeNull()
    expect(host.querySelector('.mwnf-summary__count')).not.toBeNull()
    app.unmount()
  }, 60000)

  it('renders the composed record page from the sheet spec', async () => {
    const [items] = await loadEntities(['items'])
    const { app, host } = await mountSite(config, messages, `#/item/${encodeURIComponent(items[0].id)}`)
    await vi.waitFor(() => expect(host.querySelector('.mwnf-sheet__label')).not.toBeNull(), { timeout: 20000 })
    expect(host.querySelector('.mwnf-record__title').textContent.trim()).not.toBe('')
    app.unmount()
  }, 60000)

  it('renders the About page on TextPageView from the about spec', async () => {
    const { app, host } = await mountSite(config, messages, '#/about')
    expect(host.querySelector('.mwnf-prose').textContent.trim()).not.toBe('')
    app.unmount()
  }, 20000)

  it('declares every route by name, and leaves the catch-all to the router', () => {
    // A named route is what a view links to; a path written into a link is a
    // second declaration of the same address, and the two drift.
    expect(checkRoutes(config, { names: ['catalogue', 'item', 'about'] })).toEqual([])
    // The three slots are the composed views, not viewer-core's generic ones.
    expect(Object.keys(config.views ?? {}).sort()).toEqual(['detail', 'home', 'list'])
  })

  it('declares the entities every route reads', () => {
    // A view rendering records against `null` is the failure this prevents:
    // the router loads what a route names before the view is created.
    for (const route of config.extraViews) {
      expect(Array.isArray(route.meta?.entities), route.name).toBe(true)
    }
  })

  it('declares the section every route belongs to', () => {
    // The shell reads `meta.section` (viewer-core's `useSection()`) to
    // highlight the current section in the menu; a route without one would
    // leave the menu silently unmarked rather than fail.
    expect(checkSectionMeta(config)).toEqual([])
  })

  it('publishes no generic entity pages', () => {
    // Leaving `entities` at the package default publishes one list and one
    // detail page per exported entity — routes this website never had, showing
    // the data package's shape rather than the site's.
    expect(config.features.entities).toEqual([])
  })

  // The one language rule, checked the same way in all seven websites: every
  // offered language is one the package declares for this site AND one the
  // items actually carry. Offering a language whose item sheets all render
  // English is the failure this catches, and a visitor cannot tell it from a
  // site that is simply untranslated.
  it('offers the languages the package declares, where the items carry them', () => {
    expect(checkOfferedLanguages(config)).toEqual([])
    expect(config.languages.length).toBeGreaterThan(0)
    const switcher = config.navigation.languages
    expect(switcher.map((l) => l.code)).toEqual(config.languages)
    expect(switcher.every((l) => Boolean(l.label))).toBe(true)
  })

  // The chrome is two layers, and either one failing is silent: a missing
  // entry renders as its own name rather than as an error. This asserts the
  // rendered page, not the files, so a bundle that installs but never reaches
  // the components fails here too.
  it('renders the shared texts and its own over them', async () => {
    const { app, host } = await mountSite(config, messages)

    // From viewer-i18n: the layout's skip link.
    expect(host.textContent).toContain('Skip to content')
    // Nothing rendered as a bare entry name, which is what a missing text
    // looks like — there is no exception to throw for one.
    expect(checkTextsRendered(host, { namespaces: ['__SITE_NAMESPACE__', 'core', 'layout'] })).toEqual([])

    app.unmount()
  }, 20000)
})
