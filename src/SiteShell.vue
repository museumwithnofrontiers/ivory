<script setup>
// The page structure is entirely @museumwnf/viewer-layout's SiteShell, which
// composes PageShell from what `dataset.config.js` puts under `navigation`
// and `links`: the menu, the header/footer link lists, the search submit and
// the banner. Nothing here builds a menu or reads `useSection()` — that
// belongs to the shared component, once, and a website that duplicates it
// drifts from the platform the next time SiteShell gains a feature.
//
// The one thing SiteShell cannot know is the header lockup: it is a text, and
// a text is only available inside the application. `#brand` is the slot it
// reserves for exactly that.
import { useI18n } from '@museumwnf/viewer-core'
import { SiteShell } from '@museumwnf/viewer-layout/components'

const { t } = useI18n()
</script>

<template>
  <SiteShell
    v-bind="$attrs"
    header-home="#/"
    :footer-text="t('__SITE_NAMESPACE__.identity.copyright')"
  >
    <template #brand>
      <span class="site-logo">
        <span class="site-logo-org">{{ t('__SITE_NAMESPACE__.identity.organisation') }}</span>
        <span class="site-logo-title">{{ t('__SITE_NAMESPACE__.identity.title') }}</span>
      </span>
    </template>
    <slot />
  </SiteShell>
</template>

<style scoped>
/* The lockup only. Colours and fonts come from theme/tokens.css, which is
   where this website's identity is set. */
.site-logo {
  display: flex;
  flex-direction: column;
  gap: 1px;
  color: var(--mwnf-header-text);
}
.site-logo-org {
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  opacity: 0.8;
}
.site-logo-title {
  font-size: 28px;
  font-weight: 400;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}
</style>
