import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { describe, it } from "node:test";
import {
  MonimeClient,
  MonimeWebhookVerificationError,
  verifyWebhookSignature,
} from "./index.js";

const SECRET = "test-secret-key-at-least-32-chars!!";
const BODY = JSON.stringify({ event: { name: "payment.completed" } });

/** @param {string} body @param {number} [timestamp] */
function sign(body, timestamp = Math.floor(Date.now() / 1000)) {
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

  it("rejects incomplete and non-canonical signature headers", () => {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature_header = sign(BODY, timestamp);
    const signature = signature_header.slice(
      signature_header.indexOf(",v1=") + 4,
    );

    for (const header of [
      `v1=${signature},v1=${signature}`,
      `t=${timestamp},v1=${signature.slice(0, -1)}`,
    ]) {
      assert.throws(
        () => verifyWebhookSignature(BODY, header, SECRET),
        (error) =>
          error instanceof MonimeWebhookVerificationError &&
          error.reason === "signature_header_invalid",
      );
    }
  });

  it("works without a client", () => {
    const event = verifyWebhookSignature(BODY, sign(BODY), SECRET);
    assert.equal(event.event.name, "payment.completed");
  });
});
