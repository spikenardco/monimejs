import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { MonimeClient, MonimeWebhookVerificationError } from "../src/index.js";

const webhook = new MonimeClient({
  spaceId: "spc-test",
  accessToken: "mon_test_example",
}).webhook;

const fixed_timestamp = "1700000000";
const fixed_secret = "0123456789abcdef0123456789abcdef";
const fixed_body =
  '{"apiVersion":"2024-08-01","event":{"id":"wke-test","name":"payment.completed","timestamp":"1700000000"},"object":{"id":"spm-test","type":"payment"},"data":{"status":"completed"}}';
const fixed_signature = "2z8aY6oBwfM6+otqYcL5gnNiNXgrvf6HUbIyNgg44b0=";

function sign_body(timestamp, raw_body, secret = fixed_secret) {
  return createHmac("sha256", secret)
    .update(`${timestamp}_`)
    .update(raw_body)
    .digest("base64");
}

function signature_header(timestamp, raw_body, secret = fixed_secret) {
  return `t=${timestamp},v1=${sign_body(timestamp, raw_body, secret)}`;
}

function assert_verification_error(callback, reason) {
  assert.throws(callback, (error) => {
    assert.ok(error instanceof MonimeWebhookVerificationError);
    assert.equal(error.reason, reason);
    assert.doesNotMatch(error.message, /0123456789abcdef|2z8aY6oB/);
    return true;
  });
}

test("verifies the fixed HS256 signature vector", () => {
  const event = webhook.verifySignature(
    fixed_body,
    `t=${fixed_timestamp},v1=${fixed_signature}`,
    fixed_secret,
    { toleranceSeconds: 1_000_000_000 },
  );

  assert.equal(event.event.id, "wke-test");
  assert.equal(event.data.status, "completed");
});

test("preserves Buffer body bytes", () => {
  const raw_body = Buffer.from(fixed_body);
  const event = webhook.verifySignature(
    raw_body,
    `t=${fixed_timestamp},v1=${fixed_signature}`,
    fixed_secret,
    { toleranceSeconds: 1_000_000_000 },
  );

  assert.equal(event.object.id, "spm-test");
});

test("rejects changed bodies and wrong secrets", () => {
  const header = `t=${fixed_timestamp},v1=${fixed_signature}`;

  assert_verification_error(
    () =>
      webhook.verifySignature(`${fixed_body} `, header, fixed_secret, {
        toleranceSeconds: 1_000_000_000,
      }),
    "signature_mismatch",
  );
  assert_verification_error(
    () =>
      webhook.verifySignature(
        fixed_body,
        header,
        "abcdef0123456789abcdef0123456789",
        { toleranceSeconds: 1_000_000_000 },
      ),
    "signature_mismatch",
  );
});

test("rejects malformed signature headers", () => {
  const malformed_headers = [
    "",
    `v1=${fixed_signature}`,
    `t=${fixed_timestamp}`,
    `t=${fixed_timestamp},t=${fixed_timestamp},v1=${fixed_signature}`,
    `t=${fixed_timestamp},v1=${fixed_signature},v1=${fixed_signature}`,
    `t=0${fixed_timestamp},v1=${fixed_signature}`,
    `t=not-a-number,v1=${fixed_signature}`,
    `t=${fixed_timestamp},v1=not-base64`,
    `t=${fixed_timestamp},v2=${fixed_signature}`,
  ];

  for (const malformed_header of malformed_headers) {
    assert_verification_error(
      () =>
        webhook.verifySignature(fixed_body, malformed_header, fixed_secret, {
          toleranceSeconds: 1_000_000_000,
        }),
      "signature_header_invalid",
    );
  }
});

test("rejects stale and future timestamps", () => {
  const current_timestamp = Math.floor(Date.now() / 1000);

  for (const timestamp of [current_timestamp - 301, current_timestamp + 301]) {
    const timestamp_text = String(timestamp);
    assert_verification_error(
      () =>
        webhook.verifySignature(
          fixed_body,
          signature_header(timestamp_text, fixed_body),
          fixed_secret,
        ),
      "timestamp_outside_tolerance",
    );
  }
});

test("rejects invalid JSON after authenticating it", () => {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const raw_body = "not-json";

  assert_verification_error(
    () =>
      webhook.verifySignature(
        raw_body,
        signature_header(timestamp, raw_body),
        fixed_secret,
      ),
    "payload_invalid",
  );
});

test("validates caller inputs", () => {
  const header = `t=${fixed_timestamp},v1=${fixed_signature}`;

  assert.throws(
    () => webhook.verifySignature({}, header, fixed_secret),
    /rawBody must be a string or Buffer/,
  );
  assert.throws(
    () => webhook.verifySignature(fixed_body, header, "short"),
    /secret must contain 32 to 256 characters/,
  );
  assert.throws(
    () =>
      webhook.verifySignature(fixed_body, header, fixed_secret, {
        toleranceSeconds: -1,
      }),
    /toleranceSeconds must be a non-negative integer/,
  );
});
