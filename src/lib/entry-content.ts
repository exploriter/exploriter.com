import type { MDXContent } from "astro";

type EntryContentModule = {
   default: MDXContent;
};

const entryContentModules = import.meta.glob<EntryContentModule>("/src/entries/**/*.mdx");

export const loadEntryContent = async (slugSingular: string, entrySlug: string): Promise<MDXContent | null> => {
   const path = `/src/entries/${slugSingular}/${entrySlug}.mdx`;
   const load = entryContentModules[path];

   if (!load) return null;

   const module = await load();
   return module.default;
};
