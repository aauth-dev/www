# AAuth

## Software Is Changing

Clients used to be written. Now agents assemble them at runtime. The protocols underneath weren't built for that.

- [Try the demo](https://playground.aauth.dev)
- [Protocol Explorer](https://explorer.aauth.dev)

## What Changed

Software used to know at build time what it would call and what it would need. Now agents decide in the moment, against services they've never seen — the old protocols assumed neither.

- **Client IDs Don't Travel** — In OAuth and OIDC, a client has no independent identity — a `client_id` at Google is meaningless at GitHub. Agents have no identity of their own to carry between services.
- **Copied Secrets Leak** — API keys are a shared secret issued by the service and copied to the client. Any secret copied to a workload will eventually leak somewhere it shouldn't.
- **Decisions Happen Mid-Task** — Agents need authorization decisions mid-task. Consent lands on human timelines — and today's protocols treat pending as an error, not a first-class state.
- **Tool Chains Assemble Live** — Agents pick their tool chain at runtime, one call at a time. The sequence isn't declared in code — they choose the next tool as the task unfolds, and the chain shifts with every task.
- **Scopes Don't Capture Intent** — A scope is standing permission, not per-call intent. `mail.read` looks the same whether the agent is summarizing or scraping — policy can't tell them apart.
- **Calls Cross Trust Domains** — A single task can span orgs, clouds, and identity domains. Workload identity (SPIFFE) stops at the trust-domain edge — and authority stops there too.

## Why AAuth?

*By [Dick Hardt](https://www.linkedin.com/in/dickhardt), author of OAuth 2.0*

After implementing authorization for our MCP server, I concluded [OAuth is not a good fit for MCP](https://www.linkedin.com/feed/update/urn:li:activity:7358178115673616384/) and started working with others in the identity community who'd hit the same walls.

AAuth is what came out of that work. It gives every HTTP client its own cryptographic identity and carries identity claims and authorization claims in the same token. It coexists with OAuth 2.0 and OpenID Connect rather than replacing them.

The web gave servers identity. It's time clients got the same.

## How AAuth Works

AAuth has four access modes. The simplest replaces API keys; each adds parties and capabilities. Adopt any mode independently.

| Mode | Parties | Description |
|------|---------|-------------|
| Identity-Based | Agent + Resource | Agent signs every request. Resource verifies identity and applies its own access control. Replaces API keys. |
| Resource-Managed | Agent + Resource | Resource handles authorization itself — via user interaction, consent, or an existing OAuth / OIDC provider. |
| Person Server (PS) Managed | Agent + Resource + PS | Access is brokered by a server representing the user — the Person Server (PS). It handles consent and issues the auth token; the resource stays focused on its API. |
| Federated | Agent + Resource + PS + Access Server (AS) | Internet-scale mode for cross-organization access. Resource has its own Access Server (AS); PS federates with AS across trust domains to obtain the auth token. |

### Identity-Based

```
Agent  → Resource:  HTTPSig w/ agent_token
Agent  ← Resource:  200 OK
```

### Resource-Managed

```
Agent  → Resource:  HTTPSig w/ agent_token
Agent  ← Resource:  202 (interaction required)
                    [user completes interaction]
Agent  → Resource:  GET pending URL
Agent  ← Resource:  200 OK, AAuth-Access: opaque-token
Agent  → Resource:  HTTPSig w/ agent_token, Authorization: AAuth opaque-token
Agent  ← Resource:  200 OK
```

### Person Server (PS) Managed

```
Agent  → Resource:  HTTPSig w/ agent_token, POST /authorize
Agent  ← Resource:  resource_token (aud = PS URL)
Agent  → PS:        HTTPSig w/ agent_token, POST /token w/ resource_token
Agent  ← PS:        auth_token
Agent  → Resource:  HTTPSig w/ auth_token, GET /api/documents
Agent  ← Resource:  200 OK
```

### Federated

```
Agent  → Resource:  HTTPSig w/ agent_token, POST /authorize
Agent  ← Resource:  resource_token (aud = AS URL)
Agent  → PS:        HTTPSig w/ agent_token, POST /token w/ resource_token
PS     → AS:        HTTPSig w/ jwks_uri, POST /token w/ resource_token
PS     ← AS:        auth_token
Agent  ← PS:        auth_token
Agent  → Resource:  HTTPSig w/ auth_token, GET /api/documents
Agent  ← Resource:  200 OK
```

Token glossary:

- `agent_token` establishes the agent's identity
- `resource_token` describes the access needed
- `auth_token` grants an agent access to a resource
- `jwks_uri` Person Server (PS)'s JWKS endpoint, discovered via well-known metadata

## Explore AAuth

Try the protocol, explore the SDKs, and follow the conversation. The demos run against the Hellō Beta Person Server — data is reset regularly, so don't store anything you need to keep.

### Demos

| Demo | Description | Links |
|------|-------------|-------|
| Protocol Explorer | Browse AAuth access modes, tokens, and headers with side-by-side wire examples. | [Open Explorer](https://explorer.aauth.dev) |
| whoami.aauth.dev | A minimal AAuth identity resource — one endpoint that returns who the caller is. | [Try it](https://playground.aauth.dev) · [Source](https://github.com/aauth-dev/whoami) |
| notes.aauth.dev | A notes API using [AAuth R3](https://github.com/dickhardt/AAuth/blob/main/draft-hardt-aauth-r3.md). Agents declare OpenAPI operations; consent is over actions, not endpoints. | [Try it](https://playground.aauth.dev) · [Source](https://github.com/aauth-dev/notes) |

### Platforms

| Platform | Description | Repository |
|----------|-------------|------------|
| Specifications | The Internet-Drafts defining the AAuth protocol and signatures. | [github.com/dickhardt/AAuth](https://github.com/dickhardt/AAuth) |
| Node.js SDK | Reference SDK for agents and MCP servers with signed-request auth. | [github.com/aauth-dev/packages-js](https://github.com/aauth-dev/packages-js) |
| Python Demo Source | End-to-end A2A multi-agent flow with Keycloak and user consent. | [github.com/christian-posta/aauth-full-demo](https://github.com/christian-posta/aauth-full-demo) |
| .NET SDK | Reference SDK and samples for .NET agents and MCP servers with signed-request auth. | [github.com/aauth-dev/dotnet-samples](https://github.com/aauth-dev/dotnet-samples) |

### Deep Dives

| Date | Author | Post |
|------|--------|------|
| 2026-04-28 | Mark Hendrickson | [Know Which of Your Agents Wrote What](https://markmhendrickson.com/posts/know-which-of-your-agents-wrote-what/) — Per-row attribution for agent writes via AAuth identity in Neotoma |
| 2026-04-15 | Karl McGuinness | [AAuth Now Has a Mission Layer](https://www.linkedin.com/pulse/aauth-now-has-mission-layer-karl-mcguinness-uhqjc/) — Mission is now a first-class protocol object — is the layer strong enough? |
| 2026-03-31 | Christian Posta | [AAuth Full Demo](https://blog.christianposta.com/aauth-full-demo/) — Working demo with Keycloak, Agentgateway, Java/Python/Rust |
| 2026-03-21 | Karl McGuinness | [Open-World OAuth Still Needs Mission Shaping](https://notes.karlmcguinness.com/notes/open-world-oauth-still-needs-mission-shaping/) — Open-world OAuth, discovery, and bounded authority across delegation chains |
| 2026-03-15 | Karl McGuinness | [Mission Architecture on AAuth](https://notes.karlmcguinness.com/notes/mission-architecture-on-aauth/) — Whether AAuth is the right protocol foundation for mission-bound authorization |
| 2026-02-17 | Christian Posta | [Deep Dive AAuth — Identity and Access Management for AI Agents](https://blog.christianposta.com/exploring-aauth-agent-auth-identity-and-access-management-for-ai-agents/) — Comprehensive overview of AAuth architecture and design |
| 2025-06-02 | Christian Posta | [Do AI Agents Need Their Own Identity?](https://blog.christianposta.com/do-we-even-need-agent-identity/) — The case for independent agent identity |

## Community

Join the discussion on Slack.

- [IETF Slack](https://www.aauth.dev/ietf-slack) — IETF #aauth channel for AAuth specification discussion and feedback.
- [AAuth Slack](https://www.aauth.dev/slack) — AAuth community Slack for implementation discussion and questions.

## Office Hours

Drop in to ask questions, share what you're building, or listen along. Sign up at [lu.ma/aauth](https://lu.ma/aauth).

## Specifications

| Spec | Status | Description |
|------|--------|-------------|
| [AAuth Protocol](https://datatracker.ietf.org/doc/draft-hardt-aauth-protocol) ([editor's copy](https://dickhardt.github.io/AAuth/draft-hardt-aauth-protocol.html)) | Internet-Draft | The authorization protocol for agent-to-resource access. Four access modes, three token types, agent governance, missions, clarification chat, and call chaining. |
| [HTTP Signature Keys](https://datatracker.ietf.org/doc/draft-hardt-httpbis-signature-key/) ([editor's copy](https://dickhardt.github.io/signature-key/draft-hardt-httpbis-signature-key.html)) | Internet-Draft | Foundation layer. Well-known key discovery, the Signature-Key header for conveying public keying material alongside HTTP Message Signatures. |
| [R3 — Rich Resource Requests](https://dickhardt.github.io/AAuth/draft-hardt-aauth-r3.html) | Exploratory | Vocabulary-based authorization using formats agents already understand (MCP, OpenAPI, gRPC, GraphQL). |

## Links

- Founding sponsor: [Geffen Posner](https://www.linkedin.com/in/geffenpo/)
- [AAuth Website](https://www.aauth.dev)
- [Specification Source (GitHub)](https://github.com/dickhardt/AAuth)
- [Website Source (GitHub)](https://github.com/hellocoop/aauth.dev)
- [llms.txt](https://www.aauth.dev/llms.txt)
