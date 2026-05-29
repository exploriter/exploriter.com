// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import cloudflare from "@astrojs/cloudflare";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
   output: "server",
   integrations: [mdx(), react()],
   adapter: cloudflare(),
   vite: {
      plugins: [tailwindcss()],
   },
   fonts: [
      {
         name: "IBM Plex Mono",
         provider: fontProviders.fontsource(),
         cssVariable: "--font-ibm-plex-mono",
         weights: [100, 200, 300, 400, 500, 600, 700],
         fallbacks: ["monospace"],
      },
      {
         name: "IBM Plex Sans",
         provider: fontProviders.fontsource(),
         cssVariable: "--font-ibm-plex-sans",
         weights: ["100 700"],
      },
      {
         name: "IBM Plex Serif",
         provider: fontProviders.fontsource(),
         cssVariable: "--font-ibm-plex-serif",
         weights: [300, 400, 500, 600],
         fallbacks: ["serif"],
      },
   ],
});
