# monimejs

`monimejs` is an unofficial, lightweight SDK that makes it easier to integrate Monime payments into your application without dealing with API requests directly.

![npm version](https://img.shields.io/npm/v/monimejs.svg)
![npm downloads](https://img.shields.io/npm/dm/monimejs.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-%3E=20-green.svg)
![License](https://img.shields.io/badge/license-Apache_2.0-lightgrey.svg)

---

## Table of Contents

- [What it includes](#what-it-includes)
- [Installation](#installation)
- [Credentials](#credentials)
- [Quick start](#quick-start)
- [Error handling](#error-handling)
- [Timeout & retry](#timeout--retry)
- [Rate limits](#rate-limits)
- [AbortController](#abortcontroller)
- [Idempotency](#idempotency)
- [Contributing](#contributing)
- [License](#license)

---

## What it includes

- One client for Monime's supported payment, account, payout, webhook, receipt, and provider APIs.
- Types and JSDoc for the public SDK surface.
- Configurable timeouts, retries, and request cancellation.
- Automatic idempotency keys for POST requests, with support for supplying your own.
- Typed errors for API, configuration, timeout, network, and webhook-verification failures.

---

## Installation

```bash
npm install monimejs
```

---

## Credentials

Keep credentials outside source control. For example, you can store them in a `.env` file:

```bash
MONIME_SPACE_ID=spc-your-space-id
MONIME_ACCESS_TOKEN=your-access-token
MONIME_WEBHOOK_SECRET=your-webhook-signing-secret
```

You can also provide them directly when creating the client.

---

## Quick start

### Create a client

```javascript
import { MonimeClient } from "monimejs";

const client = new MonimeClient({
  spaceId: process.env.MONIME_SPACE_ID,
  accessToken: process.env.MONIME_ACCESS_TOKEN,
  webhookSecret: process.env.MONIME_WEBHOOK_SECRET,
});
```

All client methods use these credentials automatically.

`spaceId` and `accessToken` are required. The SDK sends `Authorization`,
`Monime-Space-Id`, and a pinned `Monime-Version` header with every request. Set
`monimeVersion` in the client options if you need a different API release.

### Verify webhooks

Pass the exact raw request body and the `Monime-Signature` header value. The SDK
checks the signature and rejects timestamps more than five minutes from the
server clock before returning the decoded event.

```javascript
const event = client.webhook.verify(
  rawRequestBody,
  request.headers["monime-signature"],
);
```

### Create a payment code

```javascript
// Create a payment code
const { result: paymentCode } = await client.paymentCode.create({
  name: "Order #1234",
  amount: { currency: "SLE", value: 1000 },
});

// Get a payment code
const { result } = await client.paymentCode.get("pmc-xxx");

// List payment codes
const { result: codes, pagination } = await client.paymentCode.list({
  status: "pending",
  limit: 10,
});

// Update a payment code
await client.paymentCode.update("pmc-xxx", { name: "Updated Name" });

// Delete a payment code
await client.paymentCode.delete("pmc-xxx");
```

For the full SDK surface, see the type declarations in `dist/index.d.ts`. Monime's
[API reference](https://docs.monime.io/apis) is the authoritative source for API
contracts and business rules.

---

## Error handling

The SDK throws a typed error for each failure category.

Request payloads, IDs, and query parameters are sent to Monime without local
validation. `MonimeApiError` contains the authoritative Monime API error.
`MonimeValidationError` is reserved for invalid client execution options.

```javascript
import {
  MonimeClient,
  MonimeApiError,
  MonimeTimeoutError,
  MonimeValidationError,
  MonimeNetworkError,
} from "monimejs";

try {
  await client.paymentCode.get("pmc-xxx");
} catch (error) {
  if (error instanceof MonimeApiError) {
    // API returned an error (4xx, 5xx)
    console.log(error.code);    // HTTP status code
    console.log(error.reason);  // Error reason from API
    console.log(error.message); // Error message
  } else if (error instanceof MonimeTimeoutError) {
    // Request timed out
    console.log(error.timeout); // Timeout value in ms
  } else if (error instanceof MonimeValidationError) {
    // Client execution configuration is invalid
    console.log(error.issues);  // Array of client option issues
    error.issues.forEach((issue) => {
      console.log(`${issue.field}: ${issue.message}`);
    });
  } else if (error instanceof MonimeNetworkError) {
    // Network error (connection refused, DNS failure, etc.)
    console.log(error.cause);   // Original error
  }
}
```

---

## Timeout & retry

### Configuration

```javascript
const client = new MonimeClient({
  spaceId: process.env.MONIME_SPACE_ID,
  accessToken: process.env.MONIME_ACCESS_TOKEN,
  timeout: 30000,      // 30 seconds (default)
  retries: 2,          // Retry up to 2 times (default)
  retryDelay: 1000,    // Start with 1s delay (default)
  retryBackoff: 2,     // Double delay each retry (default)
});
```

### Per-Request Overrides

```javascript
// Longer timeout for slow operations
const { result, pagination } = await client.paymentCode.list({
  status: "pending",
  limit: 10,
}, {
  timeout: 60000,
});

// Disable retries for specific request
await client.paymentCode.create(input, {
  retries: 0,
});
```

The SDK retries:
- Network errors (connection reset, DNS failure)
- HTTP 429 (rate limited)
- HTTP 500, 502, 503, and 504 (server errors)

For a `429` response, it uses the `Retry-After` header when Monime provides one.

## Rate limits

Monime applies limits by Space, access token, and endpoint. Avoid tight polling
loops, especially for payment status. Use webhooks where they fit your flow, and
let the SDK back off after a `429` response. See Monime's
[rate-limit documentation](https://docs.monime.io/developer-resources/api-basics/rate-limiting)
for the current limits.

---

## AbortController

Cancel requests using the standard `AbortController` API:

```javascript
const controller = new AbortController();

// Start request
const promise = client.paymentCode.get("pmc-xxx", {
  signal: controller.signal,
});

// Cancel it
controller.abort();

// Handle cancellation
try {
  await promise;
} catch (error) {
  if (error.name === "AbortError") {
    console.log("Request was cancelled");
  }
}
```

---

## Idempotency

For POST endpoints, the SDK automatically adds an `Idempotency-Key` header. This
helps prevent duplicate requests when a call is retried. Keys are generated with
`crypto.randomUUID()` when you do not provide one.

For a retry that may continue after a timeout, restart, or worker failure, store
one key per logical operation and provide that same key on every retry:

```javascript
await client.paymentCode.create(input, {
  idempotencyKey: "payment-code-order-1234",
});
```

Monime evaluates idempotency keys within a Space and rejects reuse with a
different request. See the [Monime idempotency guide](https://docs.monime.io/developer-resources/api-basics/idempotency)
for details.

---

## Contributing

For detailed contribution guidelines, see [CONTRIBUTING.md](./CONTRIBUTING.md)

---

## License

Apache 2.0. See [LICENSE](./LICENSE).
