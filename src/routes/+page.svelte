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
			desc: 'A server representing the user decides which tools the agent may call and audits every call — no resource involved.',
			color: 'var(--color-as)'
		},
		{
			title: 'Missions',
			desc: 'The agent states what it intends to do. The user reviews, clarifies, and approves. Every access is evaluated in that context.',
			color: 'var(--color-ps)'
		},
		{
			title: 'Cross-Domain Federation',
			desc: 'Authorization crosses trust domains seamlessly — the agent never has to know about each separate server.',
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
    R-->>A: 202<br/>(interaction required)
    Note over A,R: user completes interaction
    A->>R: GET pending URL
    R-->>A: 200 OK<br/>AAuth-Access:<br/>opaque-token
    A->>R: HTTPSig w/ agent token<br/>Authorization:<br/>AAuth opaque-token
    R-->>A: 200 OK`
		},
		{
			name: 'PS-Managed',
			parties: 'Agent + Resource + PS',
			desc: 'Resource issues a resource token. PS issues an auth token carrying user identity and scope.',
			diagram: `sequenceDiagram
${participants}
    A->>R: HTTPSig w/ agent token<br/>POST /authorize
    R-->>A: resource_token<br/>(aud = PS URL)
    A->>P: HTTPSig w/ agent token<br/>POST /token<br/>w/ resource_token
    P-->>A: auth_token
    A->>R: HTTPSig w/ auth_token<br/>GET /api/documents
    R-->>A: 200 OK`
		},
		{
			name: 'Federated',
			parties: 'Agent + Resource + PS + AS',
			desc: 'Resource has its own Access Server. PS federates with AS to obtain the auth token across trust domains.',
			diagram: `sequenceDiagram
${participants}
    A->>R: HTTPSig w/ agent token<br/>POST /authorize
    R-->>A: resource_token<br/>(aud = AS URL)
    A->>P: HTTPSig w/ agent token<br/>POST /token<br/>w/ resource_token
    P->>S: HTTPSig w/ jwks_uri<br/>POST /token<br/>w/ resource_token
    S-->>P: auth_token
    P-->>A: auth_token
    A->>R: HTTPSig w/ auth_token<br/>GET /api/documents
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
			name: 'Playground',
			iconGlyph: '>',
			desc: 'Interactive in-browser demo of signed requests and access modes.',
			href: 'https://playground.aauth.dev',
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

	const authorAvatars = {
		'Christian Posta': '/authors/christian-posta.jpg',
		'Karl McGuinness': '/authors/karl-mcguinness.png'
	};
</script>

<Nav />

<!-- Hero (pinned — content below scrolls over it) -->
<section class="sticky top-0 h-screen flex items-center justify-center px-6 pt-16 overflow-hidden z-0">
	<div class="absolute inset-0 opacity-25 pointer-events-none">
		<PrismaticBurst
			intensity={1.8}
			speed={0.4}
			animationType="rotate3d"
			distort={1.5}
			rayCount={0}
			colors={['#4ade80', '#38bdf8', '#a78bfa']}
		/>
	</div>

	<div class="relative z-10 max-w-4xl mx-auto text-center">
		<h1 class="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1] uppercase">
			HTTP Clients Need <span class="text-[var(--color-accent)]">Their Own Identity</span>
		</h1>
		<p class="text-xl md:text-2xl text-[var(--color-text-muted)] max-w-3xl mx-auto mb-12 leading-relaxed">
			AAuth gives every agent its own cryptographic identity.<br class="hidden sm:inline" />
			No pre-registration. No shared secrets. No bearer tokens.
		</p>
		<!-- <p class="text-lg text-[var(--color-text-dim)] max-w-2xl mx-auto mb-12 leading-relaxed">
			A domain, static metadata, and a JWKS. That's it. This is the foundation
			that authorization, governance, and federation build on.
		</p> -->

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
				href="#get-started"
				onmouseenter={() => getStartedTrigger++}
				class="font-display inline-flex items-center justify-center gap-2 px-7 py-3.5 w-full sm:w-auto rounded-lg border border-[var(--color-accent)] text-[var(--color-accent)] font-medium no-underline"
			>
				<DecryptText text="Get Started" trigger={getStartedTrigger} />
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

<!-- Scrolling content covers the fixed hero background -->
<div class="relative z-10 bg-[var(--color-bg)] shadow-[0_-24px_48px_-12px_rgba(0,0,0,0.8)]">

<!-- Agents Are Different -->
<section id="compare" class="py-14 md:py-24 px-6">
	<div class="max-w-6xl mx-auto">
		<InView>
			<h2 class="text-3xl md:text-4xl font-bold text-center mb-4 uppercase">Agents Are Different</h2>
			<p class="text-center text-[var(--color-text-muted)] max-w-4xl mx-auto mb-16 text-lg">
				Agents discover resources at runtime and need authorization mid-task.<br class="hidden sm:inline" />
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
<section class="py-14 md:py-24 px-6">
	<div class="max-w-5xl mx-auto">
		<InView>
			<h2 class="text-3xl md:text-4xl font-bold text-center mb-4 uppercase">Why Not OAuth or API Keys?</h2>
			<p class="text-center text-[var(--color-text-muted)] max-w-4xl mx-auto mb-12 text-lg">
				The two credential models agents inherit today were designed for a different shape of client.
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
						<div><dt class="text-[var(--color-text-dim)]">Credential</dt><dd>Client secret or PKCE + bearer token</dd></div>
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
			<p class="text-xs text-center text-[var(--color-text-dim)] mt-4 font-mono">
				PS = Person Server &middot; AS = Access Server
			</p>
		</InView>
	</div>
</section>

<!-- How AAuth Works -->
<section id="how-it-works" class="py-14 md:py-24 px-6">
	<div class="max-w-6xl mx-auto">
		<InView>
			<h2 class="text-3xl md:text-4xl font-bold text-center mb-4 uppercase">How AAuth Works</h2>
			<p class="text-center text-[var(--color-text-muted)] max-w-2xl mx-auto mb-4 text-lg">
				Four access modes. Each adds parties and capabilities.<br class="hidden sm:inline" />
				Adoption does not require coordination between parties.
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
						<p class="text-[var(--color-text-muted)] mb-6">{modes[activeMode].desc}</p>
						<div class="bg-[var(--color-bg-code)] rounded-lg p-5 min-h-[470px] overflow-x-auto md:overflow-hidden">
							{#each modes as mode, i}
								<div class="w-full {i === activeMode ? '' : 'hidden'}">
									<Mermaid chart={mode.diagram} />
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>
			<div class="mt-4 text-xs text-center text-[var(--color-text-dim)] space-y-1 font-mono">
				<p>
					<span class="text-[var(--color-text-muted)]">agent_token</span> establishes the agent's identity &middot;
					<span class="text-[var(--color-text-muted)]">resource_token</span> describes the access needed &middot;
					<span class="text-[var(--color-text-muted)]">auth_token</span> grants an agent access to a resource
				</p>
				<p>PS = Person Server &middot; AS = Access Server</p>
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


<!-- Specifications -->
<section id="specs" class="py-14 md:py-24 px-6">
	<div class="max-w-4xl mx-auto">
		<InView>
			<h2 class="text-3xl md:text-4xl font-bold text-center mb-4 uppercase">Specifications</h2>
			<p class="text-center text-[var(--color-text-muted)] max-w-3xl mx-auto mb-12 text-lg">
				<span class="text-[var(--color-text)]">AAuth Protocol</span> defines tokens, access modes, and federation. It builds on <span class="text-[var(--color-text)] whitespace-nowrap">HTTP Signature Keys</span> for key conveyance and message signatures.
			</p>
		</InView>

		<div
			bind:this={layersEl}
			class="space-y-4 max-w-3xl mx-auto"
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
			{#each specs as spec, i}
				{@const delay = i * 150}
				<a
					href={spec.href}
					target="_blank"
					rel="noopener"
					class="glow-card block rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] transition-transform duration-200 no-underline hover:scale-[1.02]
						{spec.indent ? 'ml-8 md:ml-12' : ''}
						{layersVisible ? 'spec-reveal' : 'opacity-0'}"
					style="--reveal-delay: {delay}ms"
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
<section id="get-started" class="py-14 md:py-24 px-6">
	<div class="max-w-6xl mx-auto">
		<InView>
			<h2 class="text-3xl md:text-4xl font-bold text-center mb-4 uppercase">Get Started</h2>
			<p class="text-center text-[var(--color-text-muted)] max-w-2xl mx-auto mb-12 text-lg">
				Implementations and demos across platforms.
			</p>
		</InView>

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
							{#if platform.iconGlyph}
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

	</div>
</section>

<!-- Deep Dives -->
<section class="py-14 md:py-24 px-6">
	<div class="max-w-4xl mx-auto">
		<InView>
			<h2 class="text-3xl md:text-4xl font-bold text-center mb-4 uppercase">Deep Dives</h2>
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

<!-- Contribute -->
<section class="py-12 md:py-20 px-6">
	<div class="max-w-3xl mx-auto text-center">
		<InView>
			<h2 class="text-2xl md:text-3xl font-bold mb-3 uppercase">Contribute</h2>
			<p class="text-[var(--color-text-muted)] mb-6">
				See something to improve?
			</p>
			<a
				href="https://github.com/hellocoop/aauth.dev/edit/main/src/routes/+page.svelte"
				target="_blank"
				rel="noopener"
				onmouseenter={() => issueTrigger++}
				class="text-sm text-[var(--color-accent)] hover:underline"
			>
				<DecryptText text="Edit this page on GitHub ↗" trigger={issueTrigger} />
			</a>
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
					Agent identity, resource access, and user delegation for open ecosystems.
				</p>
				<p class="text-sm text-[var(--color-text-muted)] mt-3">
					Founding sponsor: <a href="https://www.linkedin.com/in/geffenpo/" target="_blank" rel="noopener" class="hover:text-white transition-colors">Geffen Posner</a>
				</p>
			</div>
			<div class="flex gap-12 text-sm flex-wrap">
				<div class="space-y-3">
					<h4 class="font-semibold text-[var(--color-text-dim)] uppercase tracking-wider text-xs">Learn</h4>
					<a href="#compare" class="block text-[var(--color-text-muted)] hover:text-white transition-colors no-underline">Why AAuth</a>
					<a href="#how-it-works" class="block text-[var(--color-text-muted)] hover:text-white transition-colors no-underline">How It Works</a>
					<a href="#specs" class="block text-[var(--color-text-muted)] hover:text-white transition-colors no-underline">Specifications</a>
				</div>
				<div class="space-y-3">
					<h4 class="font-semibold text-[var(--color-text-dim)] uppercase tracking-wider text-xs">Get Started</h4>
					<a href="https://github.com/hellocoop/AAuth" target="_blank" rel="noopener" class="block text-[var(--color-text-muted)] hover:text-white transition-colors no-underline">Node.js / TypeScript ↗</a>
					<a href="https://github.com/christian-posta/aauth-full-demo" target="_blank" rel="noopener" class="block text-[var(--color-text-muted)] hover:text-white transition-colors no-underline">Python ↗</a>
					<a href="https://playground.aauth.dev" target="_blank" rel="noopener" class="block text-[var(--color-text-muted)] hover:text-white transition-colors no-underline">Playground ↗</a>
				</div>
				<div class="space-y-3">
					<h4 class="font-semibold text-[var(--color-text-dim)] uppercase tracking-wider text-xs">Site</h4>
					<a href="/llms.txt" class="block text-[var(--color-text-muted)] hover:text-white transition-colors no-underline font-mono">llms.txt</a>
					<a href="https://github.com/hellocoop/aauth.dev/edit/main/src/routes/+page.svelte" target="_blank" rel="noopener" class="block text-[var(--color-text-muted)] hover:text-white transition-colors no-underline">Edit this page ↗</a>
				</div>
			</div>
		</div>
	</div>
</footer>

</div>
