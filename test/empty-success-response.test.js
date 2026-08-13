import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { MonimeApiError } from "../src/errors.js";
import { MonimeHttpClient } from "../src/http-client.js";

const original_fetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = original_fetch;
});

function create_client() {
  return new MonimeHttpClient({
    spaceId: "space-test",
    accessToken: "token-test",
    retries: 0,
  });
}

function mock_response(response) {
  globalThis.fetch = async () => response;
}

test("returns the delete response shape for an empty 204 response", async () => {
  mock_response(new Response(null, { status: 204 }));

  const result = await create_client().request({
    method: "DELETE",
    path: "/webhooks/whk-test",
  });

  assert.deepEqual(result, { success: true, messages: [] });
});

test("returns the delete response shape for an empty successful body", async () => {
  mock_response(new Response("", { status: 200 }));

  const result = await create_client().request({
    method: "DELETE",
    path: "/webhooks/whk-test",
  });

  assert.deepEqual(result, { success: true, messages: [] });
});

test("returns a normal JSON success response", async () => {
  const response_body = {
    success: true,
    messages: [],
    result: { id: "whk-test" },
  };
  mock_response(Response.json(response_body));

  const result = await create_client().request({
    method: "GET",
    path: "/webhooks/whk-test",
  });

  assert.deepEqual(result, response_body);
});

test("rejects malformed non-empty JSON in a successful response", async () => {
  mock_response(new Response("not-json", { status: 200 }));

  await assert.rejects(
    create_client().request({ method: "GET", path: "/webhooks/whk-test" }),
    (error) => {
      assert(error instanceof MonimeApiError);
      assert.equal(error.code, 200);
      assert.equal(error.reason, "invalid_json");
      return true;
    },
  );
});

test("preserves a JSON API error response", async () => {
  mock_response(
    Response.json(
      {
        success: false,
        messages: ["Webhook not found"],
        error: {
          code: 404,
          reason: "not_found",
          message: "Webhook not found",
          details: [{ id: "whk-test" }],
        },
      },
      { status: 404 },
    ),
  );

  await assert.rejects(
    create_client().request({ method: "GET", path: "/webhooks/whk-test" }),
    (error) => {
      assert(error instanceof MonimeApiError);
      assert.equal(error.message, "Webhook not found");
      assert.equal(error.code, 404);
      assert.equal(error.reason, "not_found");
      assert.deepEqual(error.details, [{ id: "whk-test" }]);
      return true;
    },
  );
});
