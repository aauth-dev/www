<script>
	import Nav from '$lib/components/Nav.svelte';
	import InView from '$lib/components/InView.svelte';
	import Mermaid from '$lib/components/Mermaid.svelte';
	import DecryptText from '$lib/components/DecryptText.svelte';
	import PrismaticBurst from '$lib/components/PrismaticBurst.svelte';

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

	const demos = [
		{
			name: 'Protocol Explorer',
			iconPath: 'm21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z',
			desc: 'Browse AAuth access modes, tokens, and headers with side-by-side wire examples.',
			primary: 'https://explorer.aauth.dev',
			primaryLabel: 'Open Explorer',
			source: null
		},
		{
			name: 'whoami.aauth.dev',
			logo: '/demos/whoami.png',
			desc: "A minimal AAuth identity resource — one endpoint that returns who the caller is.",
			primary: 'https://playground.aauth.dev',
			primaryLabel: 'Try in Playground',
			source: 'https://github.com/aauth-dev/whoami'
		},
		{
			name: 'notes.aauth.dev',
			logo: '/demos/notes.png',
			desc: "A notes API using <a href=\"https://github.com/dickhardt/AAuth/blob/main/draft-hardt-aauth-r3.md\" target=\"_blank\" rel=\"noopener\" class=\"text-[var(--color-text)] hover:underline\">AAuth R3 ↗</a>. Agents declare OpenAPI operations; consent is over actions, not endpoints.",
			primary: 'https://playground.aauth.dev',
			primaryLabel: 'Try in Playground',
			source: 'https://github.com/aauth-dev/notes'
		}
	];

	let demoTriggers = $state([0, 0, 0]);
	let lumaTrigger = $state(0);

	const participants = `    participant A as Agent
    participant R as Resource
    participant P as PS
    participant S as AS`;

	const modes = [
		{
			name: 'Identity-Based',
			parties: 'Agent + Resource',
			desc: 'Agent signs every request. Resource verifies identity and applies its own access control. Replaces API keys.',
			diagram: `sequenceDiagram
${participants}
    A->>R: HTTPSig w/ agent token
    R-->>A: 200 OK`,
			steps: [
				{ from: 'Agent', to: 'Resource', lines: ['HTTPSig w/ agent_token'] },
				{ from: 'Resource', to: 'Agent', lines: ['200 OK'], dashed: true }
			]
		},
		{
			name: 'Resource-Managed',
			parties: 'Agent + Resource',
			desc: 'Resource handles authorization itself — via user interaction, consent, or an existing OAuth / OIDC provider.',
			diagram: `sequenceDiagram
${participants}
    A->>R: HTTPSig w/ agent token
    R-->>A: 202\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0<br/>(interaction required)
    Note over A,R: user completes interaction
    A->>R: GET pending URL
    R-->>A: 200 OK\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0<br/>AAuth-Access:<br/>opaque-token\u00A0\u200D
    A->>R: HTTPSig w/ agent token<br/>Authorization:\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0<br/>AAuth opaque-token\u00A0\u00A0\u00A0\u00A0\u200D
    R-->>A: 200 OK`,
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
			name: 'PS-Managed',
			parties: 'Agent + Resource + PS',
			desc: 'Access is brokered by a server representing the user — the PS. It handles consent and issues the auth token; the resource stays focused on its API.',
			diagram: `sequenceDiagram
${participants}
    A->>R: HTTPSig w/ agent token<br/>POST /authorize\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u200D
    R-->>A: resource_token<br/>(aud = PS URL)
    A->>P: HTTPSig w/ agent token<br/>POST /token\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0<br/>w/ resource_token\u00A0\u00A0\u00A0\u00A0\u00A0\u200D
    P-->>A: auth_token
    A->>R: HTTPSig w/ auth_token<br/>GET /api/documents\u00A0\u00A0\u00A0\u200D
    R-->>A: 200 OK`,
			steps: [
				{ from: 'Agent', to: 'Resource', lines: ['HTTPSig w/ agent_token', 'POST /authorize'] },
				{ from: 'Resource', to: 'Agent', lines: ['resource_token (aud = PS URL)'], dashed: true },
				{ from: 'Agent', to: 'PS', lines: ['HTTPSig w/ agent_token', 'POST /token w/ resource_token'] },
				{ from: 'PS', to: 'Agent', lines: ['auth_token'], dashed: true },
				{ from: 'Agent', to: 'Resource', lines: ['HTTPSig w/ auth_token', 'GET /api/documents'] },
				{ from: 'Resource', to: 'Agent', lines: ['200 OK'], dashed: true }
			]
		},
		{
			name: 'Federated',
			parties: 'Agent + Resource + PS + AS',
			desc: 'Internet-scale mode for cross-organization access. Resource has its own Access Server; PS federates with AS across trust domains to obtain the auth token.',
			diagram: `sequenceDiagram
${participants}
    A->>R: HTTPSig w/ agent token<br/>POST /authorize\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u200D
    R-->>A: resource_token<br/>(aud = AS URL)
    A->>P: HTTPSig w/ agent token<br/>POST /token\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0<br/>w/ resource_token\u00A0\u00A0\u00A0\u00A0\u00A0\u200D
    P->>S: HTTPSig w/ jwks_uri<br/>POST /token\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0<br/>w/ resource_token\u00A0\u00A0\u200D
    S-->>P: auth_token
    P-->>A: auth_token
    A->>R: HTTPSig w/ auth_token<br/>GET /api/documents\u00A0\u00A0\u00A0\u200D
    R-->>A: 200 OK`,
			steps: [
				{ from: 'Agent', to: 'Resource', lines: ['HTTPSig w/ agent_token', 'POST /authorize'] },
				{ from: 'Resource', to: 'Agent', lines: ['resource_token (aud = AS URL)'], dashed: true },
				{ from: 'Agent', to: 'PS', lines: ['HTTPSig w/ agent_token', 'POST /token w/ resource_token'] },
				{ from: 'PS', to: 'AS', lines: ['HTTPSig w/ jwks_uri', 'POST /token w/ resource_token'] },
				{ from: 'AS', to: 'PS', lines: ['auth_token'], dashed: true },
				{ from: 'PS', to: 'Agent', lines: ['auth_token'], dashed: true },
				{ from: 'Agent', to: 'Resource', lines: ['HTTPSig w/ auth_token', 'GET /api/documents'] },
				{ from: 'Resource', to: 'Agent', lines: ['200 OK'], dashed: true }
			]
		}
	];

	let activeMode = $state(0);

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
			href: 'https://github.com/hellocoop/AAuth',
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
			title: 'AAuth Full Demo',
			author: 'Christian Posta',
			desc: 'Working demo with Keycloak, Agentgateway, Java/Python/Rust',
			href: 'https://blog.christianposta.com/aauth-full-demo/',
			date: '2026-03-31'
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

<!-- Hero (fixed behind content — content below scrolls over it). pointer-events: only interactive inner column receives clicks so nav stays usable. -->
<section
	class="fixed inset-0 flex items-center justify-center px-6 pt-16 overflow-hidden z-0 pointer-events-none"
>
	<div class="hero-burst absolute inset-0 opacity-25 pointer-events-none">
		<PrismaticBurst
			intensity={1.8}
			speed={0.4}
			animationType="rotate3d"
			distort={1.5}
			rayCount={0}
			colors={['#4ade80', '#38bdf8', '#a78bfa']}
		/>
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
				<DecryptText text="Try the Playground" trigger={playgroundTrigger} />
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
<div class="h-screen" aria-hidden="true"></div>

<!-- Scrolling content covers the fixed hero background -->
<div class="relative z-10 bg-[var(--color-bg)] border-t border-[var(--color-accent)]/25 shadow-[0_-8px_32px_-12px_color-mix(in_srgb,var(--color-accent)_18%,transparent)]">

<!-- What Changed -->
<section id="what-changed" class="py-14 md:py-24 px-6">
	<div class="max-w-6xl mx-auto">
		<InView>
			<h2 class="text-3xl md:text-4xl font-bold text-center mb-4 uppercase">What Changed</h2>
			<p class="text-center text-[var(--color-text-muted)] max-w-5xl mx-auto mb-16 text-lg">
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
<section id="why-aauth" class="scroll-mt-24 py-14 md:py-24 px-6">
	<div class="max-w-4xl mx-auto">
		<InView>
			<h2 class="text-3xl md:text-4xl font-bold text-center mb-4 uppercase">Why AAuth?</h2>
			<p class="text-center text-base text-[var(--color-text-muted)] italic mb-8">
				By <a href="https://www.linkedin.com/in/dickhardt" target="_blank" rel="noopener" class="text-[var(--color-text)] hover:text-[var(--color-accent)] transition-colors not-italic">Dick Hardt</a>, author of OAuth 2.0
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
<section class="py-14 md:py-24 px-6">
	<div class="max-w-5xl mx-auto">
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
<section id="how-it-works" class="scroll-mt-24 py-14 md:py-24 px-6">
	<div class="max-w-6xl mx-auto">
		<InView>
			<h2 class="text-3xl md:text-4xl font-bold text-center mb-4 uppercase">How AAuth Works</h2>
			<p class="text-center text-[var(--color-text-muted)] max-w-3xl mx-auto mb-4 text-lg">
				AAuth has four access modes. The simplest replaces API keys;<br class="hidden sm:inline" />
				each adds parties and capabilities. Adopt any mode independently.
			</p>
		</InView>

		<InView>
			<div class="flex items-center justify-center gap-3 flex-wrap mt-10 mb-4">
				<span class="text-xs font-mono text-[var(--color-text-dim)] hidden sm:inline">simplest &rarr;</span>
				<div class="flex justify-center gap-2 flex-wrap">
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
				<span class="text-xs font-mono text-[var(--color-text-dim)] hidden sm:inline">&rarr; most capable</span>
			</div>


			<div class="max-w-4xl mx-auto">
				<div class="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] overflow-hidden">
					<div class="p-6">
						<p class="text-[var(--color-text-muted)] mb-6 min-h-[4.5rem]">{modes[activeMode].desc}</p>
						<!-- Mobile: vertical step-list -->
						<div class="md:hidden bg-[var(--color-bg-code)] rounded-lg p-5">
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

						<!-- Desktop: Mermaid sequence diagram -->
						<div class="hidden md:block bg-[var(--color-bg-code)] rounded-lg p-5 min-h-[470px] overflow-x-auto md:overflow-hidden">
							{#each modes as mode, i}
								<div class="w-full {i === activeMode ? '' : 'hidden'}">
									<Mermaid chart={mode.diagram} />
								</div>
							{/each}
						</div>

						<!-- Raw HTTP wire example for Resource-Managed (commented out for now)
						{#if modes[activeMode].name === 'Resource-Managed'}
							<p class="text-xs text-[var(--color-text-dim)] font-mono mt-6 mb-2">as raw HTTP:</p>
							<div class="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-code)] p-5 font-mono text-sm leading-loose overflow-x-auto">
								... wire example markup ...
							</div>
						{/if}
						-->

					</div>
				</div>
			</div>
			<div class="mt-4 flex justify-center">
				<ul class="text-xs text-left text-[var(--color-text-dim)] space-y-1 font-mono list-none">
					<li><span class="text-[var(--color-text-muted)]">agent_token</span> establishes the agent's identity</li>
					<li><span class="text-[var(--color-text-muted)]">resource_token</span> describes the access needed</li>
					<li><span class="text-[var(--color-text-muted)]">auth_token</span> grants an agent access to a resource</li>
					<li><span class="text-[var(--color-text-muted)]">jwks_uri</span> PS's JWKS endpoint, discovered via well-known metadata</li>
					<li><span class="text-[var(--color-text-muted)]">PS</span> Person Server &middot; <span class="text-[var(--color-text-muted)]">AS</span> Access Server</li>
				</ul>
			</div>
		</InView>
	</div>
</section>

<!-- The 202 Pattern (commented out — redundant with Resource-Managed diagram)
<section class="py-14 md:py-24 px-6">
	<div class="max-w-4xl mx-auto">
		<InView>
			<h2 class="text-3xl md:text-4xl font-bold text-center mb-4 uppercase">On the Wire</h2>
			<p class="text-center text-[var(--color-text-muted)] max-w-2xl mx-auto mb-12 text-lg">
				The Resource-Managed flow as raw HTTP — showing Signature-Key, AAuth-Requirement, and AAuth-Access headers.
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
<section id="get-started" class="scroll-mt-24 py-14 md:py-24 px-6">
	<div class="max-w-6xl mx-auto">
		<InView>
			<h2 class="text-3xl md:text-4xl font-bold text-center mb-4 uppercase">Explore AAuth</h2>
			<p class="text-center text-[var(--color-text-muted)] max-w-2xl mx-auto mb-3 text-lg">
				Try the protocol, explore the SDKs, and follow the conversation.
			</p>
			<p class="text-center text-lg text-[var(--color-text-dim)] italic max-w-3xl mx-auto mb-12">
				The demos and Playground run against the Hellō Beta Person Server — data is reset regularly, so don't store anything you need to keep.
			</p>
		</InView>

		<div class="grid grid-cols-1 gap-4 max-w-4xl mx-auto mb-9">
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
						<div class="mt-auto flex flex-wrap gap-4 text-sm">
							<a
								href={demo.primary}
								target="_blank"
								rel="noopener"
								onmouseenter={() => (demoTriggers[i] = demoTriggers[i] + 1)}
								class="text-[var(--color-accent)] no-underline"
							>
								<DecryptText text={`${demo.primaryLabel} ↗`} trigger={demoTriggers[i]} />
							</a>
							{#if demo.source}
								<a href={demo.source} target="_blank" rel="noopener" class="text-[var(--color-text-muted)] no-underline hover:underline">Source ↗</a>
							{/if}
						</div>
					</div>
				</InView>
			{/each}
		</div>

		<div
			class="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto"
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
								<img
									src={`https://cdn.simpleicons.org/${platform.icon}/e4e4ed`}
									alt=""
									width="18"
									height="18"
									class="inline-block"
								/>
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
				class="space-y-3 max-w-4xl mx-auto mt-9"
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
<section id="community" class="scroll-mt-24 py-14 md:py-24 px-6">
	<div class="max-w-4xl mx-auto">
		<InView>
			<h2 class="text-3xl md:text-4xl font-bold text-center mb-4 uppercase">Community</h2>
			<p class="text-center text-[var(--color-text-muted)] max-w-2xl mx-auto mb-10 text-lg">
				Join the discussion on Slack.
			</p>
		</InView>
		<div
			class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto"
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


<!-- Office Hours -->
<section id="office-hours" class="py-14 md:py-24 px-6">
	<div class="max-w-4xl mx-auto">
		<InView>
			<h2 class="text-3xl md:text-4xl font-bold text-center mb-4 uppercase">Office Hours</h2>
			<p class="text-center text-[var(--color-text-muted)] max-w-3xl mx-auto mb-10 text-lg">
				Drop in to ask questions, share what you're building, or listen along.<br class="hidden md:inline"/> Sign up below or at <a
					href="https://lu.ma/aauth"
					target="_blank"
					rel="noopener"
					onmouseenter={() => (lumaTrigger = lumaTrigger + 1)}
					class="text-[var(--color-accent)] no-underline"
				><DecryptText text="lu.ma/aauth ↗" trigger={lumaTrigger} /></a>.
			</p>
		</InView>
		<InView>
			<div class="max-w-[600px] mx-auto rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-bg-card)]">
				<iframe
					src="https://luma.com/embed/calendar/cal-nXUxsqTY2ZQgy3b/events?lt=dark"
					width="600"
					height="450"
					style="border: 0; width: 100%; display: block;"
					allowfullscreen
					title="AAuth Office Hours calendar"
				></iframe>
			</div>
		</InView>
	</div>
</section>


<!-- Footer -->
<footer class="py-16 px-6 border-t border-[var(--color-border)]">
	<div class="max-w-6xl mx-auto">
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
