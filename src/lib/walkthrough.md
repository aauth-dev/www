AAuth is an HTTP authorization protocol that lets agents call protected resources on your behalf using signed requests instead of bearer tokens. The spec is at https://datatracker.ietf.org/doc/html/draft-hardt-aauth-protocol — consult it for any protocol detail. This prompt walks an agent through generating a signing keypair, publishing the public key, making signed calls, and (optionally) uninstalling.

**Narrate as you go.** Explain each step to the user *as you reach it* — one short sentence on what you're about to do and why, run the command, then show the resulting JSON. Don't save the explanation for the end. For fetch, use each `--explain` event's `description` verbatim and show its raw JSON, and end with the resource's response body.

## 1. Check for existing setup

```
npx @aauth/bootstrap list
```

If a keypair is already set up, say what's there and skip to step 3.

## 2. Set up (if nothing exists)

```
npx @aauth/bootstrap skill setup
```

Follow the skill step-by-step. It generates a keypair, asks where to publish the public key (a JWKS file at an HTTPS URL — GitHub Pages, GitLab Pages, Cloudflare Pages, etc.), and verifies it's reachable.

## 3. Make a signed call

Verify a signed request works:

```
npx @aauth/fetch --explain https://whoami.aauth.dev
```

Then request identity claims with a forced consent prompt:

```
npx @aauth/fetch --explain --force-consent "https://whoami.aauth.dev?scope=openid+profile"
```

`whoami` echoes back the identity claims the resource sees. `--force-consent` defers the call to the user's Person Server for approval — fetch outputs an **interaction URL**, a short **code**, and a **QR code**. Show the user the URL and QR, offer to open the URL or have them scan the QR with their phone, then wait — fetch resumes automatically once they approve. End with the resource's response body.

## 4. Uninstall (optional)

Prompt user if they want to uninstall.

```
npx @aauth/bootstrap skill uninstall
```

Follow the skill step-by-step. It removes the local signing keys and config, and explains how to delete the published JWKS from the hosting platform where possible.
