# www.aauth.dev — Claude project notes

## Deployment

**Do not run `wrangler deploy` manually.** Cloudflare Workers Builds is
connected to this repo and auto-deploys on every push to `main`.

To ship a change:

1. Commit locally.
2. `git push origin main`.
3. Verify (usually live within a minute):
   ```bash
   curl -sI https://www.aauth.dev/
   ```

## Architecture quick ref

- SvelteKit site with `@sveltejs/adapter-static`, output to `build/`.
- Cloudflare Worker (`worker/index.js`) serves the static assets via the
  `ASSETS` binding and adds site-wide headers (`Content-Signal`,
  `Link: </llms.txt>; rel=alternate`).
- `wrangler.toml` sets `not_found_handling = "single-page-application"`,
  so any unmatched path falls through to the SPA shell. Real files in
  `static/` (which become `build/`) take precedence.

## Agent discoverability — keep in sync

This site is agent-first. Three files in `static/` work together; when
you add or rename a route, update all three:

- `static/robots.txt` — must contain a `Sitemap:` line pointing at
  `https://www.aauth.dev/sitemap.xml`.
- `static/sitemap.xml` — hand-maintained list of first-party URLs
  (`/`, `/walkthrough.md`, `/llms.txt`, plus anything new). If this
  grows past ~10 URLs, switch to a generated sitemap (a
  `+server.js` route with `export const prerender = true`).
- `static/llms.txt` — machine-readable site index. Add new pages
  here so LLM agents can find them.

A request for `/sitemap.xml` that misses returns the SPA HTML shell
(because of `single-page-application` fallback), which silently breaks
crawlers — verify with `curl -i https://www.aauth.dev/sitemap.xml`
after any change touching `static/` or the worker.

## Local development

- `npm run dev` — Vite dev server.
- `npm run build` — produces `build/`. Run this before pushing if you've
  changed anything that affects routing or static assets.
- `npm run preview` — preview the production build locally.
