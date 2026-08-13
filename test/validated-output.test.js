import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import * as v from "valibot";
import { MonimeClient } from "../src/index.js";
import { validate } from "../src/validation.js";

const original_fetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = original_fetch;
});

test("validate returns transformed and defaulted schema output", () => {
  const schema = v.object({
    name: v.pipe(
      v.string(),
      v.transform((value) => value.trim()),
    ),
    enabled: v.optional(v.boolean(), true),
  });

  assert.deepEqual(validate(schema, { name: "  checkout  " }), {
    name: "checkout",
    enabled: true,
  });
});

test("request bodies use parsed output instead of the original input", async () => {
  /** @type {RequestInit | undefined} */
  let captured_options;
  globalThis.fetch = async (_url, options) => {
    captured_options = options;
    return new Response(JSON.stringify({ success: true, result: {} }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };
  const client = new MonimeClient({
    spaceId: "space",
    accessToken: "token",
    retries: 0,
  });
  const input = {
    name: "Account",
    currency: "SLE",
    discardedBySchema: "must not reach fetch",
  };

  await client.financialAccount.create(input);

  assert.deepEqual(JSON.parse(String(captured_options?.body)), {
    name: "Account",
    currency: "SLE",
  });
  assert.equal(input.discardedBySchema, "must not reach fetch");
});
