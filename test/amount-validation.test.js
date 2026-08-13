import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import * as v from "valibot";
import { MonimeClient, MonimeValidationError } from "../src/index.js";
import { AmountSchema } from "../src/schemas.js";

const original_fetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = original_fetch;
});

function create_client() {
  return new MonimeClient({
    spaceId: "spc-test",
    accessToken: "test-token",
    retries: 0,
  });
}

function mock_successful_request() {
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ success: true, result: {} }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
}

test("AmountSchema accepts non-negative integer minor units", () => {
  for (const value of [0, 1, 10_000]) {
    assert.equal(
      v.safeParse(AmountSchema, { currency: "SLE", value }).success,
      true,
    );
  }
});

test("AmountSchema rejects fractional values", () => {
  for (const value of [0.1, 1.5, 10_000.01]) {
    assert.equal(
      v.safeParse(AmountSchema, { currency: "SLE", value }).success,
      false,
    );
  }
});

test("paymentCode.create accepts zero and integer minor units", async () => {
  mock_successful_request();
  const client = create_client();

  await assert.doesNotReject(
    client.paymentCode.create({
      name: "Zero value",
      amount: { currency: "SLE", value: 0 },
    }),
  );
  await assert.doesNotReject(
    client.paymentCode.create({
      name: "Integer value",
      amount: { currency: "SLE", value: 1_000 },
    }),
  );
});

test("public clients reject fractional minor units through shared schemas", async () => {
  const client = create_client();
  const fraction = 1.5;

  await assert.rejects(
    client.paymentCode.create({
      name: "Fractional value",
      amount: { currency: "SLE", value: fraction },
    }),
    (error) =>
      error instanceof MonimeValidationError &&
      error.issues.some(
        (issue) => issue.field === "amount.value" && issue.value === fraction,
      ),
  );

  await assert.rejects(
    client.internalTransfer.create({
      amount: { currency: "SLE", value: fraction },
      sourceFinancialAccount: { id: "acc-source" },
      destinationFinancialAccount: { id: "acc-destination" },
    }),
    (error) =>
      error instanceof MonimeValidationError &&
      error.issues.some(
        (issue) => issue.field === "amount.value" && issue.value === fraction,
      ),
  );
});
