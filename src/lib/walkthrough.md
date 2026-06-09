AAuth is an HTTP authorization protocol that lets agents call protected resources on your behalf using signed requests instead of bearer tokens. The spec is at https://datatracker.ietf.org/doc/html/draft-hardt-oauth-aauth-protocol — consult it for any protocol detail. This prompt walks an agent through generating a signing keypair, publishing the public key, making signed calls, and (optionally) uninstalling.

## Narration rules

You are running this walkthrough live in front of a user who wants to *learn* how AAuth works. Your job is to make each protocol step legible: state the goal up front, run the command, surface the event JSON as it arrives, and let each event's own `description` field do the explaining. Don't editorialize.

Concrete rules:

- **Front-load each section.** Before each major section (Setup, Signed call, Consent flow, Uninstall), tell the user in one or two sentences what they're about to see. The consent section specifically must warn that the second call will pause for them to approve in a browser — a surprise QR code is a bad UX.
- **The event's `description` field IS the header.** Each `--explain` event arrives as a JSON object that carries its own one-line `description`. Render that line on its own above the JSON block (use a `>` quote or italics — just make it visually distinct), then the JSON in a fenced block. No "Step N —" prefix, no second sentence of your own paraphrase. Add narration ONLY when something needs framing the description can't carry (e.g. pointing at a specific field, or "this is the first time the resource has seen us") — one short sentence max.
- **Stream events as they arrive — but don't worry about perfect timing.** A fast flow may emit all its events within a second; render them in arrival order without a separate recap. The pedagogy is each step appearing in the chat *as the protocol executes it*, not a tidy summary at the end. Never collect every event and write an end-of-flow recap.
- **Don't leave background work running between turns.** Any background task or monitor you start in service of a step must be stopped before you ask the next question, hand control to the user, or end the turn. The user should never inherit a running task from a previous step.

## `--explain` event shape

Each event is a single JSON object keyed by `step`, carrying exactly ONE of: a `request` body, a `response` body, or a top-level `description` (info events).

```json
{
  "step": "agent_token_request",
  "description": "Call the resource with your agent token — self-asserted identity, no person authorization yet.",
  "request": {
    "method": "GET",
    "url": "https://whoami.aauth.dev",
    "headers": { "signature": "sig=:…:", "signature-input": "…", "signature-key": "sig=jwt;jwt=\"…\"" }
  }
}
```

```json
{
  "step": "agent_token_request",
  "response": { "status": 200, "headers": { "content-type": "application/json" }, "body": { "sub": "aauth:local@…", "ps": "https://person.…" } }
}
```

```json
{
  "step": "consent_required",
  "description": "Consent required — opening the approval URL for the person."
}
```

A response object pairs with the immediately preceding request by `step`; render them as two distinct events. Response events have no `description` — the request's description already framed the step, and the `status` + `body` carry the rest. **Do NOT re-print the final response body at the end of the walkthrough** — it's already on screen in the last event.

## 1. Check for existing setup

```
npx @aauth/bootstrap list
```

If a keypair is already set up, name what's there in one line (agent URL, keystore, person server) and skip to step 3.

## 2. Set up (if nothing exists)

```
npx @aauth/bootstrap skill setup
```

Follow the skill. It generates a keypair, asks where to publish the public key (a JWKS file at an HTTPS URL — GitHub Pages, GitLab Pages, Cloudflare Pages, etc.), and verifies it's reachable.

## 3. Make a signed call

**Tell the user up front:** you're going to make two calls. The first proves signed auth works *without* any person authorization — `whoami` echoes the agent identity the resource sees. The second adds person-authorization, and **will pause for you to approve in your browser** — have your phone or browser ready.

First call:

```
npx @aauth/fetch --explain https://whoami.aauth.dev
```

Then the consent-prompted call:

```
npx @aauth/fetch --explain --prompt-consent "https://whoami.aauth.dev?scope=openid+profile"
```

`--prompt-consent` forces a consent prompt at the user's Person Server even if consent is already on file.

**How to run the consent flow:** `--explain` events (including the URL, code, and QR) are written to **stderr**; only the final response body goes to stdout. The command blocks until the human approves — minutes is normal — but the URL/QR appear within seconds. Run the command in the background (capturing both streams, e.g. `2>&1`), tail the captured output, and watch for the `Approve at:` line.

### The consent moment — make it loud

When `Approve at:` appears in the captured output, **stop streaming raw events** and surface a single, visually distinct call to action:

- A bold heading (e.g. `**👉 Action needed: approve the consent**`)
- The approval URL on its own line, raw and clickable
- The short code on its own line
- The QR ASCII inside a fenced code block (no language tag — fences preserve the block characters in monospace)
- One line telling them you'll wait and resume automatically once they approve

Then **go silent**. Do not narrate `consent_poll` events as they arrive — they are noise during the wait. Resume narration only when the auth_token arrives (the "person approved" moment) and the resource is re-called with the auth token.

## 4. Uninstall (optional)

Ask the user once whether they want to uninstall. If yes:

```
npx @aauth/bootstrap skill uninstall
```

Follow the skill. It removes the published JWKS from the hosting platform (by loading the platform's `-uninstall` skill — e.g. `github-pages-uninstall`), then deletes the local signing keys and config. It asks for ONE confirmation that names every consequence; do not stack additional questions in front of it.

**Report each destructive step by its world-state change, not the command you ran.** After remote deletion: *"JWKS at \<url\> now returns 404 — resources can no longer verify signatures from this agent."* After local key deletion: confirm `list` shows `agentProviders: []`. A successful `git push` is not proof of remote teardown; a 404 is. Block on these checks before moving on.
