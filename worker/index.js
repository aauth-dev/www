/**
 * AAuth.dev Content Negotiation Worker
 *
 * Sits in front of the static site. When a request includes
 * Accept: text/markdown, serves the markdown version from R2.
 * Otherwise falls through to the static HTML assets.
 *
 * R2 bucket structure:
 *   aauth-content/
 *     llms.txt
 *     home.md
 *     guides/getting-started-node.md
 *     guides/getting-started-python.md
 *     ...
 *
 * URL → R2 key mapping:
 *   /           → home.md
 *   /llms.txt   → llms.txt  (always served as-is, no negotiation)
 *   /foo/bar    → foo/bar.md
 */

/** @type {Record<string, string>} */
const PATH_TO_KEY = {
	'/': 'home.md',
};

/**
 * Map a URL path to an R2 object key.
 * @param {string} pathname
 * @returns {string}
 */
function pathToKey(pathname) {
	if (PATH_TO_KEY[pathname]) {
		return PATH_TO_KEY[pathname];
	}
	// Strip leading slash, strip trailing slash, append .md
	const clean = pathname.replace(/^\//, '').replace(/\/$/, '');
	return clean ? `${clean}.md` : 'home.md';
}

/**
 * Does the Accept header indicate the client wants markdown?
 * @param {Request} request
 * @returns {boolean}
 */
function wantsMarkdown(request) {
	const accept = request.headers.get('Accept') || '';
	return accept.includes('text/markdown');
}

export default {
	/**
	 * @param {Request} request
	 * @param {{ ASSETS: Fetcher, CONTENT: R2Bucket }} env
	 * @returns {Promise<Response>}
	 */
	async fetch(request, env) {
		const url = new URL(request.url);

		// llms.txt is always served from static assets (no negotiation);
		// rewrite Content-Type so browsers treat it as UTF-8 and em-dashes render correctly.
		// Force revalidation so previously-cached responses without charset are evicted.
		if (url.pathname === '/llms.txt') {
			const res = await env.ASSETS.fetch(request);
			const headers = new Headers(res.headers);
			headers.set('Content-Type', 'text/plain; charset=utf-8');
			headers.set('Cache-Control', 'no-cache, must-revalidate');
			return new Response(res.body, { status: res.status, headers });
		}

		// Direct access to markdown content (e.g. /home.md) — always returns the R2 copy,
		// no Accept negotiation needed. Makes the markdown URL shareable.
		if (url.pathname.endsWith('.md')) {
			const key = url.pathname.replace(/^\//, '');
			const object = await env.CONTENT.get(key);
			if (object) {
				return new Response(object.body, {
					headers: {
						'Content-Type': 'text/markdown; charset=utf-8',
						'Content-Signal': 'ai-train=yes, search=yes, ai-input=yes',
						'Cache-Control': 'public, max-age=3600',
						'ETag': object.httpEtag,
					},
				});
			}
		}

		// If the client wants markdown, try R2
		if (wantsMarkdown(request)) {
			const key = pathToKey(url.pathname);
			const object = await env.CONTENT.get(key);

			if (object) {
				return new Response(object.body, {
					headers: {
						'Content-Type': 'text/markdown; charset=utf-8',
						'Content-Signal': 'ai-train=yes, search=yes, ai-input=yes',
						'Cache-Control': 'public, max-age=3600',
						'ETag': object.httpEtag,
					},
				});
			}
			// Key not found in R2 — fall through to static assets
		}

		// Default: serve static HTML
		return env.ASSETS.fetch(request);
	},
};
