AAuth is an HTTP authorization protocol that lets agents call protected resources on your behalf using signed requests instead of bearer tokens. The spec is at https://datatracker.ietf.org/doc/html/draft-hardt-oauth-aauth-protocol — consult it for any protocol detail. This prompt walks an agent through generating a signing keypair, publishing the public key, making a signed call with consent, and (optionally) uninstalling.

## Narration rules

You are running this walkthrough live in front of a user who wants to *learn* how AAuth works. State the goal of each section up front, run the command, surface the event JSON as it arrives, and let each event's own `description` field do the explaining. Don't editorialize and don't paraphrase descriptions.

- **Front-load each section.** Before each major section (Setup, Signed call, Uninstall), tell the user in one or two sentences what they're about to see. Include the consent warning in the Signed-call front-loader: it pauses for a browser approval.
- **Render each event the same way.** Description as a blockquote (`> …`) on its own line, then a fenced ` ```json ` block containing the `request` or `response` payload. For info events: the blockquote plus any named fields the event carries.
- **Show the `consent_poll` events too.** They're the agent polling the person server while the human decides — render each pair like any other request/response (JWTs elided per the rule below). Pending polls return `202`; the *final* poll returns `200` and its body carries the freshly issued `auth_token` — that response is where the person server mints the token, so don't bury it.
- **Elide repeated long JWTs by token role.** There are three token roles in this flow, each ~500+ chars:
  - **agent-token** — the `signature-key` JWT in `agent_token_request`, `ps_token_request`, `consent_poll`.
  - **resource-token** — appears in `ps_token_request`'s `aauth-requirement` response header and in the request body's `resource_token` field. Issued by the resource on its 401.
  - **auth-token** — first appears as `auth_token` in the final `consent_poll` 200 response body, then as the `signature-key` JWT in `auth_token_request`. Person-issued, appears after the user approves.

  Render the *first* JWT of each role verbatim — it IS the substance of that step. Subsequent JWTs of the same role elide to `"…agent-token…"` / `"…resource-token…"` / `"…auth-token…"`. You don't need to decode anything; the `step` name and field name tell you which role is in flight.
- **Don't leave background work running between turns.** If you started a background fetch, the task notification fires when it exits — no manual cleanup needed. Don't start a separate `tail -f` or polling loop.
- **Deliverables must end the turn.** Text emitted before a tool call in the same turn may never be displayed. The punchline and recap are the payoff of the whole walkthrough — they must be the *final* text of a turn, with no tool calls after them. Never follow the recap with an interactive question tool in the same turn; that swallows everything above it. Step 4's Keep/Uninstall question belongs in a *later* turn, after the user says they're done exploring.

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

Render two events: the `agent_token_request` request, then its response. Source them from the log file (path on the first stdout line) — stdout shows the same content but the log is canonical, so use it consistently across both calls. The response body is the punchline: the resource saw your `sub` — the agent identity — via the signature alone, no AS round-trip.

### Second call (background; pauses for consent)

`--prompt-consent` forces a consent prompt even if consent is already on file, so the user sees the full interactive flow. Run it in the background with a generous timeout (`600000` ms — humans take minutes to approve):

```
npx @aauth/fetch --explain --prompt-consent "https://whoami.aauth.dev?scope=openid+profile"
```

### Where to read events

Every `--explain` run writes its event stream as JSONL to `~/.aauth/fetch/logs/<ISO-timestamp>.log` — one JSON object per line. The command's stdout is a colorized preview; the log file is canonical, so read events from the log.

The log filename is the launch time, so the path is deterministic — don't scrape the command's stdout or tail its output file. List `~/.aauth/fetch/logs/` and take the newest `.log` file created after you launched (ISO names sort lexicographically). For the background call:

1. List the logs directory and capture the new file's path.
2. Poll the log until the `interaction_required` event appears, then render everything up through that event as the CTA.
3. Wait for the task notification (fetch exits when consent is granted and the final call returns).
4. After the notification, re-read the log and render everything after `interaction_required`: each `consent_poll` pair (202s while the human decided, then the 200 whose body carries the issued `auth_token`), and the final `auth_token_request` request/response pair.

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

### The recap

After the punchline, close with a "What just happened" section: one line per HTTP exchange of the consent flow, in order, naming who called whom, which token rode in the request, and what came back — the whole dance at a glance. Annotate each line from what actually appeared in the events; don't invent detail. Format:

```
1. agent → resource         signed w/ agent-token           → 401 + resource-token (scope, agent binding)
2. agent → person server    resource-token, prompt=consent  → 202 pending + approval code
3. person → person server   approves in browser
4. agent → person server    poll                            → 200 + auth-token (person-issued, key-bound)
5. agent → resource         signed w/ auth-token            → 200 + person claims
```

The recap ends the turn — no tool calls after it. Close with a plain-text invitation: ask if they'd like to try anything again (another signed call, a re-run with different scope) or have questions about what they saw. Then stop. Step 4 waits until the user signals they're done exploring.

## 4. Uninstall (optional — only if we installed in step 2)

**If step 1's `list` already showed an `agentProvider`, stop here.** The user had this identity before the walkthrough started; uninstalling now would throw away keys we didn't make. Do not ask. The walkthrough is done.

**If we ran setup in step 2,** wait until the user signals they're done exploring (the recap's closing invitation gives them room to re-run calls or ask questions first), then ask once whether to keep or remove. Ask at the *start* of that turn — never in a turn that also carries content the user needs to read. **Default: keep installed** — they just proved it works, and the keys are useful next time. Uninstall is the second option, for users who explicitly want to return to a clean state.

If they choose uninstall:

```
npx @aauth/bootstrap skill uninstall
```

The skill is self-contained. Your Keep/Uninstall question above counts as the skill's confirmation — don't re-ask "Proceed?" when you get there; just show the consequence statement and run the teardown. Verify the world-state change rather than trusting exit codes: after remote deletion, confirm `/.well-known/jwks.json` returns 404; after local key deletion, confirm `list` shows `agentProviders: []`.
