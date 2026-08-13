import assert from "node:assert/strict";
import test from "node:test";
import { MonimeClient, MonimeValidationError } from "../src/index.js";

const client_options = {
  spaceId: "space",
  accessToken: "token",
};

test("request payloads are sent unchanged for Monime to validate", async (t) => {
  const original_fetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = original_fetch;
  });

  const input = {
    name: "x",
    amount: { currency: "FUTURE", value: -1 },
    futureField: { enabled: true },
  };
  let sent_body;
  globalThis.fetch = async (_url, options) => {
    sent_body = options?.body;
    return new Response(JSON.stringify({ success: true, result: {} }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  await new MonimeClient(client_options).paymentCode.create(input);

  assert.deepEqual(JSON.parse(String(sent_body)), input);
});

test("values formerly rejected by local business rules reach fetch", async (t) => {
  const original_fetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = original_fetch;
  });

  let called = false;
  globalThis.fetch = async () => {
    called = true;
    return new Response(JSON.stringify({ success: true, result: {} }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  await new MonimeClient(client_options).payout.create({
    amount: { currency: "SLE", value: -100 },
    destination: { type: "future_destination" },
  });

  assert.equal(called, true);
});

test("invalid client execution options include field details", () => {
  const invalid_options = [
    [null, "options"],
    [{ accessToken: "token" }, "spaceId"],
    [{ spaceId: "space", accessToken: "" }, "accessToken"],
    [{ ...client_options, baseUrl: "http://api.example.com" }, "baseUrl"],
    [{ ...client_options, timeout: Number.POSITIVE_INFINITY }, "timeout"],
    [{ ...client_options, retries: 1.5 }, "retries"],
    [{ ...client_options, retryDelay: -1 }, "retryDelay"],
    [{ ...client_options, retryBackoff: Number.NaN }, "retryBackoff"],
  ];

  for (const [options, field] of invalid_options) {
    assert.throws(
      () => new MonimeClient(options),
      (error) => {
        assert.ok(error instanceof MonimeValidationError);
        assert.equal(error.issues[0]?.field, field);
        return true;
      },
    );
  }
});
