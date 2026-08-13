import assert from "node:assert/strict";
import test from "node:test";

import { MonimeValidationError } from "../src/errors.js";
import { MonimeHttpClient } from "../src/http-client.js";

const credentials = {
  spaceId: "spc-test",
  accessToken: "secret",
};

function success_response() {
  return new Response(JSON.stringify({ success: true, result: {} }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

test("accepts and normalizes the official Monime API origin", () => {
  assert.doesNotThrow(() => new MonimeHttpClient(credentials));
  assert.doesNotThrow(
    () =>
      new MonimeHttpClient({
        ...credentials,
        baseUrl: "https://api.monime.io:443",
      }),
  );
});

test("rejects unsafe custom origins by default", () => {
  const unsafe_base_urls = [
    "https://evil.example",
    "https://api.monime.io.evil.example",
    "https://api-monime.io",
    "https://monime.io",
    "https://api.monime.io:8443",
    "https://user@api.monime.io",
    "https://api.monime.io@evil.example",
    "http://api.monime.io",
    "not a URL",
  ];

  for (const base_url of unsafe_base_urls) {
    assert.throws(
      () => new MonimeHttpClient({ ...credentials, baseUrl: base_url }),
      MonimeValidationError,
      base_url,
    );
  }
});

test("allows a custom HTTPS origin only with the explicit unsafe opt-in", async (t) => {
  const original_fetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = original_fetch;
  });

  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return success_response();
  };

  await new MonimeHttpClient({
    ...credentials,
    baseUrl: "https://trusted-proxy.example/",
    allowUnsafeCustomBaseUrl: true,
  }).request({ method: "GET", path: "/payments" });

  assert.equal(request.url, "https://trusted-proxy.example/v1/payments");
  assert.equal(request.options.headers.Authorization, "Bearer secret");
  assert.equal(request.options.headers["Monime-Space-Id"], "spc-test");
});

test("rejects query strings and fragments in base URLs", () => {
  for (const base_url of [
    "https://api.monime.io?tenant=1",
    "https://trusted-proxy.example/#tenant",
  ]) {
    assert.throws(
      () =>
        new MonimeHttpClient({
          ...credentials,
          baseUrl: base_url,
          allowUnsafeCustomBaseUrl: true,
        }),
      MonimeValidationError,
      base_url,
    );
  }
});

test("invalid options throw MonimeValidationError", () => {
  assert.throws(() => new MonimeHttpClient(null), MonimeValidationError);
  assert.throws(
    () =>
      new MonimeHttpClient({
        ...credentials,
        baseUrl: "http://trusted-proxy.example",
        allowUnsafeCustomBaseUrl: true,
      }),
    MonimeValidationError,
  );
});
