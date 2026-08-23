// @ts-check
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
  // Configure base path automatically for GitHub Pages unless running locally or custom domain is used
  adapter: netlify({
    middlewareMode: 'edge',
  }),
});
