AAuth is an HTTP authorization protocol that lets agents call protected resources on your behalf using signed requests instead of bearer tokens. The spec is at https://datatracker.ietf.org/doc/html/draft-hardt-oauth-aauth-protocol — consult it for any protocol detail. This prompt walks an agent through generating a signing keypair, publishing the public key, making signed calls, and (optionally) uninstalling.

## Narration rules

You are running this walkthrough live in front of a user who wants to *learn* how AAuth works. Your job is to make each protocol step legible: state the goal up front, run the command, surface the event JSON as it arrives, and let each event's own `description` field do the explaining. Don't editorialize.

Concrete rules:

- **Front-load each section.** Before each major section (Setup, Signed call, Consent flow, Uninstall), tell the user in one or two sentences what they're about to see. The consent section specifically must warn that the second call will pause for them to approve in a browser — a surprise QR code is a bad UX.
- **The event's `description` field IS the header.** Each `--explain` event arrives as a JSON object that carries its own one-line `description`, written to align with the spec's vocabulary. Render that line on its own above the JSON block (use a `>` quote or italics — just make it visually distinct), then the JSON in a fenced block. No "Step N —" prefix, no second sentence of your own paraphrase. The descriptions are precise enough to stand alone; don't paraphrase them.
- **World-state, not commands.** When reporting what happened, name the change in the world (a file became reachable; a JWKS endpoint now returns 404; a key now exists in the keystore), not the command you ran. A successful exit code is not proof — verify the world-state change before moving on. Especially important for destructive steps.
- **Stream events as they arrive — but don't worry about perfect timing.** A fast flow may emit all its events within a second; render them in arrival order without a separate recap. The pedagogy is each step appearing in the chat *as the protocol executes it*, not a tidy summary at the end. Never collect every event and write an end-of-flow recap.
- **Don't leave background work running between turns.** Any background task or monitor you start in service of a step must be stopped before you ask the next question, hand control to the user, or end the turn. The user should never inherit a running task from a previous step.

## `--explain` event shape

Each event is a single JSON object keyed by `step`, carrying exactly ONE of: a `request` body, a `response` body, or a top-level `description` (info events).

```json
{
  "step": "agent_token_request",
  "description": "Call the resource with your agent token — identity-based access.",
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
  "step": "interaction_required",
  "description": "Direct the person to the interaction URL to approve. (URL + scannable QR follow on stderr for direct CLI users.)",
  "url": "https://person.hello.coop/auth",
  "code": "AuArIT7O"
}
```

A response object pairs with the immediately preceding request by `step`; render them as two distinct events. Response events have no `description` — the request's description already framed the step, and the `status` + `body` carry the rest. **Do NOT re-print the final response body at the end of the walkthrough** — it's already on screen in the last event.

The step vocabulary tracks the AAuth spec: `agent_token_request` and `auth_token_request` are named by the token in the `Signature-Key`; `requirement_parsed` reflects parsing the resource's `AAuth-Requirement` header; `ps_metadata` and `ps_token_request` refer to the person server's well-known metadata and `token_endpoint`; `interaction_required`, `consent_poll`, and `auth_token_received` cover the deferred-response cycle. Two internal steps (`signed_request` for the initial call, `retry_with_auth_token` for the post-consent retry) both display as a token-named step so the chat reads naturally.

## 1. Check for existing setup

```
npx @aauth/bootstrap list
```

If a keypair is already set up, name what's there in one line (agent URL, keystore, person server) and skip to step 3.

## 2. Set up (if nothing exists)

```
npx @aauth/bootstrap skill setup
```

Follow the skill. It generates a keypair, asks where to publish the public key (a JWKS file at an HTTPS URL — GitHub Pages, GitLab Pages, Cloudflare Pages, etc.), and verifies it's reachable. If `list` showed a backup pointing at a prior agent URL + hosting platform, default to reusing those — the skill handles the same-identity, fresh-keys case.

After the publish step, verify the world-state change: poll both `/.well-known/jwks.json` and `/.well-known/aauth-agent.json` at the agent URL until they return 200. A successful `git push` is not proof; a 200 is.

## 3. Make a signed call

**Tell the user up front:** you're going to make two calls. The first proves signed auth works *without* any person authorization — `whoami` echoes the agent identity the resource sees. The second adds person-authorization, and **will pause for you to approve in your browser** — have your phone or browser ready.

First call:

```
npx @aauth/fetch --explain https://whoami.aauth.dev
```

The first call's `agent_token_request` description names *identity-based access* — the resource recognized the agent token and returned 200. No person involved.

Then the consent-prompted call:

```
npx @aauth/fetch --explain --prompt-consent "https://whoami.aauth.dev?scope=openid+profile"
```

`--prompt-consent` forces a consent prompt at the user's Person Server even if consent is already on file.

**How to run the consent flow:** `--explain` events (including the URL, code, and QR) are written to **stderr**; only the final response body goes to stdout. The command blocks until the human approves — minutes is normal — but events flow within seconds. Run the command in the background (capturing both streams, e.g. `2>&1`), tail the captured output, and watch for the `interaction_required` event.

### The consent moment — make it loud

The `interaction_required` event is your CTA trigger. It carries the approval URL in its `url` field and the short code in its `code` field. The scannable QR ASCII follows immediately on stderr as the next non-JSON block (still in the captured output — it's there for direct CLI users, you'll inherit it for free).

When `interaction_required` arrives, **stop streaming raw events** and surface a single, visually distinct call to action:

- A bold heading (e.g. `**👉 Action needed: approve the consent**`)
- The `url` from the event, with `?code=<code>` appended, on its own line, raw and clickable
- The `code` from the event on its own line
- The QR ASCII (lifted from the stderr block right after the event) inside a fenced code block (no language tag — fences preserve the block characters in monospace)
- One line telling them you'll wait and resume automatically once they approve

Then **go silent**. Do not narrate `consent_poll` events as they arrive — they are the deferred-response polling loop and are noise during the wait. Resume narration only when `auth_token_received` arrives (the "person approved — auth token issued" moment) and the resource is re-called with the auth token. That final `auth_token_request` description names the protocol's punchline directly: the `Signature-Key` now carries a person-issued auth token instead of the agent token.

## 4. Uninstall (optional)

Ask the user once whether they want to uninstall. If yes:

```
npx @aauth/bootstrap skill uninstall
```

Follow the skill. It removes the published JWKS from the hosting platform (by loading the platform's `-uninstall` skill — e.g. `github-pages-uninstall`), then deletes the local signing keys and config. It asks for ONE confirmation that names every consequence; do not stack additional questions in front of it.

**Report each destructive step by its world-state change** (the general rule, applied here): after remote deletion, *"JWKS at \<url\> now returns 404 — resources can no longer verify signatures from this agent."* After local key deletion: confirm `list` shows `agentProviders: []`. A successful `git push` is not proof of remote teardown; a 404 is. Block on these checks before moving on.
