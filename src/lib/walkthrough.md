AAuth is an HTTP authorization protocol that lets agents call protected resources on your behalf using signed requests instead of bearer tokens. The spec is at https://datatracker.ietf.org/doc/html/draft-hardt-oauth-aauth-protocol — consult it for any protocol detail. This prompt walks an agent through generating a signing keypair, publishing the public key, making signed calls, and (optionally) uninstalling.

## Narration rules

You are running this walkthrough live in front of a user who wants to *learn* how AAuth works. State the goal of each section up front, run the command, surface the event JSON as it arrives, and let each event's own `description` field do the explaining. Don't editorialize, don't paraphrase descriptions, don't write a recap — the last response IS the ending.

- **Front-load each section.** Before each major section (Setup, Signed call, Uninstall), tell the user in one or two sentences what they're about to see. Include the consent warning in the Signed-call front-loader: the second call will pause for a browser approval.
- **Render each event the same way.** Description as a blockquote (`> …`) on its own line, then a fenced ` ```json ` block containing ONLY the value of `request` or `response` (not the `{ step, description, … }` wrapper). For info events: just the blockquote line and any extra fields the event carries (see below). Render every event as it arrives — including repeats like `consent_poll`. The polls are the protocol's heartbeat while waiting on the human; don't suppress them.
- **Elide repeated long JWTs.** The first event's `signature-key` JWT renders verbatim — it IS the substance of the step. On reuse, elide identical JWTs to `jwt="…agent-token…"` (or `"…auth-token…"` once the auth token is in play) so each render shows what's new, not 700 chars of the same token.
- **Don't leave background work running between turns.** Any background task you started must be stopped before you hand control back.

## `--explain` event shape

Every line of the log is one JSON object (JSONL). Each object is keyed by `step` and is one of:

- **Request event** — `{ step, description, request: { method, url, headers, body? } }`.
- **Response event** — `{ step, response: { status, headers, body? } }`. Pairs with the immediately preceding request by `step`. No `description` — the request's description framed the step.
- **Info event** — `{ step, description, …named fields }`. Info events may carry additional top-level fields documented per step: e.g. `requirement_parsed` carries `requirement`; `interaction_required` carries `url`, `code`, `approval_url`, `qr`.

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
  "description": "Direct the person to the approval URL — show them the QR or open the link.",
  "url": "https://person.hello.coop/auth",
  "code": "AuArIT7O",
  "approval_url": "https://person.hello.coop/auth?code=AuArIT7O",
  "qr": "▄▄▄▄…\n…"
}
```

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

After publish, verify the world-state change rather than trusting an exit code: poll both `/.well-known/jwks.json` and `/.well-known/aauth-agent.json` at the agent URL until they return 200.

For a brand-new `username.github.io` repo, the first Pages deploy can 401 silently from `actions/deploy-pages` (the `pages-build-deployment` Action fails but the Pages API reports `status: building` indefinitely). If polling hasn't gone green within ~2 minutes, check the Actions run with `gh run list --repo <user>/<user>.github.io` and re-queue with `gh api -X POST /repos/<user>/<user>.github.io/pages/builds` — the second build picks up the existing artifact and deploys.

## 3. Make a signed call

**Tell the user up front:** you're going to make two calls. The first proves signed auth works *without* any person authorization — `whoami` echoes the agent identity the resource sees. The second adds person-authorization, and **will pause for you to approve in your browser** — have your phone or browser ready.

First call (foreground; returns in well under a second):

```
npx @aauth/fetch --explain https://whoami.aauth.dev
```

Then the consent-prompted call. **Run it in the background** with a generous timeout (`600000` ms — humans take minutes to approve):

```
npx @aauth/fetch --explain --prompt-consent "https://whoami.aauth.dev?scope=openid+profile"
```

`--prompt-consent` forces a consent prompt at the user's Person Server even if consent is already on file.

**Where to read events:** every `--explain` run writes its event stream as JSONL to `~/.aauth/fetch/logs/<ISO-timestamp>.log` — one JSON object per line, nothing else. The command's stdout is a colorized preview; the log file is canonical, so read events from the log. For the foreground call, read the log after the command returns. For the background call, the task notification fires when fetch exits — read the log once at that point. No `tail -f` is needed; the fetch's exit is your "events are done" signal.

The log path is also printed on the command's first stdout line (`Logging --explain events to …`). Capture it from that line instead of guessing the newest file in `~/.aauth/fetch/logs/` — that directory may have older logs from prior runs.

### The consent moment

When the `interaction_required` event arrives, render the CTA from the event's own fields — no assembly required:

- A bold heading (e.g. `**👉 Action needed: approve the consent**`)
- `approval_url` on its own line, raw and clickable
- `code` on its own line
- `qr` inside a fenced code block with no language tag (fences preserve the block characters in monospace)
- One line telling them you're waiting and will resume when they approve

Then continue rendering events as they arrive — the `consent_poll` request/response pairs are the protocol's heartbeat while the person decides. Resume normal pacing at `auth_token_received` and the final `auth_token_request`; the response body of that last call is the punchline.

## 4. Uninstall (optional)

Uninstall is destructive; the walkthrough's purpose is "see it work," not "tear it down". Hand off to the uninstall skill — it builds the consequence statement from `list` and asks once before doing anything, so don't pre-ask here:

```
npx @aauth/bootstrap skill uninstall
```

The skill is self-contained — follow it. Verify the world-state change rather than trusting exit codes: after remote deletion, confirm `/.well-known/jwks.json` returns 404; after local key deletion, confirm `list` shows `agentProviders: []`.
