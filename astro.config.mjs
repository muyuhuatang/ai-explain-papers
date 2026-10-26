import { defineConfig } from 'astro/config';
import site from './site.config.mjs';

// SITE_URL and BASE_PATH are provided by the GitHub Actions workflow from the
// repository's GitHub Pages settings (actions/configure-pages).
export default defineConfig({
  site: process.env.SITE_URL || site.localSiteUrl,
  base: process.env.BASE_PATH || '/',
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
  devToolbar: {
    enabled: false,
  },
  markdown: {
    // Code in articles follows the reader's light or dark mode (see global.css).
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
    },
  },
});
