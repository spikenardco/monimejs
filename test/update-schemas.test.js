import assert from "node:assert/strict";
import test from "node:test";
import * as v from "valibot";
import {
  UpdateFinancialAccountInputSchema,
  UpdateInternalTransferInputSchema,
  UpdatePaymentCodeInputSchema,
  UpdatePaymentInputSchema,
  UpdatePayoutInputSchema,
  UpdateWebhookInputSchema,
} from "../src/schemas.js";

const update_schemas = [
  ["payment code", UpdatePaymentCodeInputSchema, { enable: null }],
  ["payment", UpdatePaymentInputSchema, { name: null }],
  ["payout", UpdatePayoutInputSchema, { metadata: null }],
  ["webhook", UpdateWebhookInputSchema, { enabled: null }],
  [
    "internal transfer",
    UpdateInternalTransferInputSchema,
    { description: null },
  ],
  ["financial account", UpdateFinancialAccountInputSchema, { reference: null }],
];

for (const [name, schema, valid_input] of update_schemas) {
  test(`${name} update rejects an empty body`, () => {
    assert.equal(v.safeParse(schema, {}).success, false);
  });

  test(`${name} update accepts one nullable field`, () => {
    assert.equal(v.safeParse(schema, valid_input).success, true);
  });
}
