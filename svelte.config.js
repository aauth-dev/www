import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: '404.html',
			precompress: false,
			strict: true
		}),
		prerender: {
			handleHttpError: ({ path, message }) => {
				// /home.md and other .md paths are served by the Cloudflare Worker from R2 at runtime,
				// not prerendered by SvelteKit. Ignore 404s for these during prerender.
				if (path.endsWith('.md')) return;
				throw new Error(message);
			}
		}
	}
};

export default config;
