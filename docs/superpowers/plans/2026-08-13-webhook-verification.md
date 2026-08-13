# Webhook signature verification implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the webhook verification stub with a tested HS256 verifier based on Monime's official WordPress implementation.

**Architecture:** `WebhookModule.verifySignature` will parse the complete signature header, authenticate the exact raw body with Node's built-in crypto module, and decode JSON only after authentication succeeds. A dedicated error class will expose stable reasons without including sensitive input.

**Tech Stack:** Node.js 20+, ECMAScript modules, `node:crypto`, `node:test`, TypeScript declaration files, Biome.

## Global constraints

- Support HS256 only.
- Preserve exact request-body bytes and exact secret bytes.
- Default timestamp tolerance to 300 seconds.
- Add no dependency.
- Keep every commit independently reviewable and green.
- Write plain technical prose without promotional wording or unsupported claims.

---

### Task 1: Implement and test HS256 verification

**Files:**
- Modify: `package.json`
- Modify: `src/errors.js`
- Modify: `src/index.js`
- Modify: `src/index.d.ts`
- Modify: `src/webhook.js`
- Create: `test/webhook.test.js`

**Interfaces:**
- Consumes: the complete `Monime-Signature` header and exact raw request body.
- Produces: `WebhookModule.verifySignature(rawBody, signatureHeader, secret, options?)` and `MonimeWebhookVerificationError`.

- [ ] **Step 1: Generate an independent fixed vector**

Use OpenSSL to calculate standard Base64 HMAC-SHA-256 for a fixed secret and the bytes `<timestamp>_<rawBody>`. Record the literal signature in the test instead of calculating the expected value with production code.

- [ ] **Step 2: Write verifier tests**

Add tests for the fixed vector, `Buffer` input, modified bodies, wrong secrets, malformed headers, duplicate fields, malformed Base64, stale timestamps, future timestamps, and authenticated invalid JSON.

- [ ] **Step 3: Run the tests and confirm the stub fails**

Run: `node --test test/webhook.test.js`

Expected: failure because the current method always throws an unimplemented error.

- [ ] **Step 4: Implement the error contract and verifier**

Add `MonimeWebhookVerificationError` with a stable `reason`. Parse one canonical timestamp and one Base64 signature, enforce freshness, calculate HMAC-SHA-256 over exact bytes, compare with `timingSafeEqual`, then parse JSON.

- [ ] **Step 5: Add public declarations and exports**

Declare `WebhookEvent`, `VerifyWebhookSignatureOptions`, `WebhookVerificationErrorReason`, `WebhookModule.verifySignature`, and `MonimeWebhookVerificationError`. Export the new error from `src/index.js`.

- [ ] **Step 6: Verify and commit**

Run:

```bash
npm test
npm run typecheck
npm run format:check
npm run build
```

Commit:

```bash
git add package.json src test
git commit -m "feat(webhook): verify HS256 signatures"
```

### Task 2: Document secure webhook handling

**Files:**
- Modify: `docs/examples/webhook.md`
- Modify: `docs/examples/README.md`
- Modify: `src/webhook.js`

**Interfaces:**
- Consumes: the verifier implemented in Task 1.
- Produces: a framework-neutral usage example and accurate support notes.

- [ ] **Step 1: Replace stale verifier comments**

Document the supported HS256 protocol, evidence source, exact-body requirement, default tolerance, errors, and ES256 limitation.

- [ ] **Step 2: Add a handler example**

Show a handler passing the raw body, complete `Monime-Signature` value, and environment-provided HMAC secret to `verifySignature`. Do not include real credentials or imply that parsed and re-serialized JSON is safe.

- [ ] **Step 3: Humanize and verify the prose**

Remove filler, repeated warnings, unsupported confidence, and diff-oriented language. Keep source URLs and technical limitations intact.

- [ ] **Step 4: Verify and commit**

Run:

```bash
npm run format:check
npm run typecheck
npm test
```

Commit:

```bash
git add src/webhook.js docs/examples
git commit -m "docs(webhook): explain signature verification"
```

### Task 3: Final branch verification

**Files:**
- Review only.

**Interfaces:**
- Consumes: Tasks 1 and 2.
- Produces: a reviewable, clean feature branch.

- [ ] **Step 1: Review commit boundaries and diff**

Run:

```bash
git log --oneline main..HEAD
git diff --check main...HEAD
git diff --stat main...HEAD
```

- [ ] **Step 2: Run all repository checks**

Run:

```bash
npm test
npm run typecheck
npm run format:check
npm run build
npm audit --omit=dev
```

- [ ] **Step 3: Check for accidental secrets**

Inspect the complete branch diff for credential values and confirm `.env` remains ignored and untracked.
