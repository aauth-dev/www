import walkthrough from '$lib/walkthrough.md?raw';

export const prerender = true;

export function GET() {
	return new Response(walkthrough, {
		headers: {
			'Content-Type': 'text/markdown; charset=utf-8',
			'Cache-Control': 'public, max-age=3600',
		},
	});
}
