# Implementation reference

This reference describes the SDK internals for contributors.

## Architecture

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
├── providerKyc: ProviderKycModule
├── receipt: ReceiptModule
└── ussdOtp: UssdOtpModule
    └── shared MonimeHttpClient
        ├── client option validation
        ├── request construction
        ├── timeouts and abort signals
        └── retries with backoff
```

## HTTP client (`src/http-client.js`)

### Request flow

```
request() → #build_url() → #build_headers() → #execute_with_retry() → #execute_request()
                                                              ↓
                                                     retry delay, if needed
                                                              ↓
                                                            fetch()
```

`request()` serializes a supplied body as JSON, omits undefined query parameters, and applies request-level configuration over the client defaults.

### Timeouts and signals

For a positive timeout, the client creates an `AbortController`, schedules it with `setTimeout`, and clears that timer in a `finally` block. This avoids leaving a timer running after a request completes.

```javascript
const timeout_controller = new AbortController();
const timeout_id = setTimeout(() => {
  timeout_controller.abort();
}, timeout);

try {
  await fetch(url, { signal: AbortSignal.any([timeout_controller.signal]) });
} finally {
  clearTimeout(timeout_id);
}
```

When the caller supplies `RequestConfig.signal`, the HTTP client combines it with the timeout signal through `AbortSignal.any()`. A timeout becomes `MonimeTimeoutError`; an abort from the caller is rethrown as `AbortError`.

### Retries

The client retries network failures and API responses with status 429, 500, 502, 503, or 504. Timeouts and caller-initiated aborts are not retried.

```javascript
delay = retryDelay * retryBackoff ** retry_index + random(0..500ms)
```

For an API error with a `Retry-After` header, the client uses that delay instead. It accepts both whole seconds and HTTP-date values.

### JSON responses

The client parses every response as JSON. If parsing fails, it throws `MonimeApiError` with the reason `invalid_json`, including for a non-JSON error page returned by a proxy or CDN.

## Validation boundaries

The SDK forwards request payloads, IDs, query parameters, and business-rule values unchanged. This lets consumers use newly supported API fields without waiting for an SDK release. The Monime API remains the authority for those values.

`MonimeHttpClient` validates configuration needed to run safely: credentials, an optional webhook secret, retry settings, timeout settings, and custom HTTPS base URLs.

```javascript
if (base_url !== undefined) {
  if (typeof base_url !== "string" || !base_url.startsWith("https://")) {
    throw_option_error("baseUrl", "baseUrl must be an HTTPS URL", base_url);
  }
}
```

## Errors (`src/errors.js`)

```
MonimeError
├── MonimeApiError                  API returned an error response
├── MonimeTimeoutError              request timed out
├── MonimeValidationError           client options are invalid
├── MonimeWebhookVerificationError  webhook could not be authenticated or decoded
└── MonimeNetworkError              connection failed
```

Each error restores its prototype chain so `instanceof` works across the supported runtime targets.

```javascript
constructor(message) {
  super(message);
  Object.setPrototypeOf(this, new.target.prototype);
}
```

`MonimeApiError.isRetryable` is true for 429, 500, 502, 503, and 504. `MonimeNetworkError.isRetryable` is always true.

## Module pattern

Modules receive one shared `MonimeHttpClient` and forward their resource-specific arguments to it. Private fields use the `#` syntax.

```javascript
class XxxModule {
  #http_client;

  constructor(http_client) {
    this.#http_client = http_client;
  }

  async create(input, config) {
    return this.#http_client.request({
      method: "POST",
      path: "/xxx",
      body: input,
      config,
    });
  }
}
```

### Idempotency keys

The HTTP client adds an `Idempotency-Key` to every POST request. A request can provide `RequestConfig.idempotencyKey`; otherwise, the client generates one with `crypto.randomUUID()`.

```javascript
if (method === "POST") {
  headers["Idempotency-Key"] = idempotency_key ?? crypto.randomUUID();
}
```

## Webhook verification (`src/webhook.js`)

`WebhookModule.verify(rawBody, signatureHeader)` verifies an HS256 webhook when `webhookSecret` was supplied to `MonimeClient`. `verifyWebhookSignature(rawBody, signatureHeader, webhookSecret)` provides the same verification without a client instance.

Both functions preserve the supplied raw body, require a timestamp within 300 seconds of the local clock, compare the HMAC-SHA-256 digest with `timingSafeEqual`, then parse the authenticated body as JSON. Verification failures throw `MonimeWebhookVerificationError` with one of these reasons:

- `signature_header_invalid`
- `timestamp_outside_tolerance`
- `signature_mismatch`
- `payload_invalid`

## Type declarations

The public type barrel is `src/index.d.ts`. It defines the resource types, request inputs, response wrappers, client options, and exported error types. TypeScript generates declarations for JavaScript modules from their JSDoc when `npm run build` runs, then the build copies `src/index.d.ts` to `dist/index.d.ts`.

`ClientOptions` includes the required `spaceId` and `accessToken`, plus optional `webhookSecret`, `baseUrl`, `monimeVersion`, timeout, and retry settings. `RequestConfig` can override `timeout`, `retries`, `signal`, and `idempotencyKey` for one request.

## Build

Run the full build with:

```bash
npm run build
```

The build creates an ESM bundle for Node 20 and declaration files in `dist/`. The bundle is minified with esbuild. `dist/index.d.ts` is the public declaration file; the other declaration files support its internal module imports.

## Naming

| Scope | Convention | Example |
| --- | --- | --- |
| Public API | camelCase | `paymentCode.create()`, `financialAccount.get()` |
| Private members and helpers | snake_case | `#http_client`, `#build_url()` |
| Constants | UPPER_SNAKE | `API_VERSION`, `DEFAULT_TIMEOUT` |
| Types | PascalCase | `ClientOptions`, `PaymentCode` |
| HTTP methods | UPPER_CASE | `GET`, `POST`, `PATCH`, `DELETE` |

## Modules

| Module | File | Purpose | Operations |
| --- | --- | --- | --- |
| `bank` | `src/bank.js` | Bank provider information | `list`, `get` |
| `financialAccount` | `src/financial-account.js` | Financial accounts | `create`, `get`, `list`, `update`, `getBalance` |
| `financialTransaction` | `src/financial-transaction.js` | Transaction ledger | `get`, `list` |
| `paymentCode` | `src/payment-code.js` | USSD payment links | `create`, `get`, `list`, `update`, `delete` |
| `payment` | `src/payment.js` | Payments created by payment codes | `get`, `list`, `update` |
| `checkoutSession` | `src/checkout-session.js` | Hosted payment sessions | `create`, `get`, `list`, `delete` |
| `payout` | `src/payout.js` | Payouts to external accounts | `create`, `get`, `list`, `update`, `delete` |
| `webhook` | `src/webhook.js` | Webhook subscriptions and signature verification | `create`, `get`, `list`, `update`, `delete`, `verify` |
| `internalTransfer` | `src/internal-transfer.js` | Transfers between financial accounts | `create`, `get`, `list`, `update`, `delete` |
| `momo` | `src/momo.js` | Mobile-money provider information | `list`, `get` |
| `providerKyc` | `src/provider-kyc.js` | Provider KYC profiles | `get` |
| `receipt` | `src/receipt.js` | Receipts and entitlements | `get`, `redeem` |
| `ussdOtp` | `src/ussd-otp.js` | USSD phone verification | `create`, `get`, `list`, `delete` |
