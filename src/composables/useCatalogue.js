import {
  byId, entityRef, renderBlock, renderInline, renderPlain, useDataPackage,
} from '@museumwnf/viewer-core'

// This website's records, read the one way every website reads them: through
// viewer-core, lazily. Each entity is a shared ref that stays `null` until a
// route declaring it in `meta.entities` brings its chunk in, so importing this
// module loads nothing and a page pays only for what it reads.
//
// This file holds no state of its own. It is derivation over viewer-core's
// records and translations — refs, lookup maps, label helpers, route helpers.
// A second cache here is a second answer to the same question, and the two
// drift. Nothing here imports `@inventory-data` either: the alias is
// viewer-core's to read.
//
// Rename this file after the website: `useGalleryData.js`, `useExhibitionData.js`,
// `useInventoryData.js` — whatever its records are.

const dataPackage = useDataPackage()
export const manifest = dataPackage.manifest

// ── Records ────────────────────────────────────────────────────────────────
//
// Language-independent; every human-readable string lives under translations/.
// One line per entity this website reads. The name must match the JSON file:
// `entityRef('timeline_events')` reads `timeline_events.json`.

export const items = entityRef('items')
export const partners = entityRef('partners')
export const countries = entityRef('countries')

// English is the base language of every catalogue in the platform: every list,
// label and fallback reads it. Which languages the site OFFERS is decided
// once, in dataset.config.js; which language a record is read in is decided on
// that record's own page, by viewer-core's `useRecordLanguage`.
export const defaultLang = 'en'

// ── Lookup maps ────────────────────────────────────────────────────────────
//
// `byId` returns a computed **Map**, not an object: read it with `.get(id)`.
// `map.value[id]` is `undefined` rather than an error, so a page written that
// way renders nothing at all and looks like missing data.

export const itemById = byId('items')
export const partnerById = byId('partners')
export const countryById = byId('countries')

// ── Translations ───────────────────────────────────────────────────────────
//
// One file per entity per language, resolved by name through viewer-core.
// Never `` import(`…/items.${lang}.json`) ``: a bundler cannot resolve an
// interpolated specifier statically, so it bundles every language of that
// entity eagerly. On a large dataset that is a build which never finishes.

export const { availableLanguages, loadTranslations, translations } = dataPackage

/** One record's translated fields, falling back to English then to nothing. */
export function tr(entity, id, lang = defaultLang) {
  return dataPackage.tr(entity, id, lang, defaultLang)
}

// ── Labels ─────────────────────────────────────────────────────────────────
//
// A label is a record's name reduced to plain text: it appears in a <title>,
// an alt attribute and a select option, where markup would show as characters.

export function itemLabel(item) {
  if (!item) return ''
  return mdStrip(tr('items', item.id).name ?? item.internal_name ?? item.id)
}

// ── Routes ─────────────────────────────────────────────────────────────────
//
// Built by name, never by string concatenation, so a path shape is changed in
// dataset.config.js alone. The language never travels in the path.

export function itemRoute(item) {
  return { name: 'item', params: { id: item.id } }
}

// ── The catalogue spec ─────────────────────────────────────────────────────
//
// What this website's results page filters on and how a row looks. The page
// itself is viewer-layout's `CatalogueResultsView`, on viewer-core's engine;
// this declaration is the whole of what the website decides: the facets and
// what the URL carries for them, the date rule (decision D5 — `overlap`
// tolerates a record with one date, `contain` drops it the moment a bound is
// set; a website names its rule once and never merges the two), the page
// size, the row. Every label is an entry name, written out, that the view
// resolves. Add a facet by adding a line to `facets` and one to `controls`;
// a filter the engine does not know is a `match(record, filters)` predicate,
// and a control it does not draw goes in the view's `#filters` slot from a
// component of your own.

export const catalogue = {
  entity: 'items',
  facets: {
    country: { field: 'country_id', label: countryLabel },
  },
  controls: [
    { key: 'country', label: 'catalogue.facet.country', anyLabel: 'catalogue.facet.any' },
    { key: 'begin', type: 'year', label: 'catalogue.facet.fromYear' },
    { key: 'end', type: 'year', label: 'catalogue.facet.toYear' },
  ],
  filterTitle: 'catalogue.filter.heading',
  dates: { mode: 'overlap', begin: 'begin', end: 'end' },
  pageSize: 20,
  variant: 'list',
  recordRoute: 'item',
  record: (item, { tr }) => {
    const text = tr('items', item.id)
    return {
      id: item.id,
      image: item.images?.[0]?.url ?? '',
      imageAlt: itemLabel(item),
      name: mdInline(text.name ?? item.internal_name ?? item.id),
      meta: [countryLabel(item.country_id), text.dates, text.location].filter(Boolean),
      badge: item.type ?? '',
      to: itemRoute(item),
    }
  },
}

// ── The sheet spec ─────────────────────────────────────────────────────────
//
// Which fields a record shows, in what order, under which labels — the page
// is viewer-layout's `RecordView`. `value` is a translation field, a record
// field through a function, or a function of the context; `render` is
// `inline` (the default), `block`, `link` or `custom` (handed to a slot named
// after the key). `sections` are the prose blocks under the sheet. A field
// with no value is dropped, so the list may be generous. Labels are the
// shared `sheet.field.*` entries; add a website entry only for a label the
// shared vocabulary does not have.

export const sheet = {
  entity: 'items',
  translations: [],
  fields: [
    { key: 'location', label: 'sheet.field.location', value: (ctx) => [ctx.text.location, countryLabel(ctx.record.country_id)].filter(Boolean).join(', ') },
    { key: 'holder', label: 'sheet.field.holdingMuseum', value: 'holder' },
    { key: 'date', label: 'sheet.field.date', value: 'dates' },
    { key: 'artists', label: 'sheet.field.artists', value: (ctx) => ctx.record.artist_names, join: ', ' },
    { key: 'inventoryNumber', label: 'sheet.field.inventoryNumber', value: (ctx) => ctx.record.owner_reference },
    { key: 'materials', label: 'sheet.field.materials', value: 'type' },
    { key: 'dimensions', label: 'sheet.field.dimensions', value: 'dimensions' },
    { key: 'provenance', label: 'sheet.field.provenance', value: 'provenance' },
  ],
  sections: [
    { key: 'description', label: 'sheet.field.description', value: 'description' },
    { key: 'bibliography', label: 'sheet.field.bibliography', value: 'bibliography' },
  ],
  layout: 'table',
  related: { variant: 'list' },
  back: { label: 'record.action.backToResults', to: { name: 'catalogue' } },
}

function countryLabel(countryId) {
  if (!countryId) return ''
  const country = countryById.value.get(countryId)
  return mdStrip(tr('countries', countryId).name ?? country?.internal_name ?? countryId)
}

// ── Rendering ──────────────────────────────────────────────────────────────
//
// Every field of a record is Markdown, and these three are the only places one
// becomes HTML on this website. They are viewer-core's renderers: raw HTML in
// a record shows on the page as the characters it is, and when it does the fix
// belongs in the importer, not here.

export function md(text, glossary) {
  // A record's line breaks are part of its authored text, so they must
  // survive rendering the same way they do on every other site.
  return renderBlock(text, { breaks: true, glossary })
}

export function mdInline(text, glossary) {
  return renderInline(text, { glossary })
}

export function mdStrip(text) {
  return renderPlain(text)
}
