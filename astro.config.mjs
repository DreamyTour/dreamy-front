// @ts-check

import tailwindcss from '@tailwindcss/vite';
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
// SSG + SSR for API routes
export default defineConfig({
  adapter: cloudflare({
    compatibility: {
      date: '2026-04-22',
    },
  }),

  fonts: [
    {
      name: 'Outfit',
      cssVariable: '--font-outfit',
      provider: fontProviders.fontsource(),
    },
  ],

  server: {
    allowedHosts: true,
  },
  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [
    react(),
    mdx(),
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      filter: (page) => !page.includes('/404'),
    }),
  ],
});
