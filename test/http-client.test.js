import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { MonimeHttpClient } from "../src/http-client.js";

const original_fetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = original_fetch;
});

test("sends the current Monime API version header", async () => {
  /** @type {RequestInit | undefined} */
  let received_options;
  globalThis.fetch = async (_url, options) => {
    received_options = options;
    return new Response(JSON.stringify({ success: true, result: {} }), {
      headers: { "Content-Type": "application/json" },
    });
  };

  const client = new MonimeHttpClient({
    spaceId: "spc-test",
    accessToken: "test-token",
    retries: 0,
  });

  await client.request({ method: "GET", path: "/banks" });

  assert.ok(received_options);
  assert.equal(
    /** @type {Record<string, string>} */ (received_options.headers)[
      "Monime-Version"
    ],
    "caph.2025-08-23",
  );
});
