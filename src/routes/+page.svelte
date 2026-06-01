<script>
	import Nav from '$lib/components/Nav.svelte';
	import InView from '$lib/components/InView.svelte';
	import JointSequence, { computeHeight } from '$lib/components/JointSequence.svelte';

	const participantsList = ['Agent', 'Resource', 'Person Server', 'Access Server'];
	import DecryptText from '$lib/components/DecryptText.svelte';

	let bgVideo;
	let bgFading = $state(false);
	const FADE_MS = 600;

	$effect(() => {
		if (!bgVideo) return;
		const video = bgVideo;

		const onTimeUpdate = () => {
			if (!video.duration || !isFinite(video.duration)) return;
			const remaining = video.duration - video.currentTime;
			bgFading = remaining < FADE_MS / 1000;
		};

		video.addEventListener('timeupdate', onTimeUpdate);
		return () => {
			video.removeEventListener('timeupdate', onTimeUpdate);
		};
	});

	let playgroundTrigger = $state(0);
	let getStartedTrigger = $state(0);
	let issueTrigger = $state(0);
	let prTrigger = $state(0);

	let layersVisible = $state(false);
	let layersEl;

	$effect(() => {
		if (!layersEl) return;
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					layersVisible = true;
					observer.unobserve(layersEl);
				}
			},
			{ threshold: 0.2 }
		);
		observer.observe(layersEl);
		return () => observer.disconnect();
	});

	const features = [
		{
			title: "Client IDs Don't Travel",
			desc: 'In OAuth and OIDC, a client has no independent identity — a client_id at Google is meaningless at GitHub. Agents have no identity of their own to carry between services.',
			color: 'var(--color-agent)'
		},
		{
			title: 'Copied Secrets Leak',
			desc: "API keys are a shared secret issued by the service and copied to the client. Any secret copied to a workload will eventually leak somewhere it shouldn’t.",
			color: 'var(--color-resource)'
		},
		{
			title: 'Decisions Happen Mid-Task',
			desc: "Agents need authorization decisions mid-task. Consent lands on human timelines — and today's protocols treat pending as an error, not a first-class state.",
			color: 'var(--color-ps)'
		},
		{
			title: 'Tool Chains Assemble Live',
			desc: "Agents pick their tool chain at runtime, one call at a time. The sequence isn't declared in code — they choose the next tool as the task unfolds, and the chain shifts with every task.",
			color: 'var(--color-as)'
		},
		{
			title: "Scopes Don't Capture Intent",
			desc: "A scope is standing permission, not per-call intent. `mail.read` looks the same whether the agent is summarizing or scraping — policy can't tell them apart.",
			color: 'var(--color-ps)'
		},
		{
			title: 'Calls Cross Trust Domains',
			desc: "A single task can span orgs, clouds, and identity domains. Workload identity (SPIFFE) stops at the trust-domain edge — and authority stops there too.",
			color: 'var(--color-agent)'
		}
	];

	const cliPrompt = `AAuth is an HTTP authorization protocol that lets agents call protected resources on your behalf using signed requests instead of bearer tokens. This prompt walks an agent through AAuth end-to-end — generate a signing keypair, publish the public key so resources can verify your signatures, then make a real signed call — and has the agent explain each step as it happens.

First, check whether a signing keypair has already been generated on this machine: npx @aauth/bootstrap list. If nothing's set up, follow npx @aauth/bootstrap skill setup step-by-step — it'll generate a keypair, ask where to publish the public key (a JWKS file hosted at a URL the resource can fetch — GitHub Pages, GitLab Pages, Cloudflare Pages, etc.), and verify it's reachable before continuing. Then call https://whoami.aauth.dev?scope=openid+profile with npx @aauth/fetch -v — whoami echoes back the identity claims the resource sees about you, and -v prints each protocol event (token exchange, signature construction, response) so the wire-level behavior is visible.

Narrate the entire run as a single flat bulleted list — each bullet is one sentence in present-progressive form with a short "so that …" clause and the artifact's JSON in a fenced code block. For the fetch portion, use each -v event's description field verbatim and include its raw JSON payload as emitted by fetch — do not decode JWTs or substitute claims for token strings; if consent is already on file (no 202 from token-exchange), say so and explain why no browser opened. End with the resource's response body.

For any protocol detail, fetch the AAuth spec URL printed at the bottom of npx @aauth/bootstrap skill rather than inferring from CLI output.`;

	const demos = [
		{
			name: 'Have your agent walk you through AAuth',
			iconPath: 'M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z',
			desc: 'Paste this prompt into Claude Code, Cursor, or any CLI agent. The agent bootstraps itself, calls whoami.aauth.dev, and narrates each protocol event as it runs.',
			prompt: cliPrompt,
			source: null
		},
		{
			name: 'Web Agent Demo: whoami',
			logo: '/demos/whoami.png',
			desc: "A minimal AAuth identity resource — one endpoint that returns who the caller is.",
			primary: 'https://playground.aauth.dev',
			primaryLabel: 'Try it',
			source: 'https://github.com/aauth-dev/whoami'
		},
		{
			name: 'Web Agent Demo: notes',
			logo: '/demos/notes.png',
			desc: "A notes API using <a href=\"https://github.com/dickhardt/AAuth/blob/main/draft-hardt-aauth-r3.md\" target=\"_blank\" rel=\"noopener\" class=\"text-[var(--color-text)] hover:underline\">AAuth R3 ↗</a>. Agents declare OpenAPI operations; consent is over actions, not endpoints.",
			primary: 'https://playground.aauth.dev',
			primaryLabel: 'Try it',
			source: 'https://github.com/aauth-dev/notes'
		},
		{
			name: 'Protocol Explorer',
			iconPath: 'm21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z',
			desc: 'Browse AAuth access modes, tokens, and headers with side-by-side wire examples.',
			primary: 'https://explorer.aauth.dev',
			primaryLabel: 'Open Explorer',
			source: null
		}
	];

	let demoTriggers = $state([0, 0, 0, 0]);
	let copiedIdx = $state(-1);

	async function copyPrompt(text, idx) {
		try {
			await navigator.clipboard.writeText(text);
			copiedIdx = idx;
			setTimeout(() => { if (copiedIdx === idx) copiedIdx = -1; }, 1800);
		} catch {}
	}

	let lumaTheme = $state('dark');
	$effect(() => {
		if (typeof window === 'undefined') return;
		const mql = window.matchMedia('(prefers-color-scheme: light)');
		const update = () => (lumaTheme = mql.matches ? 'light' : 'dark');
		update();
		mql.addEventListener('change', update);
		return () => mql.removeEventListener('change', update);
	});

	const modes = [
		{
			name: 'Identity Based',
			parties: 'Agent + Resource',
			desc: 'Resource authorizes off the agent identifier alone — no authorization flow, no tokens beyond the agent token.',
			steps: [
				{ from: 'Agent', to: 'Resource', lines: ['HTTPSig w/ agent_token'] },
				{ from: 'Resource', to: 'Agent', lines: ['200 OK'], dashed: true }
			]
		},
		{
			name: 'Resource Managed',
			parties: 'Agent + Resource',
			desc: 'Resource handles authorization itself — via user interaction, consent, or an existing OAuth / OIDC provider.',
			steps: [
				{ from: 'Agent', to: 'Resource', lines: ['HTTPSig w/ agent_token'] },
				{ from: 'Resource', to: 'Agent', lines: ['202 (interaction required)'], dashed: true },
				{ note: 'user completes interaction' },
				{ from: 'Agent', to: 'Resource', lines: ['GET pending URL'] },
				{ from: 'Resource', to: 'Agent', lines: ['200 OK', 'AAuth-Access: opaque-token'], dashed: true },
				{ from: 'Agent', to: 'Resource', lines: ['HTTPSig w/ agent_token', 'Authorization: AAuth opaque-token'] },
				{ from: 'Resource', to: 'Agent', lines: ['200 OK'], dashed: true }
			]
		},
		{
			name: 'Person Server Managed',
			parties: 'Agent + Resource + Person Server',
			desc: "Person Server handles authorization for the user — issuing the auth token after consent.",
			steps: [
				{ from: 'Agent', to: 'Resource', lines: ['HTTPSig w/ agent_token', 'POST /authorize'] },
				{ from: 'Resource', to: 'Agent', lines: ['resource_token', '(aud = Person Server URL)'], dashed: true },
				{ from: 'Agent', to: 'Person Server', lines: ['HTTPSig w/ agent_token', 'POST /token w/ resource_token'] },
				{ from: 'Person Server', to: 'Agent', lines: ['auth_token'], dashed: true },
				{ from: 'Agent', to: 'Resource', lines: ['HTTPSig w/ auth token', 'GET /api/documents'] },
				{ from: 'Resource', to: 'Agent', lines: ['200 OK'], dashed: true }
			]
		},
		{
			name: 'Federated',
			parties: 'Agent + Resource + Person Server + Access Server',
			desc: "Access Server handles authorization for the resource — federating with the agent's Person Server across trust domains.",
			steps: [
				{ from: 'Agent', to: 'Resource', lines: ['HTTPSig w/ agent_token', 'POST /authorize'] },
				{ from: 'Resource', to: 'Agent', lines: ['resource_token', '(aud = Access Server URL)'], dashed: true },
				{ from: 'Agent', to: 'Person Server', lines: ['HTTPSig w/ agent_token', 'POST /token w/ resource_token'] },
				{ from: 'Person Server', to: 'Access Server', lines: ['HTTPSig w/ jwks_uri', 'POST /token w/ resource_token'] },
				{ from: 'Access Server', to: 'Person Server', lines: ['auth_token'], dashed: true },
				{ from: 'Person Server', to: 'Agent', lines: ['auth_token'], dashed: true },
				{ from: 'Agent', to: 'Resource', lines: ['HTTPSig w/ auth token', 'GET /api/documents'] },
				{ from: 'Resource', to: 'Agent', lines: ['200 OK'], dashed: true }
			]
		}
	];

	let activeMode = $state(0);
	const maxDiagramHeight = Math.max(...modes.map((m) => computeHeight(m.steps)));

	const specs = [
		{
			name: 'AAuth Protocol',
			status: 'Internet-Draft',
			href: 'https://datatracker.ietf.org/doc/draft-hardt-aauth-protocol',
			editorsCopy: 'https://dickhardt.github.io/AAuth/draft-hardt-aauth-protocol.html',
			desc: 'The authorization protocol for agent-to-resource access. Four access modes, three token types, agent governance, missions, clarification chat, and call chaining.',
			primary: true,
			indent: false
		},
		{
			name: 'HTTP Signature Keys',
			status: 'Internet-Draft',
			href: 'https://datatracker.ietf.org/doc/draft-hardt-httpbis-signature-key/',
			editorsCopy: 'https://dickhardt.github.io/signature-key/draft-hardt-httpbis-signature-key.html',
			desc: 'Foundation layer. Well-known key discovery, the Signature-Key header for conveying public keying material alongside HTTP Message Signatures.',
			primary: false,
			indent: true
		},
		{
			name: 'R3 — Rich Resource Requests',
			status: 'Exploratory',
			href: 'https://dickhardt.github.io/AAuth/draft-hardt-aauth-r3.html',
			editorsCopy: null,
			desc: 'Vocabulary-based authorization using formats agents already understand (MCP, OpenAPI, gRPC, GraphQL).',
			primary: false,
			indent: true
		}
	];

	const platforms = [
		{
			name: 'Specifications',
			iconPath: 'M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z',
			desc: 'The Internet-Drafts defining the AAuth protocol and signatures.',
			href: 'https://github.com/dickhardt/AAuth',
			available: true
		},
		{
			name: 'Node.js SDK',
			icon: 'nodedotjs',
			desc: 'Reference SDK for agents and MCP servers with signed-request auth.',
			href: 'https://github.com/aauth-dev/packages-js',
			available: true
		},
		{
			name: '.NET SDK',
			icon: 'dotnet',
			desc: 'Reference SDK and samples for .NET agents and MCP servers with signed-request auth.',
			href: 'https://github.com/aauth-dev/dotnet-samples',
			available: true
		},
		{
			name: 'Python Demo Source',
			icon: 'python',
			desc: 'End-to-end A2A multi-agent flow with Keycloak and user consent.',
			href: 'https://github.com/christian-posta/aauth-full-demo',
			available: true
		}
	];

	const slacks = [
		{
			name: 'IETF Slack',
			desc: 'IETF #aauth channel for AAuth specification discussion and feedback.',
			href: 'https://www.aauth.dev/ietf-slack',
			logo: '/ietf.jpg',
			event: 'IETF+Slack+Click'
		},
		{
			name: 'AAuth Slack',
			desc: 'AAuth community Slack for implementation discussion and questions.',
			href: 'https://www.aauth.dev/slack',
			logo: '/aauth.png',
			event: 'AAuth+Slack+Click'
		}
	];

	const deepDives = [
		{
			title: 'Know Which of Your Agents Wrote What',
			author: 'Mark Hendrickson',
			desc: 'Per-row attribution for agent writes via AAuth identity in Neotoma',
			href: 'https://markmhendrickson.com/posts/know-which-of-your-agents-wrote-what/',
			date: '2026-04-28'
		},
		{
			title: 'AAuth Now Has a Mission Layer',
			author: 'Karl McGuinness',
			desc: 'Mission is now a first-class protocol object — is the layer strong enough?',
			href: 'https://www.linkedin.com/pulse/aauth-now-has-mission-layer-karl-mcguinness-uhqjc/',
			date: '2026-04-15'
		},
		{
			title: 'Exploring AAuth for Agent Identity and Access Management',
			author: 'Christian Posta',
			desc: 'Overview of an open-source AAuth demo with identity-based and three-party access modes',
			href: 'https://blog.christianposta.com/aauth-full-demo/',
			date: '2026-05-14'
		},
		{
			title: 'Open-World OAuth Still Needs Mission Shaping',
			author: 'Karl McGuinness',
			desc: 'Open-world OAuth, discovery, and bounded authority across delegation chains',
			href: 'https://notes.karlmcguinness.com/notes/open-world-oauth-still-needs-mission-shaping/',
			date: '2026-03-21'
		},
		{
			title: 'Mission Architecture on AAuth',
			author: 'Karl McGuinness',
			desc: 'Whether AAuth is the right protocol foundation for mission-bound authorization',
			href: 'https://notes.karlmcguinness.com/notes/mission-architecture-on-aauth/',
			date: '2026-03-15'
		},
		{
			title: 'Deep Dive AAuth — Identity and Access Management for AI Agents',
			author: 'Christian Posta',
			desc: 'Comprehensive overview of AAuth architecture and design',
			href: 'https://blog.christianposta.com/exploring-aauth-agent-auth-identity-and-access-management-for-ai-agents/',
			date: '2026-02-17'
		},
		{
			title: 'Do AI Agents Need Their Own Identity?',
			author: 'Christian Posta',
			desc: 'The case for independent agent identity',
			href: 'https://blog.christianposta.com/do-we-even-need-agent-identity/',
			date: '2025-06-02'
		}
	].sort((a, b) => b.date.localeCompare(a.date));

	const authorAvatars = {
		'Christian Posta': '/authors/christian-posta.jpg',
		'Karl McGuinness': '/authors/karl-mcguinness.png',
		'Mark Hendrickson': '/authors/mark-hendrickson.jpg'
	};
</script>

<Nav />

<!-- Hero (fixed behind content — content below scrolls over it). pointer-events: only interactive inner column receives clicks so nav stays usable. h-[100lvh] keeps the hero anchored to the large viewport so content doesn't shift when the mobile URL bar collapses. -->
<section
	class="fixed top-0 left-0 w-screen h-[100lvh] flex items-center justify-center px-6 pt-16 overflow-hidden z-0 pointer-events-none"
>
	<div class="hero-burst absolute inset-0 opacity-25 pointer-events-none [filter:saturate(0.5)]">
		<video
			bind:this={bgVideo}
			src="/bg.mp4"
			autoplay
			muted
			loop
			playsinline
			preload="auto"
			class="w-full h-full object-cover transition-opacity ease-in-out"
			style="transition-duration: {FADE_MS}ms; opacity: {bgFading ? 0 : 1};"
		></video>
	</div>

	<div class="relative z-10 max-w-5xl mx-auto text-center pointer-events-auto">
		<h1 class="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1] uppercase">
			Software Is <span class="text-[var(--color-accent)]">Changing</span>
		</h1>
		<p class="text-[24.5px] font-semibold text-[var(--color-text)] max-w-5xl mx-auto mb-8 leading-tight tracking-tight">
			Clients used to be written. Now agents assemble them <span class="text-[var(--color-accent)]">at runtime</span>.
		</p>
		<p class="text-xl md:text-2xl text-[var(--color-text-muted)] max-w-4xl mx-auto mb-12 leading-relaxed">
			The protocols underneath weren't built for that.
		</p>
	

		<div class="flex justify-center gap-4 flex-wrap mb-16">
			<a
				href="https://playground.aauth.dev"
				onmouseenter={() => playgroundTrigger++}
				class="font-display inline-flex items-center justify-center gap-2 px-7 py-3.5 w-full sm:w-auto rounded-lg bg-[var(--color-accent)] text-black font-medium no-underline"
			>
				<span class="font-mono text-sm">&gt;</span>
				<DecryptText text="Try the demo" trigger={playgroundTrigger} />
			</a>
			<a
				href="https://explorer.aauth.dev"
				onmouseenter={() => getStartedTrigger++}
				class="font-display inline-flex items-center justify-center gap-2 px-7 py-3.5 w-full sm:w-auto rounded-lg border border-[var(--color-accent)] text-[var(--color-accent)] font-medium no-underline"
			>
				<DecryptText text="Protocol Explorer" trigger={getStartedTrigger} />
			</a>
		</div>

		<!-- Scroll hint -->
		<div class="animate-bounce text-[var(--color-text-dim)]">
			<svg class="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
			</svg>
		</div>
	</div>
</section>

<!-- Spacer reserves viewport height for the fixed hero -->
<div class="h-[100lvh]" aria-hidden="true"></div>

<!-- Scrolling content covers the fixed hero background -->
<div class="relative z-10 bg-[var(--color-bg)] border-t border-[var(--color-accent)]/25 shadow-[0_-8px_32px_-12px_color-mix(in_srgb,var(--color-accent)_18%,transparent)]">

<!-- What Changed -->
<section id="what-changed" class="py-[1.82rem] md:py-[3.12rem]">
	<div class="max-w-7xl mx-auto px-5 md:px-8">
		<InView>
			<h2 class="text-3xl md:text-4xl font-bold text-center mb-4 uppercase">What Changed</h2>
			<p class="text-center text-[var(--color-text-muted)] mb-16 text-lg">
				Software used to know at build time what it would call and what it would need.<br class="hidden sm:inline" />
				Now agents decide in the moment, against services they've never seen — the old protocols assumed neither.
			</p>
		</InView>

		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
			{#each features as feature, i}
				<InView class="delay-{i} h-full">
					<div
						class="h-full p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)]"
					>
						<h3 class="text-lg font-semibold mb-2 font-mono"><span class="text-[var(--color-accent)]">&gt;</span> {feature.title}</h3>
						<p class="text-sm text-[var(--color-text-muted)] leading-relaxed">{feature.desc}</p>
					</div>
				</InView>
			{/each}
		</div>
	</div>
</section>

<!-- Why AAuth? -->
<section id="why-aauth" class="scroll-mt-24 py-[1.82rem] md:py-[3.12rem]">
	<div class="max-w-7xl mx-auto px-5 md:px-8">
		<InView>
			<h2 class="text-3xl md:text-4xl font-bold mb-4 uppercase">Why AAuth?</h2>
			<p class="text-base text-[var(--color-text-muted)] italic mb-8">
				By <a href="https://www.linkedin.com/in/dickhardt" target="_blank" rel="noopener" class="text-[var(--color-text)] hover:text-[var(--color-accent)] transition-colors">Dick Hardt</a>, author of OAuth 2.0
			</p>
			<div class="text-[var(--color-text-muted)] text-lg leading-relaxed space-y-5">
				<p>
					After implementing authorization for our MCP server, I concluded <a href="https://www.linkedin.com/feed/update/urn:li:activity:7358178115673616384/" target="_blank" rel="noopener" class="text-[var(--color-text)] font-medium hover:underline">OAuth is not a good fit for MCP ↗</a> and started working with others in the identity community who'd hit the same walls.
				</p>
				<p>
					AAuth is what came out of that work. It gives every HTTP client its own cryptographic identity and carries <span class="text-[var(--color-text)]">identity claims and authorization claims in the same token</span>. It coexists with OAuth 2.0 and OpenID Connect rather than replacing them.
				</p>
				<p>
					The web gave servers identity. It's time clients got the same.
				</p>
			</div>
		</InView>
	</div>
</section>

<!-- Compare -->
{#if false}
<section class="py-[1.82rem] md:py-[3.12rem]">
	<div class="max-w-5xl mx-auto px-5 md:px-8">
		<InView>
			<h2 class="text-3xl md:text-4xl font-bold text-center mb-4 uppercase">Why Not OAuth or API Keys?</h2>
			<p class="text-center text-[var(--color-text-muted)] max-w-4xl mx-auto mb-12 text-lg">
				The two credential models agents inherit today were designed for a different shape of client.
			</p>
		</InView>

		<InView>
			<!-- Mobile: stacked cards per attribute -->
			<div class="md:hidden space-y-3">
				{#each [
					{ attr: 'Registration', api: 'Per service', oauth: 'Per authorization server', aauth: 'None — self-published' },
					{ attr: 'Credential', api: 'Shared secret', oauth: 'Client auth + bearer token', aauth: "Agent's signing key" },
					{ attr: 'Presentation', api: 'Bearer', oauth: 'Bearer (DPoP optional)', aauth: 'HTTP Message Signature' },
					{ attr: 'Verification', api: 'Pre-shared per service', oauth: 'Via the AS', aauth: 'Any party via JWKS' },
					{ attr: 'User delegation', api: 'None', oauth: 'Through the AS', aauth: 'Per-request via PS / AS' }
				] as row}
					<div class="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
						<h3 class="text-xs uppercase tracking-wider text-[var(--color-text-dim)] font-medium mb-3">{row.attr}</h3>
						<dl class="space-y-2 text-sm">
							<div class="flex gap-3">
								<dt class="w-32 shrink-0 text-[var(--color-text-muted)]">API Keys</dt>
								<dd>{row.api}</dd>
							</div>
							<div class="flex gap-3">
								<dt class="w-32 shrink-0 text-[var(--color-text-muted)]">OAuth / OIDC</dt>
								<dd>{row.oauth}</dd>
							</div>
							<div class="flex gap-3">
								<dt class="w-32 shrink-0 text-[var(--color-accent)] font-semibold">AAuth</dt>
								<dd>{row.aauth}</dd>
							</div>
						</dl>
					</div>
				{/each}
			</div>

			<!-- Desktop: full table -->
			<div class="hidden md:block overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)]">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-[var(--color-border)]">
							<th class="text-left p-4 text-[var(--color-text-dim)] font-medium uppercase tracking-wider text-xs"></th>
							<th class="text-left p-4 font-semibold">API Keys</th>
							<th class="text-left p-4 font-semibold">OAuth 2.0 / OIDC</th>
							<th class="text-left p-4 font-semibold text-[var(--color-accent)]">AAuth</th>
						</tr>
					</thead>
					<tbody>
						<tr class="border-b border-[var(--color-border)]">
							<td class="p-4 text-[var(--color-text-dim)] font-medium">Registration</td>
							<td class="p-4">Per service</td>
							<td class="p-4">Per authorization server</td>
							<td class="p-4 text-[var(--color-text)]">None — self-published</td>
						</tr>
						<tr class="border-b border-[var(--color-border)]">
							<td class="p-4 text-[var(--color-text-dim)] font-medium">Credential</td>
							<td class="p-4">Shared secret</td>
							<td class="p-4">Client auth + bearer token</td>
							<td class="p-4 text-[var(--color-text)]">Agent's signing key</td>
						</tr>
						<tr class="border-b border-[var(--color-border)]">
							<td class="p-4 text-[var(--color-text-dim)] font-medium">Presentation</td>
							<td class="p-4">Bearer</td>
							<td class="p-4">Bearer (DPoP optional)</td>
							<td class="p-4 text-[var(--color-text)]">HTTP Message Signature</td>
						</tr>
						<tr class="border-b border-[var(--color-border)]">
							<td class="p-4 text-[var(--color-text-dim)] font-medium">Verification</td>
							<td class="p-4">Pre-shared per service</td>
							<td class="p-4">Via the AS</td>
							<td class="p-4 text-[var(--color-text)]">Any party via JWKS</td>
						</tr>
						<tr>
							<td class="p-4 text-[var(--color-text-dim)] font-medium">User delegation</td>
							<td class="p-4">None</td>
							<td class="p-4">Through the AS</td>
							<td class="p-4 text-[var(--color-text)]">Per-request via PS / AS</td>
						</tr>
					</tbody>
				</table>
			</div>
			<p class="text-xs text-left md:text-center text-[var(--color-text-dim)] mt-4 font-mono">
				<span class="text-[var(--color-text-muted)]">PS</span> Person Server &middot; <span class="text-[var(--color-text-muted)]">AS</span> Access Server
			</p>
		</InView>
	</div>
</section>
{/if}

<!-- How AAuth Works -->
<section id="how-it-works" class="scroll-mt-24 py-[1.82rem] md:py-[3.12rem]">
	<div class="max-w-7xl mx-auto px-5 md:px-8">
		<InView>
			<h2 class="text-3xl md:text-4xl font-bold mb-4 uppercase">How AAuth Works</h2>
			<p class="text-[var(--color-text-muted)] mb-4 text-lg">
				AAuth has four access modes. All replace API keys with cryptographic identity.<br class="hidden sm:inline" />
				Capability grows from simplest to most capable — adopt incrementally as your needs expand.
			</p>
		</InView>

		<InView>
			<div class="flex justify-start gap-2 flex-wrap mt-10 mb-4">
				{#each modes as mode, i}
					<button
						onclick={() => (activeMode = i)}
						class="px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer border
							{activeMode === i
							? 'bg-[var(--color-accent)] text-black border-transparent'
							: 'bg-[var(--color-bg-card)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:border-[var(--color-border-hover)]'}"
					>
						{mode.name}
					</button>
				{/each}
			</div>


			<div>
				<div class="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] overflow-hidden">
					<div class="p-6">
						<p class="text-[var(--color-text-muted)] mb-6">{modes[activeMode].desc}</p>
						<!-- Mobile / tablet: vertical step-list -->
						<div class="lg:hidden bg-[var(--color-bg-code)] rounded-lg p-5">
							<ol class="space-y-3">
								{#each modes[activeMode].steps as step, i}
									{#if step.note}
										<li class="text-xs text-center text-[var(--color-text-dim)] italic py-2 border-y border-[var(--color-border)] font-mono">
											{step.note}
										</li>
									{:else}
										<li class="flex gap-3">
											<span class="text-xs font-mono text-[var(--color-text-dim)] mt-0.5 w-5 shrink-0 text-right">{i + 1}</span>
											<div class="flex-1 min-w-0">
												<div class="font-mono text-xs text-[var(--color-text-muted)] mb-1">
													<span>{step.from}</span>
													<span class="text-[var(--color-accent)] mx-1">{step.dashed ? '⇠' : '→'}</span>
													<span>{step.to}</span>
												</div>
												{#each step.lines as line}
													<div class="font-mono text-xs text-[var(--color-text)] break-words leading-relaxed">{line}</div>
												{/each}
											</div>
										</li>
									{/if}
								{/each}
							</ol>
						</div>

						<!-- Desktop: JointJS sequence diagram -->
						<div class="hidden lg:block bg-[var(--color-bg-code)] rounded-lg p-5 min-h-[470px] overflow-x-auto lg:overflow-hidden">
							{#each modes as mode, i}
								<div class="w-full {i === activeMode ? '' : 'hidden'}">
									<JointSequence participants={participantsList} steps={mode.steps} minHeight={maxDiagramHeight} />
								</div>
							{/each}
						</div>

						<!-- Raw HTTP wire example for Resource Managed (commented out for now)
						{#if modes[activeMode].name === 'Resource Managed'}
							<p class="text-xs text-[var(--color-text-dim)] font-mono mt-6 mb-2">as raw HTTP:</p>
							<div class="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-code)] p-5 font-mono text-sm leading-loose overflow-x-auto">
								... wire example markup ...
							</div>
						{/if}
						-->

					</div>
				</div>
			</div>
			<div class="mt-4 flex justify-start">
				<ul class="text-xs text-left text-[var(--color-text-dim)] space-y-1 font-mono list-none">
					<li><span class="text-[var(--color-text-muted)]">agent_token</span> establishes the agent's identity</li>
					<li><span class="text-[var(--color-text-muted)]">resource_token</span> describes the access needed</li>
					<li><span class="text-[var(--color-text-muted)]">auth_token</span> grants an agent access to a resource</li>
					<li><span class="text-[var(--color-text-muted)]">jwks_uri</span> Person Server's JWKS endpoint, discovered via well-known metadata</li>
				</ul>
			</div>
		</InView>
	</div>
</section>

<!-- The 202 Pattern (commented out — redundant with Resource Managed diagram)
<section class="py-[1.82rem] md:py-[3.12rem]">
	<div class="max-w-4xl mx-auto px-5 md:px-8">
		<InView>
			<h2 class="text-3xl md:text-4xl font-bold text-center mb-4 uppercase">On the Wire</h2>
			<p class="text-center text-[var(--color-text-muted)] max-w-2xl mx-auto mb-12 text-lg">
				The Resource Managed flow as raw HTTP — showing Signature-Key, AAuth-Requirement, and AAuth-Access headers.
			</p>
		</InView>
		<InView>
			<div class="rounded-xl border bg-[var(--color-bg-card)] overflow-hidden p-6 font-mono text-sm leading-loose">
				[wire example removed]
			</div>
		</InView>
	</div>
</section>
-->



<!-- Get Started -->
<section id="get-started" class="scroll-mt-24 py-[1.82rem] md:py-[3.12rem]">
	<div class="max-w-7xl mx-auto px-5 md:px-8">
		<InView>
			<h2 class="text-3xl md:text-4xl font-bold mb-4 uppercase">Explore AAuth</h2>
			<p class="text-[var(--color-text-muted)] mb-12 text-lg">
				Try the protocol, explore the SDKs, and follow the conversation.
			</p>
		</InView>

		<div class="grid grid-cols-1 gap-4 mb-9">
			{#each demos as demo, i}
				<InView class="h-full">
					<div class="h-full p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] flex flex-col">
						<h3 class="font-mono font-semibold mb-2 flex items-center gap-3">
							{#if demo.logo}
								<img src={demo.logo} alt="" width="32" height="32" class="inline-block" />
							{:else if demo.iconPath}
								<svg class="w-8 h-8 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" d={demo.iconPath} />
								</svg>
							{/if}
							{demo.name}
						</h3>
						<p class="text-sm text-[var(--color-text-muted)] mb-5 leading-relaxed">{@html demo.desc}</p>
						{#if demo.prompt}
							<pre class="mb-4 p-3 rounded-lg bg-[var(--color-bg-code)] border border-[var(--color-border)] text-xs text-[var(--color-text-muted)] font-mono leading-relaxed overflow-x-auto whitespace-nowrap">{demo.prompt.replace(/\n+/g, ' ')}</pre>
						{/if}
						<div class="mt-auto flex flex-wrap gap-4 text-sm">
							{#if demo.prompt}
								<button
									type="button"
									onclick={() => copyPrompt(demo.prompt, i)}
									onmouseenter={() => (demoTriggers[i] = demoTriggers[i] + 1)}
									class="text-[var(--color-accent)] no-underline cursor-pointer bg-transparent border-0 p-0 font-inherit"
								>
									<DecryptText text={copiedIdx === i ? 'Copied ✓' : 'Copy prompt'} trigger={demoTriggers[i]} />
								</button>
							{:else}
								<a
									href={demo.primary}
									target="_blank"
									rel="noopener"
									onmouseenter={() => (demoTriggers[i] = demoTriggers[i] + 1)}
									class="text-[var(--color-accent)] no-underline"
								>
									<DecryptText text={`${demo.primaryLabel} ↗`} trigger={demoTriggers[i]} />
								</a>
							{/if}
							{#if demo.source}
								<a href={demo.source} target="_blank" rel="noopener" class="text-[var(--color-text-muted)] no-underline hover:underline">Source ↗</a>
							{/if}
						</div>
					</div>
				</InView>
			{/each}
		</div>

		<div
			class="grid grid-cols-1 sm:grid-cols-2 gap-3"
			onmousemove={(e) => {
				const cards = e.currentTarget.querySelectorAll('.glow-card');
				cards.forEach((card) => {
					const r = card.getBoundingClientRect();
					card.style.setProperty('--mx', `${e.clientX - r.left}px`);
					card.style.setProperty('--my', `${e.clientY - r.top}px`);
					const dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right);
					const dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom);
					card.style.setProperty('--glow-opacity', Math.hypot(dx, dy) < 120 ? '1' : '0');
				});
			}}
			onmouseleave={(e) => {
				e.currentTarget.querySelectorAll('.glow-card').forEach((c) => {
					c.style.setProperty('--glow-opacity', '0');
				});
			}}
		>
			{#each platforms as platform}
				<InView class="h-full">
					<a
						href={platform.href}
						target="_blank"
						rel="noopener"
						class="glow-card block h-full p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] no-underline transition-transform duration-200 hover:scale-[1.02]"
					>
						<h3 class="font-semibold mb-1 flex items-center gap-2">
							{#if platform.iconPath}
								<svg class="w-[18px] h-[18px] text-[var(--color-text)]" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" d={platform.iconPath} />
								</svg>
							{:else if platform.iconPathFilled}
								<svg class="w-[18px] h-[18px] text-[var(--color-text)]" viewBox="0 0 24 24" fill="currentColor">
									<path d={platform.iconPathFilled} />
								</svg>
							{:else if platform.iconGlyph}
								<span class="font-mono text-[var(--color-text)] w-[18px] text-center">{platform.iconGlyph}</span>
							{:else}
								<picture>
									<source
										srcset={`https://cdn.simpleicons.org/${platform.icon}/0f172a`}
										media="(prefers-color-scheme: light)"
									/>
									<img
										src={`https://cdn.simpleicons.org/${platform.icon}/e4e4ed`}
										alt=""
										width="18"
										height="18"
										class="inline-block"
									/>
								</picture>
							{/if}
							{platform.name}
							{#if !platform.available}
								<span class="text-xs text-[var(--color-text-dim)] font-normal ml-2">wanted</span>
							{/if}
						</h3>
						<p class="text-sm text-[var(--color-text-muted)]">{platform.desc}</p>
					</a>
				</InView>
			{/each}
		</div>

		<InView>
			<div
				class="space-y-3 mt-9"
				onmousemove={(e) => {
					const cards = e.currentTarget.querySelectorAll('.glow-card');
					cards.forEach((card) => {
						const r = card.getBoundingClientRect();
						card.style.setProperty('--mx', `${e.clientX - r.left}px`);
						card.style.setProperty('--my', `${e.clientY - r.top}px`);
						const dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right);
						const dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom);
						card.style.setProperty('--glow-opacity', Math.hypot(dx, dy) < 120 ? '1' : '0');
					});
				}}
				onmouseleave={(e) => {
					e.currentTarget.querySelectorAll('.glow-card').forEach((c) => {
						c.style.setProperty('--glow-opacity', '0');
					});
				}}
			>
				{#each deepDives as post}
					<a
						href={post.href}
						target="_blank"
						rel="noopener"
						class="glow-card block p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] no-underline transition-transform duration-200 hover:scale-[1.02]"
					>
						<div class="flex items-start justify-between gap-4 mb-1">
							<h3 class="font-semibold">{post.title}</h3>
							<span class="text-xs text-[var(--color-text-dim)] shrink-0 mt-1 font-mono">{post.date}</span>
						</div>
						<p class="text-sm text-[var(--color-text-muted)] flex items-center gap-2">
							{#if authorAvatars[post.author]}
								<img
									src={authorAvatars[post.author]}
									alt={post.author}
									width="20"
									height="20"
									class="w-5 h-5 rounded-full object-cover shrink-0"
									loading="lazy"
								/>
							{/if}
							<span>{post.author} — {post.desc}</span>
						</p>
					</a>
				{/each}
			</div>
		</InView>
	</div>
</section>


<!-- Community -->
<section id="community" class="scroll-mt-24 py-[1.82rem] md:py-[3.12rem]">
	<div class="max-w-7xl mx-auto px-5 md:px-8">
		<InView>
			<h2 class="text-3xl md:text-4xl font-bold mb-4 uppercase">Community</h2>
			<p class="text-[var(--color-text-muted)] mb-10 text-lg">
				Join the discussion on Slack.
			</p>
		</InView>
		<div
			class="grid grid-cols-1 sm:grid-cols-2 gap-4"
			onmousemove={(e) => {
				const cards = e.currentTarget.querySelectorAll('.glow-card');
				cards.forEach((card) => {
					const r = card.getBoundingClientRect();
					card.style.setProperty('--mx', `${e.clientX - r.left}px`);
					card.style.setProperty('--my', `${e.clientY - r.top}px`);
					const dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right);
					const dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom);
					card.style.setProperty('--glow-opacity', Math.hypot(dx, dy) < 120 ? '1' : '0');
				});
			}}
			onmouseleave={(e) => {
				e.currentTarget.querySelectorAll('.glow-card').forEach((c) => {
					c.style.setProperty('--glow-opacity', '0');
				});
			}}
		>
			{#each slacks as slack}
				<InView class="h-full">
					<a
						href={slack.href}
						target="_blank"
						rel="noopener"
						class="glow-card plausible-event-name={slack.event} block h-full p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] no-underline transition-transform duration-200 hover:scale-[1.02]"
					>
						<h3 class="font-mono font-semibold mb-2 flex items-center gap-3">
							<img src={slack.logo} alt="" width="32" height="32" class="inline-block rounded-md" />
							{slack.name}
						</h3>
						<p class="text-sm text-[var(--color-text-muted)] leading-relaxed">{slack.desc}</p>
					</a>
				</InView>
			{/each}
		</div>
	</div>
</section>


<!-- Events -->
<section id="events" class="scroll-mt-24 py-[1.82rem] md:py-[3.12rem]">
	<div class="max-w-7xl mx-auto px-5 md:px-8">
		<InView>
			<h2 class="text-3xl md:text-4xl font-bold mb-10 uppercase">Events</h2>
		</InView>
		<InView>
			<div class="grid gap-6">
				<div>
					<h3 class="font-mono font-semibold mb-2">AAuth Night</h3>
					<p class="text-sm text-[var(--color-text-muted)] leading-relaxed mb-4">Join us in person in San Francisco for an evening on auth for AI agents.</p>
					<div class="rounded-xl overflow-hidden border border-[var(--color-border)] bg-[#13370f]">
						<iframe
							src={`https://luma.com/embed/event/evt-DaVOoSlMt1iCiJD/simple?lt=${lumaTheme}&utm_source=aauth.dev`}
							width="600"
							class="h-[800px] md:h-[425px]"
							style="border: 0; width: 100%; display: block;"
							loading="lazy"
						allow="fullscreen; payment"
							title="AAuth Night event"
						></iframe>
					</div>
				</div>
				<!-- <div>
					<h3 class="font-mono font-semibold mb-2">Office Hours</h3>
					<p class="text-sm text-[var(--color-text-muted)] leading-relaxed mb-4">Drop in to ask questions, share what you're building, or listen along.</p>
					<div class="rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-bg-card)]">
						<iframe
							src={`https://luma.com/embed/calendar/cal-nXUxsqTY2ZQgy3b/events?lt=${lumaTheme}`}
							width="600"
							height="650"
							style="border: 0; width: 100%; display: block;"
							loading="lazy"
						allow="fullscreen; payment"
							title="AAuth Office Hours calendar"
						></iframe>
					</div>
				</div> -->
			</div>
		</InView>
	</div>
</section>

<!-- Footer -->
<footer class="py-16 border-t border-[var(--color-border)]">
	<div class="max-w-7xl mx-auto px-5 md:px-8">
		<div class="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
			<div>
				<span class="font-display font-bold text-lg">AAuth</span>
				<p class="text-sm text-[var(--color-text-muted)] mt-2 max-w-xs">
					Cryptographic identity, resource access, and user delegation — for every HTTP client.
				</p>
				<p class="text-sm text-[var(--color-text-muted)] mt-3">
					Founding sponsor: <a href="https://www.linkedin.com/in/geffenpo/" target="_blank" rel="noopener" class="hover:text-[var(--color-accent)] transition-colors">Geffen Posner</a>
				</p>
			</div>
			<div class="flex items-center gap-5 text-sm flex-wrap">
				<a href="/llms.txt" class="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors no-underline font-mono">llms.txt</a>
				<a href="/home.md" class="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors no-underline font-mono">home.md</a>
				<a href="https://github.com/hellocoop/aauth.dev/edit/main/src/routes/+page.svelte" target="_blank" rel="noopener" class="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors no-underline">Edit this page ↗</a>
			</div>
		</div>
	</div>
</footer>

</div>
