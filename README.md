# Exploriter Read-only EXP3 DB at exploriter.com

Public, read-only Astro site for the EXP3 knowledge base.

This app reads taxonomy and entry metadata from the shared Cloudflare D1 database and renders public pages from that data. The local admin app is responsible for writing to the database. This app should stay read-only.

## Stack

- Astro 6
- MDX for authored entry content
- React for interactive islands and app-like entry experiences
- Tailwind CSS
- Cloudflare Workers runtime through `@astrojs/cloudflare`
- Cloudflare D1 binding: `EXP3DB`

## Database

The app is bound to the existing EXP3 D1 database in [wrangler.jsonc](./wrangler.jsonc):

```jsonc
{
   "binding": "EXP3DB",
   "database_name": "exp3",
   "database_id": "8c2ee32b-653f-4f44-9f8f-c5f0808af683",
   "remote": true
}
```

`remote: true` is intentional. Local development reads the real remote D1 database so new entries created in the admin app appear immediately here.

Do not add write SQL to this app. Reads live in [src/lib/exp3.ts](./src/lib/exp3.ts).

## Routing Model

The database owns the public taxonomy:

- `formation_intersections.slug` creates section URLs like `/concepts`.
- `formation_intersections.slug_singular` plus `entries.slug` creates entry URLs like `/concept/beauty`.

Current routes:

- `/` lists all formation-intersection sections from D1.
- `/:slug` lists all entries for one section.
- `/:slugSingular/:entrySlug` renders one entry from D1.

The generic entry route also checks for an optional MDX file in `src/entries`.

## Entry Authoring Levels

There are three supported entry levels.

### 1. Basic Entry

Use this when the entry exists in D1 but has no authored page yet.

Steps:

1. Add the entry in the admin app.
2. Do not add any file in this repo.

Result:

```text
/concept/example
```

The generic route renders:

- title from D1
- description from D1
- coming-soon fallback

### 2. MDX Entry

Use this for normal authored content: prose, headings, images, links, and mostly-static page content.

Steps:

1. Add the entry in the admin app.
2. Add a matching MDX file:

```text
src/entries/concept/example.mdx
```

The convention is:

```text
src/entries/{slugSingular}/{entrySlug}.mdx
```

The generic route renders:

- title from D1
- description from D1
- body from the MDX file

The resolver is [src/lib/entry-content.ts](./src/lib/entry-content.ts).

### 3. Full App-Like Entry

Use this when an entry needs full page control: custom layout, unique D1 queries, charts, simulations, React state, or a mini-app experience.

Steps:

1. Add the entry in the admin app.
2. Add a specific Astro route matching the URL:

```text
src/pages/concept/example.astro
```

3. Query D1 directly from that `.astro` page as needed.
4. Import React/TS components directly into the `.astro` page.
5. Hydrate interactive components with Astro client directives such as `client:load`, `client:idle`, or `client:visible`.

Specific Astro routes take priority over the generic dynamic route. If both files exist:

```text
src/entries/concept/example.mdx
src/pages/concept/example.astro
```

then `/concept/example` uses:

```text
src/pages/concept/example.astro
```

and the MDX resolver is bypassed.

## Route Priority

For an entry URL like `/concept/example`, priority is:

1. `src/pages/concept/example.astro`
2. `src/pages/[slugSingular]/[entrySlug].astro` plus `src/entries/concept/example.mdx`
3. `src/pages/[slugSingular]/[entrySlug].astro` with coming-soon fallback

## Why MDX and Full Routes Are Separate

Astro treats these as different systems:

- `src/pages` owns URL routes.
- `src/entries` is project-specific authored content loaded by our resolver.

MDX is best for authored content. Full `.astro` routes are best for mini-app entries because Astro hydration directives must be placed on framework components imported directly into an `.astro` component.

## SQL and Performance

Queries are intentionally narrow:

- No `SELECT *`.
- No write SQL.
- Route params use bound parameters.
- Home page reads only section summary fields.
- Section pages read one section plus entry summaries.
- Entry pages read one entry plus its parent section.

The important D1 indexes are already present in the database:

- formation intersections by `slug`
- formation intersections by `slug_singular`
- entries by `(formation_intersection_id, slug)`
- entries by `(formation_intersection_id, title)`

## Local Development

Install dependencies:

```sh
pnpm install
```

Generate Cloudflare binding types after changing `wrangler.jsonc`:

```sh
pnpm generate-types
```

Start dev server:

```sh
pnpm dev
```

Useful local URLs:

```text
http://localhost:4321/
http://localhost:4321/concepts
http://localhost:4321/concept/beauty
```

Because `EXP3DB` uses `remote: true`, local dev needs Cloudflare/Wrangler auth and an internet connection.

## Checks

Run Astro diagnostics:

```sh
pnpm astro check
```

Build:

```sh
pnpm build
```

`astro check` is the source of truth for Astro typing. Some IDEs, especially WebStorm, can report false positives for `.astro` frontmatter if Astro language support is not working correctly.

## Deployment

Cloudflare is connected to the GitHub repository. Push changes to deploy through Cloudflare.

This app deploys as Worker:

```text
exp3-prod
```

The database remains:

```text
exp3
```

The app should remain read-only. Database changes should be made through the admin app.

## Files To Know

- [astro.config.mjs](./astro.config.mjs): Astro, MDX, React, Tailwind, and Cloudflare adapter config.
- [wrangler.jsonc](./wrangler.jsonc): Worker name, assets, D1 binding.
- [worker-configuration.d.ts](./worker-configuration.d.ts): generated Cloudflare binding/runtime types.
- [src/lib/exp3.ts](./src/lib/exp3.ts): read-only D1 query layer.
- [src/lib/entry-content.ts](./src/lib/entry-content.ts): optional MDX entry resolver.
- [src/pages/index.astro](./src/pages/index.astro): home page section list.
- [src/pages/[slug].astro](./src/pages/[slug].astro): section entry list.
- [src/pages/[slugSingular]/[entrySlug].astro](./src/pages/[slugSingular]/[entrySlug].astro): generic entry page.
- [src/entries](./src/entries): optional authored MDX entry files.

## Git Ignore Notes

Do not commit local database/editor helper files such as:

```gitignore
*.sqlite
*.sqlite.sql
exp3-webstorm.sqlite
exp3-webstorm.sqlite.sql
```

Do commit:

- `wrangler.jsonc`
- `worker-configuration.d.ts`

Do not commit:

- `.dev.vars`
- `.env`
- `.env.local`
- API tokens
- service token secrets
