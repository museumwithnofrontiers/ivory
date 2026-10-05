import { describeGallerySmoke } from '@museumwnf/viewer-layout/dxa/testing'
import { catalogues as sharedTexts } from '@museumwnf/viewer-i18n/gallery'
import manifest from '@inventory-data/manifest.json'
import ownTexts from '../locales/en.json'
import config from '../src/dataset.config.js'

// The gallery family's smoke test, run against this gallery's own dataset.
// The picks are records of that dataset the tests look for; each is described
// in the suite's own documentation (@museumwnf/viewer-layout/dxa/testing).
describeGallerySmoke({
  config,
  sharedTexts,
  ownTexts,
  manifest,
  namespace: 'ivory',
  picks: {
    collection: {
      tiles: 9,
      paginations: 2,
    },
    about: 'This Gallery is dedicated to',
    credits: 'LOCAL PROJECT TEAMS',
    chip: {
      item: 'da8131c4-37b0-5710-a8a7-07aeac9637d5',
      project: 'Discover Baroque Art',
      className: 'mwnf-chip--DBA',
    },
    noticeItem: '521d6cfc-68ec-53af-a60c-48b720b5bbf7',
    dynasty: null,
    timeline: {
      code: 'gr',
      id: 'grc',
      country: 'Greece',
      rows: 11,
      event: 'Filiki Etaireia',
      gallery: 2,
      galleryTiles: 2,
      galleryItem: 'Decorative ivory plaque',
    },
    partner: {
      id: '559ab197-7289-5af4-a295-1118bde9afce',
      name: 'Museum of Islamic Art at the Pergamon Museum, State Museums',
      city: 'Berlin',
      country: 'Germany',
      objects: 6,
    },
  },
})
