AAuth is an HTTP authorization protocol that lets agents call protected resources on your behalf using signed requests instead of bearer tokens. The spec is at https://datatracker.ietf.org/doc/html/draft-hardt-oauth-aauth-protocol — consult it for any protocol detail. This prompt walks an agent through generating a signing keypair, publishing the public key, making a signed call with consent, and (optionally) uninstalling.

## Narration rules

You are running this walkthrough live in front of a user who wants to *learn* how AAuth works. State the goal of each section up front, run the command, surface the event JSON as it arrives, and let each event's own `description` field do the explaining. Don't editorialize, don't paraphrase descriptions, don't write a recap — the last response IS the ending.

- **Front-load each section.** Before each major section (Setup, Signed call, Uninstall), tell the user in one or two sentences what they're about to see. Include the consent warning in the Signed-call front-loader: it pauses for a browser approval.
- **Render each event the same way.** Description as a blockquote (`> …`) on its own line, then a fenced ` ```json ` block containing the `request` or `response` payload. For info events: the blockquote plus any named fields the event carries.
- **Skip `consent_poll` events.** They're the protocol's heartbeat (the agent polling the person server while the human decides). They're protocol machinery, not teaching surface — render the `interaction_required` CTA, then jump straight to the final `auth_token_request` once consent lands.
- **Elide repeated long JWTs by step.** Render the first JWT in an `agent_token_request` verbatim — it IS the substance of the step. Subsequent agent-token JWTs (in `ps_token_request`, `consent_poll`, etc.) elide to `jwt="…agent-token…"`. Render the first JWT in an `auth_token_request` verbatim too — it's a different token (person-issued). Subsequent auth-token JWTs elide to `jwt="…auth-token…"`. You don't need to decode anything: the `step` name tells you which token is in flight.
- **Don't leave background work running between turns.** If you started a background fetch, the task notification fires when it exits — no manual cleanup needed. Don't start a separate `tail -f` or polling loop.

## `--explain` event shape

Every line of the log is one JSON object (JSONL). Each object is keyed by `step` and is one of:

- **Request event** — `{ step, description, request: { method, url, headers, body? } }`. `method` is always present.
- **Response event** — `{ step, response: { status, headers, body? } }`. Pairs with the immediately preceding request by `step`. No `description` — the request's description framed the step.
- **Info event** — `{ step, description?, …named fields }`. `description` appears once per step; subsequent same-step info events drop it (so a heartbeat doesn't reprint the teaching line). Named fields per step:
  - `requirement_parsed` → `requirement`
  - `interaction_required` → `url`, `code`, `approval_url`, `qr`

```json
{
  "step": "agent_token_request",
  "description": "Call the resource with your agent token.",
  "request": {
    "method": "GET",
    "url": "https://whoami.aauth.dev",
    "headers": { "signature": "sig=:…:", "signature-input": "…", "signature-key": "sig=jwt;jwt=\"…\"" }
  }
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

If `agentProviders` is non-empty, the user already has an identity set up — name what's there in one line (agent URL, keystore, person server), **skip to step 3**, and remember this for step 4: do NOT offer uninstall, because we didn't install it this run.

## 2. Set up (if nothing exists)

```
npx @aauth/bootstrap skill setup
```

The skill is self-contained — follow it. It ends with a `npx @aauth/fetch https://whoami.aauth.dev` verify step that proves the install works end-to-end. Don't continue to step 3 until that returns your `sub`.

## 3. Make signed calls — two of them

**Front-load:** you'll make two calls, both with `--explain` so the user can see every protocol step. Both hit `whoami`, which echoes who is calling.

1. **First call — agent identity only.** Returns instantly. The signature alone proves who the agent is; no person server, no authorization server, no consent. This is the "I am this agent" baseline.
2. **Second call — adds person authorization.** Forces a consent prompt at the person server. **Pauses for browser approval** — have your browser ready.

### First call (foreground; sub-second)

```
npx @aauth/fetch --explain https://whoami.aauth.dev
```

Read the log file (path on the first stdout line) and render the two events: the `agent_token_request` request, then its response. The response body is the punchline: the resource saw your `sub` — the agent identity — via the signature alone, no AS round-trip.

### Second call (background; pauses for consent)

`--prompt-consent` forces a consent prompt even if consent is already on file, so the user sees the full interactive flow. Run it in the background with a generous timeout (`600000` ms — humans take minutes to approve):

```
npx @aauth/fetch --explain --prompt-consent "https://whoami.aauth.dev?scope=openid+profile"
```

### Where to read events

Every `--explain` run writes its event stream as JSONL to `~/.aauth/fetch/logs/<ISO-timestamp>.log` — one JSON object per line. The command's stdout is a colorized preview; the log file is canonical, so read events from the log.

The log path is printed on the command's first stdout line (`Logging --explain events to …`). For the background call:

1. Wait for that first stdout line, then capture the path.
2. Poll the log until the `interaction_required` event appears, then render everything up through that event as the CTA.
3. Wait for the task notification (fetch exits when consent is granted and the final call returns).
4. After the notification, re-read the log and render only the final `auth_token_request` request/response pair. **Skip every `consent_poll` event** — they were heartbeat while you were waiting; rendering them after the fact is noise.

### The consent moment

When the `interaction_required` event arrives, render the CTA from the event's own fields — no assembly required:

```
### 👉 Action needed — approve the consent
```

Then on the lines below the heading:

- `approval_url` raw and clickable
- `code` on its own line
- `qr` inside a fenced code block with no language tag (fences preserve the block characters in monospace)
- One line telling them you're waiting and will resume when they approve

### The punchline

When fetch exits, the log ends with one `auth_token_request` request/response pair. Render those two events. The response body — `sub`, `agent`, `tenant`, `name`, `email` — is the punchline: the resource now sees both who is calling (`agent`) and on whose behalf (`sub` + claims vouched by the person server).

## 4. Uninstall (optional — only if we installed in step 2)

**If step 1's `list` already showed an `agentProvider`, stop here.** The user had this identity before the walkthrough started; uninstalling now would throw away keys we didn't make. Do not ask. The walkthrough is done.

**If we ran setup in step 2,** ask the user once whether to keep or remove. **Default: keep installed** — they just proved it works, and the keys are useful next time. Uninstall is the second option, for users who explicitly want to return to a clean state.

If they choose uninstall:

```
npx @aauth/bootstrap skill uninstall
```

The skill is self-contained. Verify the world-state change rather than trusting exit codes: after remote deletion, confirm `/.well-known/jwks.json` returns 404; after local key deletion, confirm `list` shows `agentProviders: []`.
