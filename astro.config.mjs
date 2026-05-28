// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import cloudflare from "@astrojs/cloudflare";

import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  integrations: [mdx(), react()],
  adapter: cloudflare(),

  vite: {
    plugins: [tailwindcss()],
  },
});