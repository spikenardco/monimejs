import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { describe, it } from "node:test";
import { MonimeClient, verifyWebhookSignature } from "./index.js";

const SECRET = "test-secret-key-at-least-32-chars!!";
const BODY = JSON.stringify({ event: { name: "payment.completed" } });

/** @param {string} body */
function sign(body) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHmac("sha256", SECRET)
    .update(`${timestamp}_${body}`)
    .digest("base64");
  return `t=${timestamp},v1=${signature}`;
}

describe("webhook verification", () => {
  it("accepts a signed webhook", () => {
    const client = new MonimeClient({
      spaceId: "sp_test",
      accessToken: "tok_test",
      webhookSecret: SECRET,
    });

    const event = client.webhook.verify(BODY, sign(BODY));
    assert.equal(event.event.name, "payment.completed");
  });

  it("rejects a modified body", () => {
    assert.throws(() => verifyWebhookSignature("tampered", sign(BODY), SECRET));
  });

  it("works without a client", () => {
    const event = verifyWebhookSignature(BODY, sign(BODY), SECRET);
    assert.equal(event.event.name, "payment.completed");
  });
});
