# AAuth.ai Website Proposal

## Overview

Public website for the AAuth protocol family at **aauth.ai**, hosted on Cloudflare Pages. The site serves as the authoritative resource for understanding, adopting, and implementing AAuth — the authentication and authorization protocol for autonomous agents.

AAuth.ai has its own visual identity, separate from Hellō branding.

## Audience

1. **Decision-makers & architects** evaluating agent auth approaches
2. **Developers** building AAuth implementations
3. **Standards community** following the IETF drafts
4. **AI/agent ecosystem** participants (MCP servers, agent frameworks, etc.)

## Tech Stack

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Framework | **Next.js 13 + Nextra** | Same stack as hello.dev — team familiarity, proven, great for docs |
| Styling | **Tailwind CSS** | Consistent with hello.dev |
| Hosting | **Cloudflare Pages** | Domain is registered at Cloudflare, zero-config deployment, global CDN |
| Analytics | **Cloudflare Web Analytics** | Free, built-in, privacy-friendly, no extra setup |
| Build | **Static export** (`output: 'export'`) | No server needed, fast, cacheable |
| CI/CD | **Cloudflare Pages GitHub integration** | Auto-deploy on push to `main`, preview deploys on PRs |

### Domain

Primary domain: **`aauth.ai`** (bare/apex). Redirect `www.aauth.ai` → `aauth.ai`.

Cloudflare technically recommends `www` as primary (cleaner CNAME), but bare domains are the industry norm and work fine with Cloudflare's CNAME flattening. A `_redirects` file handles the www → apex redirect.

## Site Structure

```
aauth.ai/
├── Home                        # Hero + value prop + quick links
├── /explainer                  # Non-technical overview (from aauth-explainer.md)
│   ├── Why AAuth               # Problem statement, what changed since OAuth
│   ├── How It Works            # Core concepts, flow diagrams
│   └── vs OAuth/OIDC           # Comparison tables
├── /specs                      # Specification family (links to authoritative sources)
│   ├── Overview                # Layered architecture diagram + links
│   ├── /signature-key          # → IETF Datatracker
│   ├── /headers                # → IETF Datatracker
│   ├── /protocol               # → IETF Datatracker
│   ├── /mission                # → dickhardt/AAuth editor's copy (exploratory)
│   └── /r3                     # → dickhardt/AAuth editor's copy (exploratory)
├── /demo                       # Interactive demos (see below)
│   ├── /agent                  # Demo AAuth agent
│   └── /resource               # Demo AAuth resource
├── /blog                       # External articles + community writing
├── /implementations            # Links to TypeScript impl, future SDKs
└── /community                  # Contributing, GitHub links, discussion
```

## Spec Pages — Links to Truth

The aauth.ai site does **not** host or sync spec content. Each spec page provides:

- A summary of what the layer does and the primitives it provides
- The layered architecture context (where it fits)
- Links to the authoritative source:

| Spec | Status | Authoritative Source |
|------|--------|---------------------|
| Signature-Key | Internet-Draft | [IETF Datatracker](https://datatracker.ietf.org/doc/draft-hardt-httpbis-signature-key/) |
| AAuth Headers | Internet-Draft | [IETF Datatracker](https://datatracker.ietf.org/doc/draft-hardt-aauth-headers) |
| AAuth Protocol | Internet-Draft | [IETF Datatracker](https://datatracker.ietf.org/doc/draft-hardt-aauth-protocol) |
| AAuth Mission | Exploratory | [Editor's Copy](https://dickhardt.github.io/AAuth/draft-hardt-aauth-mission.html) (dickhardt/AAuth) |
| AAuth R3 | Exploratory | [Editor's Copy](https://dickhardt.github.io/AAuth/draft-hardt-aauth-r3.html) (dickhardt/AAuth) |

## Content Sources

| Content | Source | Approach |
|---------|--------|----------|
| Explainer | `DickHardt/AAuth/aauth-explainer.md` | Adapt into multiple Nextra pages |
| Comparisons | `DickHardt/AAuth/comparison-klrc-aauth.md` | Adapt into explainer section |
| Blog/articles | External posts (see below) | Link cards with summaries |
| Implementation | `hellocoop/AAuth` | Links and getting-started guides |

## Blog / External Articles

Curated links to articles about AAuth and agent auth, organized by author.

### Christian Posta (blog.christianposta.com)

**AAuth Deep Dives:**
- [Deep Dive AAuth — Identity and Access Management for AI Agents](https://blog.christianposta.com/exploring-aauth-agent-auth-identity-and-access-management-for-ai-agents/)
- [AAuth Full Demo](https://blog.christianposta.com/aauth-full-demo/) — Working demo with Keycloak, Agentgateway, Java/Python/Rust
  - [Agent Identity with JWKS](https://blog.christianposta.com/aauth-full-demo/agent-identity-jwks.html)
  - [Agent Authorization (Autonomous)](https://blog.christianposta.com/aauth-full-demo/agent-authorization-autonomous.html)
  - [Agent Authorization (On Behalf Of)](https://blog.christianposta.com/aauth-full-demo/agent-authorization-on-behalf-of.html)
  - [Apply Policy with Agentgateway](https://blog.christianposta.com/aauth-full-demo/apply-policy-agentgateway.html)

**Agent Identity & Auth Series:**
- [Do AI Agents Need Their Own Identity?](https://blog.christianposta.com/do-we-even-need-agent-identity/)
- [AI Agent Delegation — You Can't Delegate What You Don't Control](https://blog.christianposta.com/cracks-in-our-identity-foundations/)
- [Explaining OAuth Delegation, "On Behalf Of", and Agent Identity for AI Agents](https://blog.christianposta.com/explaining-on-behalf-of-for-ai-agents/)
- [Configuring A2A OAuth User Delegation](https://blog.christianposta.com/setting-up-a2a-oauth-user-delegation/)
- [Inbound Auth for Agentcore With Agentgateway](https://blog.christianposta.com/inbound-auth-for-agentcore-with-agentgateway/)
- [Mitigate Prompt Injection Attacks With A2AS and Agentgateway](https://blog.christianposta.com/mitigate-prompt-injection-attacks-with-a2as-and-agentgateway/)

### Karl McGuinness (notes in DickHardt/AAuth)

Seven-part series on agent authority and delegation — foundational thinking behind AAuth:
1. Agents Don't Need Your Passport
2. From Passports to Power of Attorney
3. Governing the Stay
4. Mission-Bound OAuth
5. Client Context and ID JAG
6. Mission Architecture on AAuth
7. Why Mission-Bound OAuth Might Be Wrong

These could be published as blog posts on aauth.ai with Karl's permission, or linked if published elsewhere.

## Interactive Demos

Rather than abstract developer tools, the site hosts live demos that show AAuth in action:

### Demo Agent
A browser-based AAuth agent that demonstrates:
- Generating an ephemeral key pair (Web Crypto API)
- Self-publishing agent metadata at a well-known URL
- Signing HTTP requests with HTTP Message Signatures
- Requesting and receiving tokens through the AAuth flow
- Progressive trust escalation (pseudonym → identity → interaction → approval)

The demo walks through each step with visible HTTP messages, headers, and token contents so developers can see exactly what happens on the wire.

### Demo Resource
A browser-based AAuth resource that demonstrates:
- Publishing resource metadata
- Responding with `AAuth-Requirement` headers at different levels
- Issuing resource tokens (access challenges)
- Verifying signed requests and validating auth tokens

Together, the Demo Agent and Demo Resource form an end-to-end walkthrough: the agent calls the resource, gets challenged, obtains authorization, and completes the request — all visible in the browser.

Both demos run entirely client-side using Web Crypto API. No backend required.

## Home Page Design

```
┌─────────────────────────────────────────────┐
│  AAuth                                      │
│                                             │
│  Authentication & Authorization             │
│  for Autonomous Agents                      │
│                                             │
│  [Read the Explainer]  [View the Specs]     │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ No Pre-  │ │ Proof of │ │ Async by │   │
│  │ Registr. │ │ Possess. │ │ Design   │   │
│  │          │ │          │ │          │   │
│  │ Agents   │ │ Every    │ │ 202 +    │   │
│  │ self-pub │ │ request  │ │ polling  │   │
│  │ identity │ │ is signed│ │ for all  │   │
│  └──────────┘ └──────────┘ └──────────┘   │
│                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │Progress. │ │ Resource │ │ Multi-   │   │
│  │ Trust    │ │ Identity │ │ Hop      │   │
│  │          │ │          │ │          │   │
│  │ Escalate │ │ Resources│ │ Call     │   │
│  │ as needed│ │ sign too │ │ chaining │   │
│  └──────────┘ └──────────┘ └──────────┘   │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  Specification Layers                       │
│  ┌─────────────────────────────────────┐   │
│  │ Mission (4a) │ R3 (4b)              │   │
│  ├─────────────────────────────────────┤   │
│  │ Protocol (3)                        │   │
│  ├─────────────────────────────────────┤   │
│  │ AAuth Headers (2)                   │   │
│  ├─────────────────────────────────────┤   │
│  │ Signature-Key (1)                   │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  [Try the Demo]  [GitHub]  [TypeScript]    │
└─────────────────────────────────────────────┘
```

## Build & Deploy Pipeline

```
GitHub Push (main)
       │
       ▼
Cloudflare Pages (auto-build)
       │
       ├── npm run build (Next.js static export)
       │
       ▼
Cloudflare CDN (aauth.ai)
```

### PR Preview Deployments
Every PR gets a preview URL at `<hash>.aauth-ai.pages.dev` automatically via Cloudflare Pages.

## Phased Rollout

### Phase 1: Foundation
- [ ] Scaffold Nextra project with Cloudflare Pages deployment
- [ ] AAuth branding (logo, colors, typography)
- [ ] Home page with hero, value props, spec layer diagram
- [ ] Explainer content adapted from aauth-explainer.md
- [ ] Spec overview page with links to authoritative sources
- [ ] Basic SEO, favicon, OG tags
- [ ] Cloudflare Web Analytics snippet

### Phase 2: Content & Community
- [ ] OAuth/OIDC comparison pages (adapted from explainer)
- [ ] Blog/articles page with Christian Posta and Karl McGuinness links
- [ ] Implementation page linking to hellocoop/AAuth
- [ ] Community/contributing page

### Phase 3: Interactive Demos
- [ ] Demo Agent (client-side AAuth agent walkthrough)
- [ ] Demo Resource (client-side AAuth resource walkthrough)
- [ ] End-to-end flow demonstration

### Phase 4: Polish
- [ ] Search (Nextra built-in)
- [ ] RSS feed for blog
- [ ] Markdown export for MCP consumption (like hello.dev)
- [ ] `_redirects` for www → apex

## Maintenance Model

- Content updates via PRs to hellocoop/aauth.ai
- Spec links point to authoritative sources — no syncing needed
- Blog/articles: add link cards as new external posts appear
- Demos: self-contained React components, updated as protocol evolves
