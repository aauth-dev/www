<script>
	import Nav from '$lib/components/Nav.svelte';
	import InView from '$lib/components/InView.svelte';
	import Mermaid from '$lib/components/Mermaid.svelte';

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
			title: 'No Pre-Registration',
			desc: 'Agents self-publish identity at HTTPS URLs. Any agent can interact with any resource on first contact.',
			color: 'var(--color-agent)'
		},
		{
			title: 'Proof of Possession',
			desc: 'Every request is signed with HTTP Message Signatures. Stolen tokens are worthless without the signing key.',
			color: 'var(--color-resource)'
		},
		{
			title: 'Async by Design',
			desc: '202 Accepted + polling handles consent, approvals, clarification chat, and headless agents. One pattern.',
			color: 'var(--color-ps)'
		},
		{
			title: 'Tool-Call Governance',
			desc: 'The Person Server manages what tools the agent can call, providing permission and audit for tool use.',
			color: 'var(--color-as)'
		},
		{
			title: 'Missions',
			desc: 'Agents propose what they intend to do. The user reviews, clarifies, and approves. Every access is in context.',
			color: 'var(--color-ps)'
		},
		{
			title: 'Cross-Domain Federation',
			desc: 'PS-to-AS federation enables access across trust domains. The agent doesn\'t need to know about each access server.',
			color: 'var(--color-agent)'
		}
	];

	const participants = `    participant A as Agent
    participant R as Resource
    participant P as PS
    participant S as AS`;

	const modes = [
		{
			name: 'Identity-Based',
			parties: 'Agent + Resource',
			desc: 'Agent signs requests. Resource verifies identity and applies its own access control. Replaces API keys.',
			diagram: `sequenceDiagram
${participants}
    A->>R: HTTPSig w/ agent token
    R-->>A: 200 OK`
		},
		{
			name: 'Resource-Managed',
			parties: 'Agent + Resource',
			desc: 'Resource handles authorization itself — via interaction, consent, or existing auth infrastructure.',
			diagram: `sequenceDiagram
${participants}
    A->>R: HTTPSig w/ agent token
    R-->>A: 202 Accepted + Location
    Note over A,R: user consents
    A->>R: GET Location
    R-->>A: 200 OK + AAuth-Access`
		},
		{
			name: 'PS-Managed',
			parties: 'Agent + Resource + PS',
			desc: 'Resource issues a resource token. PS issues an auth token carrying user identity and scope.',
			diagram: `sequenceDiagram
${participants}
    A->>R: HTTPSig w/ agent token
    R-->>A: 401 + resource_token
    A->>P: resource_token + HTTPSig
    P-->>A: auth_token
    A->>R: HTTPSig w/ auth_token
    R-->>A: 200 OK`
		},
		{
			name: 'Federated',
			parties: 'Agent + Resource + PS + AS',
			desc: 'Resource has its own Access Server. PS federates with AS to obtain the auth token across trust domains.',
			diagram: `sequenceDiagram
${participants}
    A->>R: HTTPSig w/ agent token
    R-->>A: 401 + resource_token
    A->>P: resource_token + HTTPSig
    P->>S: federate
    S-->>P: auth_token
    P-->>A: auth_token
    A->>R: HTTPSig w/ auth_token
    R-->>A: 200 OK`
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
			primary: true
		},
		{
			name: 'AAuth Headers',
			status: 'Internet-Draft',
			href: 'https://datatracker.ietf.org/doc/draft-hardt-aauth-headers/',
			editorsCopy: 'https://dickhardt.github.io/AAuth/draft-hardt-aauth-headers.html',
			desc: 'HTTP response headers used across AAuth: AAuth-Requirement (what the resource needs), AAuth-Access (opaque access token), and AAuth-Error (structured error reporting).',
			primary: false
		},
		{
			name: 'HTTP Signature Keys',
			status: 'Internet-Draft',
			href: 'https://datatracker.ietf.org/doc/draft-hardt-httpbis-signature-key/',
			editorsCopy: 'https://dickhardt.github.io/signature-key/draft-hardt-httpbis-signature-key.html',
			desc: 'Foundation layer. Well-known key discovery, the Signature-Key header for conveying public keying material alongside HTTP Message Signatures.',
			primary: false
		},
		{
			name: 'R3 — Rich Resource Requests',
			status: 'Exploratory',
			href: 'https://dickhardt.github.io/AAuth/draft-hardt-aauth-r3.html',
			editorsCopy: null,
			desc: 'Vocabulary-based authorization using formats agents already understand (MCP, OpenAPI, gRPC, GraphQL).',
			primary: false
		}
	];

	const platforms = [
		{
			name: 'Node.js / TypeScript',
			icon: 'nodedotjs',
			desc: 'Reference SDK for agents and MCP servers with signed-request auth.',
			href: 'https://github.com/hellocoop/AAuth',
			available: true
		},
		{
			name: 'Python',
			icon: 'python',
			desc: 'End-to-end A2A multi-agent demo with Keycloak and user consent.',
			href: 'https://github.com/christian-posta/aauth-full-demo',
			available: true
		},
		{
			name: 'Java (Keycloak)',
			icon: 'keycloak',
			desc: 'Keycloak extension adding AAuth signature verification and grants.',
			href: 'https://github.com/christian-posta/keycloak-aauth-extension',
			available: true
		},
		{
			name: 'Rust',
			icon: 'rust',
			desc: 'Agentgateway routing signed agent-to-agent traffic.',
			href: 'https://github.com/christian-posta/aauth-full-demo',
			available: true
		},
	];

	const deepDives = [
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
</script>

<Nav />

<!-- Hero -->
<section class="min-h-screen flex items-center justify-center px-6 pt-16">
	<div class="max-w-4xl mx-auto text-center">
		<h1 class="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1]">
			HTTP Clients Need<br />
			<span class="text-[var(--color-accent)]">
				Their Own Identity
			</span>
		</h1>
		<p class="text-xl md:text-2xl text-[var(--color-text-muted)] max-w-3xl mx-auto mb-12 leading-relaxed">
			AAuth gives every agent its own cryptographic identity.<br />
			No pre-registration. No shared secrets. No bearer tokens.
		</p>
		<!-- <p class="text-lg text-[var(--color-text-dim)] max-w-2xl mx-auto mb-12 leading-relaxed">
			A domain, static metadata, and a JWKS. That's it. This is the foundation
			that authorization, governance, and federation build on.
		</p> -->

		<div class="flex justify-center gap-4 flex-wrap mb-16">
			<a
				href="https://playground.aauth.dev"
				class="font-display inline-flex items-center gap-2 px-7 py-3.5 rounded-lg bg-[var(--color-accent)] text-black font-medium no-underline hover:scale-[1.02]"
			>
				<span class="font-mono text-sm">&gt;</span> Try the Playground
			</a>
			<a
				href="#get-started"
				class="font-display inline-flex items-center gap-2 px-7 py-3.5 rounded-lg border border-[var(--color-accent)] text-[var(--color-accent)] font-medium no-underline hover:scale-[1.02]"
			>
				See Implementations
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

<!-- Agents Are Different -->
<section id="compare" class="py-24 px-6">
	<div class="max-w-6xl mx-auto">
		<InView>
			<h2 class="text-3xl md:text-4xl font-bold text-center mb-4">Agents Are Different</h2>
			<p class="text-center text-[var(--color-text-muted)] max-w-4xl mx-auto mb-16 text-lg">
				Agents discover resources at runtime and need authorization mid-task.<br />
				Protocols built for pre-registered clients with fixed integrations can't keep up.
			</p>
		</InView>

		<div
			class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
			onmousemove={(e) => {
				const cards = e.currentTarget.querySelectorAll('.glow-card');
				cards.forEach((card) => {
					const r = card.getBoundingClientRect();
					const mx = e.clientX - r.left;
					const my = e.clientY - r.top;
					card.style.setProperty('--mx', `${mx}px`);
					card.style.setProperty('--my', `${my}px`);
					const dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right);
					const dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom);
					const dist = Math.hypot(dx, dy);
					card.style.setProperty('--glow-opacity', dist < 120 ? '1' : '0');
				});
			}}
			onmouseleave={(e) => {
				e.currentTarget.querySelectorAll('.glow-card').forEach((c) => {
					c.style.setProperty('--glow-opacity', '0');
				});
			}}
		>
			{#each features as feature, i}
				<InView class="delay-{i}">
					<div
						class="glow-card p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] cursor-default select-none"
					>
						<h3 class="text-lg font-semibold mb-2 font-mono"><span class="text-[var(--color-accent)]">&gt;</span> {feature.title}</h3>
						<p class="text-sm text-[var(--color-text-muted)] leading-relaxed">{feature.desc}</p>
					</div>
				</InView>
			{/each}
		</div>
	</div>
</section>

<!-- Compare -->
<section class="py-24 px-6">
	<div class="max-w-5xl mx-auto">
		<InView>
			<h2 class="text-3xl md:text-4xl font-bold text-center mb-4">Why Not OAuth or API Keys?</h2>
			<p class="text-center text-[var(--color-text-muted)] max-w-3xl mx-auto mb-12 text-lg">
				The two credentials agents inherit today were designed for a different shape of client.
			</p>
		</InView>

		<InView>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div class="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)]">
					<h3 class="font-semibold mb-4">API Keys</h3>
					<dl class="space-y-3 text-sm">
						<div><dt class="text-[var(--color-text-dim)]">Registration</dt><dd>Per service</dd></div>
						<div><dt class="text-[var(--color-text-dim)]">Credential</dt><dd>Shared secret</dd></div>
						<div><dt class="text-[var(--color-text-dim)]">Presentation</dt><dd>Bearer</dd></div>
						<div><dt class="text-[var(--color-text-dim)]">User delegation</dt><dd>None</dd></div>
					</dl>
				</div>
				<div class="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)]">
					<h3 class="font-semibold mb-4">OAuth 2.0 / OIDC</h3>
					<dl class="space-y-3 text-sm">
						<div><dt class="text-[var(--color-text-dim)]">Registration</dt><dd>Per authorization server</dd></div>
						<div><dt class="text-[var(--color-text-dim)]">Credential</dt><dd>Client secret + bearer token</dd></div>
						<div><dt class="text-[var(--color-text-dim)]">Presentation</dt><dd>Bearer (DPoP optional)</dd></div>
						<div><dt class="text-[var(--color-text-dim)]">User delegation</dt><dd>Through the AS</dd></div>
					</dl>
				</div>
				<div class="border-flow p-6 rounded-xl border border-transparent bg-[var(--color-bg-card)]">
					<h3 class="font-semibold mb-4 text-[var(--color-accent)]">AAuth</h3>
					<dl class="space-y-3 text-sm">
						<div><dt class="text-[var(--color-text-dim)]">Registration</dt><dd>None — self-published</dd></div>
						<div><dt class="text-[var(--color-text-dim)]">Credential</dt><dd>Agent's own signing key</dd></div>
						<div><dt class="text-[var(--color-text-dim)]">Presentation</dt><dd>HTTP Message Signature</dd></div>
						<div><dt class="text-[var(--color-text-dim)]">User delegation</dt><dd>Per-request via PS / AS</dd></div>
					</dl>
				</div>
			</div>
		</InView>
	</div>
</section>

<!-- How AAuth Works -->
<section id="how-it-works" class="py-24 px-6">
	<div class="max-w-6xl mx-auto">
		<InView>
			<h2 class="text-3xl md:text-4xl font-bold text-center mb-4">How AAuth Works</h2>
			<p class="text-center text-[var(--color-text-muted)] max-w-2xl mx-auto mb-4 text-lg">
				Four access modes. Each adds parties and capabilities.<br />
				Adoption does not require coordination between parties.
			</p>
		</InView>

		<InView>
			<div class="flex justify-center gap-2 flex-wrap mb-8 mt-12">
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

			<div class="max-w-4xl mx-auto">
				<div class="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] overflow-hidden">
					<div class="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
						<div>
							<span class="text-sm font-medium">{modes[activeMode].name} Access</span>
							<span class="text-xs text-[var(--color-text-dim)] ml-3">{modes[activeMode].parties}</span>
						</div>
					</div>
					<div class="p-6">
						<p class="text-[var(--color-text-muted)] mb-6">{modes[activeMode].desc}</p>
						<div class="bg-[var(--color-bg-code)] rounded-lg p-5 overflow-x-auto min-h-[520px] flex items-start">
						{#key activeMode}
							<Mermaid chart={modes[activeMode].diagram} />
						{/key}
					</div>
					</div>
				</div>
			</div>
		</InView>
	</div>
</section>

<!-- The 202 Pattern -->
<section class="py-24 px-6">
	<div class="max-w-4xl mx-auto">
		<InView>
			<h2 class="text-3xl md:text-4xl font-bold text-center mb-4">One Pattern for Everything</h2>
			<p class="text-center text-[var(--color-text-muted)] max-w-2xl mx-auto mb-12 text-lg">
				<code class="font-mono text-[var(--color-agent)] bg-[var(--color-bg-code)] px-2 py-1 rounded">202 Accepted</code>
				+ polling handles immediate grants, user consent, headless agents, enterprise approval, and clarification chat.
			</p>
		</InView>

		<InView>
			<div class="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] overflow-hidden">
				<div class="px-5 py-3 border-b border-[var(--color-border)] flex items-center gap-2">
					<div class="w-3 h-3 rounded-full bg-red-500/50"></div>
					<div class="w-3 h-3 rounded-full bg-yellow-500/50"></div>
					<div class="w-3 h-3 rounded-full bg-green-500/50"></div>
					<span class="text-xs text-[var(--color-text-dim)] ml-2 font-mono">aauth-flow.http</span>
				</div>
				<div class="p-6 font-mono text-sm leading-loose">
					<div class="mb-4">
						<span class="text-[var(--color-agent)]">POST</span>
						<span class="text-[var(--color-text-muted)]"> /api/resource </span>
						<span class="text-[var(--color-text-dim)]">HTTP/1.1</span>
						<br />
						<span class="text-[var(--color-text-dim)]">Signature-Key: sig=jwt; jwt="eyJ...agent-token"</span>
						<br />
						<span class="text-[var(--color-text-dim)]">Signature: sig1=:base64...:</span>
					</div>

					<div class="mb-4 pl-4 border-l-2 border-[var(--color-resource)]">
						<span class="text-[var(--color-resource)]">&larr; 202 Accepted</span>
						<br />
						<span class="text-[var(--color-text-dim)]">Location: /pending/abc123</span>
						<br />
						<span class="text-[var(--color-text-dim)]">AAuth-Requirement: requirement=interaction;</span>
						<br />
						<span class="text-[var(--color-text-dim)]">  url="https://resource.example/consent/abc"; code="ABCD1234"</span>
					</div>

					<div class="mb-4">
						<span class="text-[var(--color-agent)]">GET</span>
						<span class="text-[var(--color-text-muted)]"> /pending/abc123</span>
					</div>

					<div class="pl-4 border-l-2 border-[var(--color-resource)]">
						<span class="text-[var(--color-resource)]">&larr; 200 OK</span>
						<br />
						<span class="text-[var(--color-text-dim)]">AAuth-Access: opaque-access-token</span>
					</div>
				</div>
			</div>
		</InView>
	</div>
</section>

<!-- Specifications -->
<section id="specs" class="py-24 px-6">
	<div class="max-w-4xl mx-auto">
		<InView>
			<h2 class="text-3xl md:text-4xl font-bold text-center mb-4">Specifications</h2>
			<p class="text-center text-[var(--color-text-muted)] max-w-2xl mx-auto mb-12 text-lg">
				AAuth is defined as IETF Internet-Drafts.
			</p>
		</InView>

		<div bind:this={layersEl} class="space-y-4 max-w-3xl mx-auto">
			{#each specs as spec, i}
				{@const delay = i * 150}
				<a
					href={spec.href}
					target="_blank"
					rel="noopener"
					class="block rounded-xl border bg-[var(--color-bg-card)] hover:border-[var(--color-border-hover)] transition-all duration-500 no-underline
						{spec.primary ? 'border-[var(--color-accent)]/40' : 'border-[var(--color-border)]'}
						{layersVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}"
					style="transition-delay: {delay}ms"
				>
					<div class="px-6 py-5">
						<div class="flex items-center justify-between mb-2">
							<span class="font-semibold {spec.primary ? 'text-lg' : ''}">{spec.name}</span>
							<span
								class="text-xs font-medium px-2.5 py-1 rounded-full
									{spec.status === 'Internet-Draft'
									? 'bg-blue-500/10 text-blue-400'
									: 'bg-amber-500/10 text-amber-400'}"
							>
								{spec.status}
							</span>
						</div>
						<p class="text-sm text-[var(--color-text-muted)] leading-relaxed">{spec.desc}</p>
					</div>
				</a>
			{/each}
		</div>
	</div>
</section>

<!-- Get Started -->
<section id="get-started" class="py-24 px-6">
	<div class="max-w-6xl mx-auto">
		<InView>
			<h2 class="text-3xl md:text-4xl font-bold text-center mb-4">Get Started</h2>
			<p class="text-center text-[var(--color-text-muted)] max-w-2xl mx-auto mb-12 text-lg">
				Implementations and demos across platforms.
			</p>
		</InView>

		<div
			class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto"
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
						class="glow-card block h-full p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] no-underline hover:scale-[1.02]"
					>
						<h3 class="font-semibold mb-1 flex items-center gap-2">
							<img
								src={`https://cdn.simpleicons.org/${platform.icon}/e4e4ed`}
								alt=""
								width="18"
								height="18"
								class="inline-block"
							/>
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

	</div>
</section>

<!-- Deep Dives -->
<section class="py-24 px-6">
	<div class="max-w-4xl mx-auto">
		<InView>
			<h2 class="text-3xl md:text-4xl font-bold text-center mb-4">Deep Dives</h2>
			<p class="text-center text-[var(--color-text-muted)] max-w-2xl mx-auto mb-12 text-lg">
				Articles and demos from the community.
			</p>
		</InView>

		<InView>
			<div
				class="space-y-3"
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
						class="glow-card block p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] no-underline hover:scale-[1.02]"
					>
						<div class="flex items-start justify-between gap-4 mb-1">
							<h3 class="font-semibold">{post.title}</h3>
							<span class="text-xs text-[var(--color-text-dim)] shrink-0 mt-1 font-mono">{post.date}</span>
						</div>
						<p class="text-sm text-[var(--color-text-muted)]">{post.author} — {post.desc}</p>
					</a>
				{/each}
			</div>
		</InView>
	</div>
</section>

<!-- Contribute -->
<section class="py-20 px-6">
	<div class="max-w-3xl mx-auto text-center">
		<InView>
			<h2 class="text-2xl md:text-3xl font-bold mb-3">Contribute</h2>
			<p class="text-[var(--color-text-muted)] mb-6">
				Found something missing or want to help improve AAuth?
			</p>
			<div class="flex justify-center gap-4 flex-wrap">
				<a
					href="https://github.com/hellocoop/aauth.dev/issues"
					target="_blank"
					rel="noopener"
					class="text-sm text-[var(--color-accent)] hover:underline"
				>
					Open an issue
				</a>
				<span class="text-[var(--color-text-dim)]">&middot;</span>
				<a
					href="https://github.com/hellocoop/aauth.dev"
					target="_blank"
					rel="noopener"
					class="text-sm text-[var(--color-accent)] hover:underline"
				>
					Submit a PR
				</a>
			</div>
		</InView>
	</div>
</section>

<!-- Footer -->
<footer class="py-16 px-6 border-t border-[var(--color-border)]">
	<div class="max-w-6xl mx-auto">
		<div class="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
			<div>
				<span class="font-mono font-bold text-lg">AAuth</span>
				<p class="text-sm text-[var(--color-text-muted)] mt-2 max-w-xs">
					Agent identity, resource access, and user delegation
					for open ecosystems.
				</p>
				<p class="text-sm text-[var(--color-text-muted)] mt-3">
					Founding sponsor: <a href="https://www.linkedin.com/in/geffenpo/" target="_blank" rel="noopener" class="hover:text-white transition-colors">Geffen Posner</a>
				</p>
			</div>
			<div class="flex gap-12 text-sm">
				<div class="space-y-3">
					<h4 class="font-semibold text-[var(--color-text-dim)] uppercase tracking-wider text-xs">Protocol</h4>
					<a href="#specs" class="block text-[var(--color-text-muted)] hover:text-white transition-colors no-underline">Specifications</a>
					<a href="https://playground.aauth.dev" class="block text-[var(--color-text-muted)] hover:text-white transition-colors no-underline">Playground</a>
					<a href="/llms.txt" class="block text-[var(--color-text-muted)] hover:text-white transition-colors no-underline font-mono">llms.txt</a>
				</div>
				<div class="space-y-3">
					<h4 class="font-semibold text-[var(--color-text-dim)] uppercase tracking-wider text-xs">Community</h4>
					<a href="https://github.com/dickhardt/AAuth" target="_blank" rel="noopener" class="block text-[var(--color-text-muted)] hover:text-white transition-colors no-underline">Spec GitHub</a>
					<a href="https://github.com/hellocoop/AAuth" target="_blank" rel="noopener" class="block text-[var(--color-text-muted)] hover:text-white transition-colors no-underline">Implementation</a>
					<a href="https://github.com/hellocoop/aauth.dev/issues" target="_blank" rel="noopener" class="block text-[var(--color-text-muted)] hover:text-white transition-colors no-underline">Contribute</a>
				</div>
			</div>
		</div>
	</div>
</footer>
