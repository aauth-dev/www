/**
 * AAuth.dev edge worker.
 *
 * Two jobs:
 *   1. Short-link 302s for /ietf-slack and /slack.
 *   2. Server-side analytics for agent traffic. The client-side Plausible
 *      script never sees these requests — most agents don't run JS — so we
 *      fire events from the edge for anything that looks like an agent
 *      (known UA) or carries AAuth signatures.
 *
 * Site-wide headers (Content-Signal, Link rel=alternate to /llms.txt,
 * Cache-Control on /llms.txt) are applied after the static-asset fetch so
 * they ride on every response — including 404s served by the SPA fallthrough.
 */

const REDIRECTS = {
	'/ietf-slack': 'https://join.slack.com/t/ietf/shared_invite/zt-3wlnl6g9t-UF~rAQwk06nNJUM6QtaaPg',
	'/slack': 'https://join.slack.com/t/aauth/shared_invite/zt-3wsxbrzfk-oYb3xNWVPLZICkXwuJpaDg',
};

const AGENT_UA = [
	['claude', /ClaudeBot|Claude-User|Anthropic-AI|anthropic-ai/i],
	['openai', /GPTBot|ChatGPT-User|OAI-SearchBot/i],
	['perplexity', /PerplexityBot|Perplexity-User/i],
	['google-ai', /Google-Extended|GoogleOther/i],
	['cohere', /cohere-ai/i],
	['bytedance', /Bytespider/i],
	['meta-ai', /Meta-ExternalAgent|FacebookBot/i],
	['link-preview', /Slackbot|Twitterbot|Discordbot|WhatsApp|TelegramBot|LinkedInBot/i],
	['cli', /^(curl|Wget|HTTPie|node-fetch|undici|python-requests|Go-http-client|Java\/|libwww-perl)/i],
];

function classifyAgent(ua) {
	for (const [name, re] of AGENT_UA) if (re.test(ua)) return name;
	return null;
}

const PLAUSIBLE_ENDPOINT = 'https://plausible.io/api/event';
const PLAUSIBLE_DOMAIN = 'aauth.dev';

/**
 * Fire a Plausible custom event from the worker.
 *
 * Note on bot filtering: Plausible drops pageview events from known bot UAs
 * by default. We use a custom event name ('Agent Fetch') and forward the
 * real UA — custom events appear to be retained more reliably, but verify
 * in the dashboard after deploy. If events go missing, set User-Agent to a
 * constant like 'AAuthWorker/1.0' here and rely on props.agent for the
 * classification breakdown.
 */
async function trackPlausible(request, props) {
	return fetch(PLAUSIBLE_ENDPOINT, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'User-Agent': request.headers.get('User-Agent') || '',
			'X-Forwarded-For': request.headers.get('CF-Connecting-IP') || '',
		},
		body: JSON.stringify({
			name: 'Agent Fetch',
			url: request.url,
			domain: PLAUSIBLE_DOMAIN,
			referrer: request.headers.get('Referer') || '',
			props,
		}),
	});
}

/**
 * Wrap an asset response with site-wide headers. Content-Signal advertises
 * AAuth.dev's stance on AI use; the Link header lets agents discover
 * /llms.txt from any HTML response without prior knowledge of the convention.
 */
function withSiteHeaders(response, url) {
	const headers = new Headers(response.headers);
	headers.set('Content-Signal', 'ai-train=yes, search=yes, ai-input=yes');
	headers.append('Link', '</llms.txt>; rel="alternate"; type="text/plain"');

	if (url.pathname === '/llms.txt') {
		headers.set('Content-Type', 'text/plain; charset=utf-8');
		headers.set('Cache-Control', 'public, max-age=3600');
	}

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
}

export default {
	/**
	 * @param {Request} request
	 * @param {{ ASSETS: Fetcher }} env
	 * @param {ExecutionContext} ctx
	 */
	async fetch(request, env, ctx) {
		const url = new URL(request.url);

		const target = REDIRECTS[url.pathname];
		if (target) return Response.redirect(target, 302);

		const ua = request.headers.get('User-Agent') || '';
		const accept = request.headers.get('Accept') || '';
		const agent = classifyAgent(ua);
		const isAAuth = request.headers.has('Signature-Input') || request.headers.has('Signature-Key');

		// Only fire for agent-shaped traffic. Browsers running the
		// client-side Plausible script already get counted there.
		if (agent || accept.includes('text/markdown') || isAAuth) {
			const props = {
				agent: agent || 'other',
				path: url.pathname,
				accept_md: accept.includes('text/markdown') ? 'yes' : 'no',
				aauth: isAAuth ? 'yes' : 'no',
			};
			ctx.waitUntil(trackPlausible(request, props).catch((err) => console.error('plausible', err)));
		}

		const response = await env.ASSETS.fetch(request);
		return withSiteHeaders(response, url);
	},
};
