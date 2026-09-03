import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { MonimeClient, MonimeWebhookVerificationError } from "../src/index.js";

const SECRET = "test-secret-key-at-least-32-chars!!";

/** Build a valid signature header for the given body and timestamp. */
function sign(body, timestamp, secret = SECRET) {
  const sig = createHmac("sha256", secret)
    .update(`${timestamp}_${body}`)
    .digest("base64");
  return `t=${timestamp},v1=${sig}`;
}

function now() {
  return Math.floor(Date.now() / 1000);
}

function makeClient(secret = SECRET) {
  return new MonimeClient({
    spaceId: "sp_test",
    accessToken: "tok_test",
    webhookSecret: secret,
  });
}

// ── WebhookModule.verify ──────────────────────────────────────────────────

describe("WebhookModule.verify", () => {
  const payload = JSON.stringify({ event: { name: "payment.completed" } });

  it("returns parsed event on valid signature (string body)", () => {
    const header = sign(payload, now());
    const event = makeClient().webhook.verify(payload, header);
    assert.equal(event.event.name, "payment.completed");
  });

  it("returns parsed event on valid signature (Buffer body)", () => {
    const body = Buffer.from(payload, "utf8");
    const header = sign(payload, now());
    const event = makeClient().webhook.verify(body, header);
    assert.equal(event.event.name, "payment.completed");
  });

  it("throws TypeError when webhookSecret is not configured", () => {
    const client = new MonimeClient({
      spaceId: "sp_test",
      accessToken: "tok_test",
    });
    assert.throws(
      () => client.webhook.verify(payload, "t=0,v1=abc"),
      { name: "TypeError", message: /webhookSecret must be configured/ },
    );
  });

  it("throws TypeError when rawBody is not string or Buffer", () => {
    assert.throws(
      () => makeClient().webhook.verify(123, "t=0,v1=abc"),
      { name: "TypeError", message: /rawBody must be a string or Buffer/ },
    );
  });

  it("rejects invalid signature header formats", () => {
    const cases = [
      "just-a-string",
      "t=123",
      "t=123,v1=abc,v2=def",
      "v1=abc,t=123",
      "t=abc,v1=def",
    ];
    for (const header of cases) {
      assert.throws(
        () => makeClient().webhook.verify(payload, header),
        { name: "MonimeWebhookVerificationError" },
      );
    }
  });

  it("rejects expired timestamps", () => {
    const old = now() - 600; // 10 minutes ago, beyond 5 min tolerance
    const header = sign(payload, old);
    assert.throws(
      () => makeClient().webhook.verify(payload, header),
      {
        name: "MonimeWebhookVerificationError",
        message: /timestamp is outside/,
      },
    );
  });

  it("rejects signature mismatch", () => {
    const header = sign("wrong-body", now());
    assert.throws(
      () => makeClient().webhook.verify(payload, header),
      {
        name: "MonimeWebhookVerificationError",
        message: /signature does not match/,
      },
    );
  });

  it("rejects invalid JSON payload", () => {
    const badBody = "not json at all";
    const header = sign(badBody, now());
    assert.throws(
      () => makeClient().webhook.verify(badBody, header),
      {
        name: "MonimeWebhookVerificationError",
        message: /not valid JSON/,
      },
    );
  });
});
