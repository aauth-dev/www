AAuth is an HTTP authorization protocol that lets agents call protected resources on your behalf using signed requests instead of bearer tokens. The spec is at https://datatracker.ietf.org/doc/html/draft-hardt-oauth-aauth-protocol — consult it for any protocol detail. This prompt walks an agent through generating a signing keypair, publishing the public key, making signed calls, and (optionally) uninstalling.

## Narration rules

You are running this walkthrough live in front of a user who wants to *learn* how AAuth works. Make each protocol step legible: state the goal up front, run the command, surface the event JSON as it arrives, and let each event's own `description` field do the explaining. Don't editorialize.

- **Front-load each section.** Before each major section (Setup, Signed call, Consent flow, Uninstall), tell the user in one or two sentences what they're about to see. The consent section specifically must warn that the second call will pause for them to approve in a browser — a surprise QR code is a bad UX.
- **The event's `description` IS the header; the body is `request` or `response`.** For request/response events, render the `description` on its own line above the JSON (a `>` quote or italics — just make it visually distinct), then a fenced JSON block containing ONLY the value of `request` or `response` (not the wrapper with `step`+`description`). For info-only events, render just the description line. Don't paraphrase the description, don't add "Step N —" prefixes, don't write an end-of-flow recap — the last response IS the ending.
- **World-state, not commands.** When reporting what happened, name the change in the world (a file became reachable; a JWKS endpoint now returns 404; a key now exists in the keystore), not the command you ran. A successful exit code or `git push` is not proof — verify the world-state change before moving on. Especially important for destructive steps.
- **Don't leave background work running between turns.** Any background task you started must be stopped before you ask the next question, hand control to the user, or end the turn. Wide filesystem scans count — check common paths directly before spawning a recursive `find`.

## `--explain` event shape

Each event is a single JSON object keyed by `step`, carrying exactly ONE of: a `request` body, a `response` body, or a top-level `description` (info events). `step` is stable across versions — safe for programmatic parsers.

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
  "description": "Direct the person to the interaction URL to approve.",
  "url": "https://person.hello.coop/auth",
  "code": "AuArIT7O"
}
```

A response object pairs with the immediately preceding request by `step`. Response events have no `description` — the request's description already framed the step.

## 1. Check for existing setup

```
npx @aauth/bootstrap list
```

If a keypair is already set up, name what's there in one line (agent URL, keystore, person server) and skip to step 3.

## 2. Set up (if nothing exists)

```
npx @aauth/bootstrap skill setup
```

The skill is self-contained — follow it. If `list` showed a backup pointing at a prior agent URL + hosting platform, default to reusing those.

After publish, verify the world-state change: poll both `/.well-known/jwks.json` and `/.well-known/aauth-agent.json` at the agent URL until they return 200.

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

**How to run the consent flow:** the CLI's first stdout line is `Logging --explain events to <path>` — `<path>` is under `~/.aauth/logs/fetch/`. Run the fetch in the background with a generous timeout (600000ms — humans take minutes to approve), then tail that log file for events. The QR ASCII is appended to the log right after `interaction_required`. Stderr carries the same QR for direct CLI users; only look there if events stop arriving in the log.

### The consent moment — make it loud

The `interaction_required` event is your CTA trigger. It carries the approval URL in its `url` field and the short code in its `code` field.

When `interaction_required` arrives, **stop streaming events** and surface a single, visually distinct call to action:

- A bold heading (e.g. `**👉 Action needed: approve the consent**`)
- The `url` from the event, with `?code=<code>` appended, on its own line, raw and clickable
- The `code` from the event on its own line
- The QR ASCII (lifted from the log right after the event) inside a fenced code block (no language tag — fences preserve the block characters in monospace)
- One line telling them you'll wait and resume automatically once they approve

Then **go silent**. Resume narration at `auth_token_received` and the subsequent `auth_token_request`. That final event's description names the protocol's punchline directly: the `Signature-Key` now carries a person-issued auth token instead of the agent token.

## 4. Uninstall (optional)

Ask the user once whether they want to uninstall — default to **Keep installed** (uninstall is destructive; the walkthrough's purpose is "see it work," not "tear it down"). If yes:

```
npx @aauth/bootstrap skill uninstall
```

The skill is self-contained — follow it. World-state verification matters extra here: after remote deletion, confirm `/.well-known/jwks.json` returns 404; after local key deletion, confirm `list` shows `agentProviders: []`.
