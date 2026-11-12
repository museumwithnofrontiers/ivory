import { galleryConfig } from '@museumwnf/viewer-layout/dxa'

// The whole declaration of this website: a DXA gallery, whose pages, shell,
// menu and legacy redirects are the family's (`galleryConfig`,
// @museumwnf/viewer-layout/dxa). What is this gallery's own is below.


// The projects whose item sheets still carry legacy's Explore-partner notice.
export const noticeProjects = [
  '928f5e0d-53e3-5f53-b9c2-5af389c30dd4', // Explore Islamic Art Collections
]

// This website's own chrome files (inventory-app#2233, D7): the logo, the
// banners, the sibling-gallery tiles and the backgrounds, imported from the
// legacy site into theme/assets/. A picture the package names by its legacy
// path is the file at theme/assets/chrome/<that path>; the layout resolves
// each through this map (@museumwnf/viewer-layout, "Site chrome").
const chrome = import.meta.glob('../theme/assets/**/*.{jpg,jpeg,png,gif,svg}', {
  eager: true, query: '?url', import: 'default',
})

export default galleryConfig({
  // The dataset package this website renders. Must match the alias in
  // vite.config.js and the dependency in package.json.
  datasetPackage: '@museumwnf/ivory-data',

  // The name for a package that predates `manifest.site`.
  siteName: 'Ivory',

  // The address this build is deployed at, base path included, read by the
  // source credit: the GitHub Pages address, the same repository segment
  // vite.config.js's `base` puts in the build's base path, so the two change
  // together, and with the domain.
  origin: 'https://museumwithnofrontiers.github.io/ivory',

  noticeProjects,

  // The credits page's body.
  creditsBody: 'ivory.credits.body',

  // This website's own chrome files, above.
  chrome,
})
