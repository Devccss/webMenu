// @ts-check
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
  // Configure base path automatically for GitHub Pages unless running locally or custom domain is used
  base: process.env.BASE_PATH || (process.env.GITHUB_REPOSITORY && !process.env.CUSTOM_DOMAIN
    ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}`
    : undefined),

  adapter: netlify(),
});
