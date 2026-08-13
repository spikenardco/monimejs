# Implementation Reference

Technical details for contributors and those curious about how features are implemented.

---

## Architecture Overview

```
MonimeClient
├── bank: BankModule
├── financialAccount: FinancialAccountModule
├── financialTransaction: FinancialTransactionModule
├── paymentCode: PaymentCodeModule
├── payment: PaymentModule
├── checkoutSession: CheckoutSessionModule
├── payout: PayoutModule
├── webhook: WebhookModule
├── internalTransfer: InternalTransferModule
├── momo: MomoModule
├── receipt: ReceiptModule
└── ussdOtp: UssdOtpModule
    └── All modules use → MonimeHttpClient
                              ├── Timeout handling
                              ├── Retry with backoff
                              ├── AbortController support
                              └── Input validation
```

---

## 1. HTTP Client (`src/http-client.js`)

### Request Flow

```
request() → build_url() → build_headers() → execute_with_retry() → execute_request()
                                                      ↓
                                              Retry loop with backoff
                                                      ↓
                                              fetch() with combined signals
```

### Timeout Implementation

Uses manual `AbortController` + `setTimeout` (not `AbortSignal.timeout()` for cleanup control):

```javascript
const timeout_controller = new AbortController();
const timeout_id = setTimeout(() => timeout_controller.abort(), timeout);

try {
  await fetch(url, { signal: timeout_controller.signal });
} finally {
  clearTimeout(timeout_id); // Always cleanup
}
```

**Why not `AbortSignal.timeout()`?** We need to clear the timeout on success to prevent memory leaks in long-running processes.

### Signal Combination

Combines user signal + timeout signal using `AbortSignal.any()` (Node 20+):

```javascript
const signals = [timeout_controller.signal];
if (external_signal) signals.push(external_signal);
const combined = AbortSignal.any(signals);
```

After abort, we check which signal fired to throw the right error:
- `timeout_controller.signal.aborted` → `MonimeTimeoutError`
- `external_signal.aborted` → Re-throw `AbortError`

### Retry Logic

**Retryable conditions:**
- Network errors (`MonimeNetworkError`)
- HTTP 429, 500, 502, 503, 504

**Backoff formula:**
```javascript
delay = retryDelay * (retryBackoff ^ attempt) + random(0-500ms)
```

**Retry-After header:** Parsed from 429 responses, supports both seconds and HTTP-date formats.

### JSON Parsing Safety

```javascript
let data;
try {
  data = await res.json();
} catch {
  throw new MonimeApiError("Invalid JSON response...", res.status, "invalid_json", []);
}
```

Prevents crashes when server returns HTML error pages (proxies, CDNs).

---

## 2. Validation (`src/validation.js` + `src/schemas.js`)

### Schema Library

Uses [Valibot](https://valibot.dev/) (~10KB) for schema validation.

### Validation Points

| When | What | Schema |
|------|------|--------|
| Client init | `spaceId`, `accessToken`, `baseUrl` | `ClientOptionsSchema` |
| Before request | Resource IDs (`pmc-*`, `pay-*`, etc.) | `*IdSchema` |
| Before create | Input fields | `Create*InputSchema` |
| Before update | Update fields | `Update*InputSchema` |
| List params | `limit` (1-50) | `LimitSchema` |

### ID Prefix Validation

Each resource type has a required prefix:

| Resource | Prefix |
|----------|--------|
| Payment Code | `pmc-` |
| Payment | `pay-` |
| Checkout Session | `cos-` |
| Payout | `pot-` |
| Webhook | `whk-` |
| Internal Transfer | `trn-` |
| USSD OTP | `uop-` |

### HTTPS Enforcement

```javascript
if (options.baseUrl !== undefined && !options.baseUrl.startsWith("https://")) {
  throw new MonimeValidationError("baseUrl must use HTTPS for security", [
    {
      message: "baseUrl must use HTTPS for security",
      field: "baseUrl",
      value: options.baseUrl,
    },
  ]);
}
```

---

## 3. Error Classes (`src/errors.js`)

### Hierarchy

```
MonimeError (base)
├── MonimeApiError      - API returned 4xx/5xx
├── MonimeTimeoutError  - Request timed out
├── MonimeValidationError - Input validation failed
└── MonimeNetworkError  - Connection failed
```

### Prototype Fix

All error classes include prototype chain fix for proper `instanceof` checks:

```javascript
constructor(message) {
  super(message);
  Object.setPrototypeOf(this, new.target.prototype);
}
```

### Retryable Detection

```javascript
// MonimeApiError
get isRetryable() {
  return [429, 500, 502, 503, 504].includes(this.code);
}

// MonimeNetworkError
get isRetryable() {
  return true; // Network errors are always retryable
}
```

---

## 4. Module Pattern (`src/*-module.js`)

Each module follows the same pattern:

```javascript
export class XxxModule {
  /** @type {MonimeHttpClient} */
  http_client;

  /** @param {MonimeHttpClient} http_client */
  constructor(http_client) {
    this.http_client = http_client;
  }

  /**
   * @param {CreateXxxInput} input
   * @param {RequestConfig} [config]
   * @returns {Promise<XxxResponse>}
   */
  async create(input, config) {
    if (this.http_client.should_validate) {
      validate(CreateXxxInputSchema, input);
    }
    return this.http_client.request({
      method: "POST",
      path: "/xxx",
      body: input,
      config,
    });
  }

  async get(id, config) { /* validate ID, GET request */ }
  async list(params, config) { /* validate limit, GET with query params */ }
  async update(id, input, config) { /* validate ID + input, PATCH request */ }
  async delete(id, config) { /* validate ID, DELETE request */ }
}
```

### Idempotency Keys

Auto-generated for POST requests using `crypto.randomUUID()`:

```javascript
if (method === "POST") {
  headers["Idempotency-Key"] = idempotency_key ?? crypto.randomUUID();
}
```

**Note:** Idempotency keys are auto-generated internally in `http-client.js` and passed via `RequestConfig.idempotencyKey` from modules.

---

## 5. Type System (`src/types.ts`)

### Response Wrappers

```javascript
/**
 * @template T
 * @typedef {object} ApiResponse
 * @property {boolean} success
 * @property {string[]} messages
 * @property {T} result
 */

/**
 * @template T
 * @typedef {object} ApiListResponse
 * @property {boolean} success
 * @property {string[]} messages
 * @property {T[]} result
 * @property {PaginationInfo} pagination
 */

/**
 * @typedef {object} ApiDeleteResponse
 * @property {boolean} success
 * @property {string[]} messages
 */
```

### Client Configuration

```javascript
/**
 * @typedef {object} ClientOptions
 * @property {string} spaceId - Required, must start with "spc-"
 * @property {string} accessToken - Required
 * @property {string} [baseUrl] - Default: "https://api.monime.io"
 * @property {number} [timeout] - Default: 30000ms
 * @property {number} [retries] - Default: 2
 * @property {number} [retryDelay] - Default: 1000ms
 * @property {number} [retryBackoff] - Default: 2
 * @property {boolean} [validateInputs] - Default: true
 */

/**
 * @typedef {object} RequestConfig
 * @property {number} [timeout]
 * @property {number} [retries]
 * @property {AbortSignal} [signal]
 * @property {string} [idempotencyKey]
 */
```

---

## 6. Build System

### esbuild Configuration

```bash
esbuild src/index.ts \
  --bundle \
  --format=esm \
  --outfile=dist/index.js \
  --target=node20 \
  --tree-shaking=true \
  --external:valibot
```

- **ESM only** - No CommonJS build
- **Node 20+** - Required for `AbortSignal.any()`
- **External valibot** - Not bundled, listed as dependency
- **Readable output** - Preserves useful source lines in uncaught stack traces

### TypeScript Declaration Generation

```bash
dts-bundle-generator -o dist/index.d.ts src/index.ts --no-banner
```

Generates bundled `.d.ts` file for type hints in consumers. All types are merged into a single file for distribution.

---

## 7. Naming Conventions

| Scope | Convention | Example |
|-------|------------|---------|
| Public API | camelCase | `paymentCode.create()`, `financialAccount.get()` |
| Private members | snake_case | `http_client`, `build_url()`, `execute_request()` |
| Private getters | snake_case | `should_validate` |
| Constants | UPPER_SNAKE | `API_VERSION`, `DEFAULT_TIMEOUT` |
| Types | PascalCase | `ClientOptions`, `PaymentCode` |
| Request methods | UPPER_CASE | `GET`, `POST`, `PATCH`, `DELETE` |

---

## 8. Modules Overview

All modules follow the standard pattern and support CRUD operations where applicable.

| Module | File | Purpose | Operations |
|--------|------|---------|------------|
| `bank` | `src/bank.js` | Retrieve bank provider information | `list(params)`, `get(providerId)` |
| `financialAccount` | `src/financial-account.js` | Manage digital wallets/accounts | `create`, `get`, `list`, `update`, `getBalance` |
| `financialTransaction` | `src/financial-transaction.js` | View immutable transaction ledger | `get`, `list` (read-only) |
| `paymentCode` | `src/payment-code.js` | Create USSD payment links | `create`, `get`, `list`, `update`, `delete` |
| `payment` | `src/payment.js` | View payments created by payment codes | `get`, `list`, `update` (read-mostly) |
| `checkoutSession` | `src/checkout-session.js` | Hosted payment page sessions | `create`, `get`, `list` |
| `payout` | `src/payout.js` | Disburse funds to external accounts | `create`, `get`, `list`, `update`, `delete` |
| `webhook` | `src/webhook.js` | Event notification subscriptions | `create`, `get`, `list`, `update`, `delete` |
| `internalTransfer` | `src/internal-transfer.js` | Transfer between financial accounts | `create`, `get`, `list`, `update` |
| `momo` | `src/momo.js` | Retrieve mobile money provider info | `list(params)`, `get(providerId)` |
| `receipt` | `src/receipt.js` | Manage digital receipts with entitlements | `get`, `redeem` |
| `ussdOtp` | `src/ussd-otp.js` | USSD-based phone verification | `create`, `get`, `list` |

### Module Constructor Pattern

All modules receive the HTTP client singleton in their constructor:

```javascript
class XxxModule {
  /** @type {MonimeHttpClient} */
  http_client;

  /** @param {MonimeHttpClient} http_client */
  constructor(http_client) {
    this.http_client = http_client;
  }
}
```

Modules are instantiated once in `MonimeClient` constructor and reused for the client's lifetime.

---

## Key Dependencies

| Package | Purpose | Size |
|---------|---------|------|
| `valibot` | Schema validation | ~10KB |

**Build Output:**
- `dist/index.js` - Readable ESM bundle
- `dist/index.d.ts` - Type declarations | Bundled single file

**Dev dependencies:**
- `esbuild` - Fast bundler for production build
- `typescript` - TypeScript compiler
- `cp` in build script - Copies `src/index.d.ts` to `dist/index.d.ts`
- `@biomejs/biome` - Code linting/formatting
- `@types/node` - Node.js type definitions
