# Webhook signature verification design

## Goal

Replace the throwing webhook signature stub with a synchronous HS256 verifier that authenticates the exact request body before returning the decoded event.

## Evidence and limits

Monime's public HMAC guide is still a placeholder. The protocol in this design comes from Monime's official WordPress plugin at commit `61f8ef20bc8ecbdc07f5bc2c5268d2b941452669`:

- request header: `Monime-Signature`
- header fields: `t=<Unix seconds>,v1=<Base64 signature>`
- signed bytes: the decimal timestamp, an underscore, then the exact raw request body
- algorithm: HMAC-SHA-256
- digest encoding: standard Base64
- freshness window used by the plugin: 300 seconds

The current Monime OpenAPI contract confirms HS256 means HMAC-SHA-256 and that webhook secrets contain 32 to 256 characters. It does not define the delivery header grammar or provide test vectors.

The SDK will document this evidence gap instead of presenting the public HMAC guide as complete. ES256 remains unsupported because its signature encoding and signed payload are not published.

Sources:

- <https://docs.monime.io/guide/webhook/hmac-verification.md>
- <https://docs.monime.io/developer-resources/api-basics/standard-headers.md>
- <https://github.com/monimesl/Wp-Monime/blob/61f8ef20bc8ecbdc07f5bc2c5268d2b941452669/src/Monime/core/webhook.php#L49-L157>
- <https://github.com/monimesl/monime-developer-apis/blob/a6a6091f29842ab398cfc5bdb6a75fe87dcf796f/versions/caph/2025-08-23/openapi.yaml#L3512-L3556>

## Public API

`client.webhook.verifySignature(rawBody, signatureHeader, secret, options?)` will return the parsed webhook event or throw `MonimeWebhookVerificationError`.

- `rawBody` accepts a string or `Buffer`. Callers must pass the body exactly as received.
- `signatureHeader` is the complete `Monime-Signature` header value.
- `secret` is the HMAC secret without trimming or other normalization.
- `options.toleranceSeconds` defaults to 300.

The direct header value is clearer than accepting every request header. It also works across Node HTTP, Express, Fetch, and other frameworks without framework-specific header types.

`MonimeWebhookVerificationError.reason` provides stable failure categories:

- `signature_header_invalid`
- `timestamp_outside_tolerance`
- `signature_mismatch`
- `payload_invalid`

Errors will not contain the secret, signature, or raw payload.

## Verification flow

1. Validate the raw body, signature header, secret, and tolerance.
2. Parse exactly one `t` field and one `v1` field.
3. Require a canonical non-negative decimal Unix timestamp and a 32-byte standard Base64 signature.
4. Reject timestamps outside the configured tolerance.
5. Build the signed bytes without parsing or re-serializing the body.
6. Calculate HMAC-SHA-256 and compare bytes with `timingSafeEqual`.
7. Parse and return the JSON body only after the signature matches.

## Testing

Use Node's built-in test runner, so this feature adds no runtime or development dependency. Tests will cover a fixed signature vector, `Buffer` input, body tampering, malformed and duplicate header fields, stale and future timestamps, wrong secrets, malformed Base64, and invalid JSON with a valid signature.

The fixed vector will be generated independently with OpenSSL and committed as literal input and output. It is a project vector derived from the official WordPress algorithm, not an official Monime vector.

## Documentation

The webhook example will show how to retain the raw body, read `Monime-Signature`, verify it, and handle failures. It will state that verification currently supports HS256 only and cite the official sources above.
