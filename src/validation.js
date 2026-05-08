import * as v from "valibot";
import { MonimeValidationError } from "./errors.js";
import {
  BankProviderIdSchema,
  ClientOptionsSchema,
  CountryCodeSchema,
  CreateCheckoutSessionInputSchema,
  CreateFinancialAccountInputSchema,
  CreateInternalTransferInputSchema,
  CreatePaymentCodeInputSchema,
  CreatePayoutInputSchema,
  CreateUssdOtpInputSchema,
  CreateWebhookInputSchema,
  IdSchema,
  LimitSchema,
  MomoProviderIdSchema,
  ReceiptOrderNumberSchema,
  RedeemReceiptInputSchema,
  UpdateFinancialAccountInputSchema,
  UpdateInternalTransferInputSchema,
  UpdatePaymentCodeInputSchema,
  UpdatePaymentInputSchema,
  UpdatePayoutInputSchema,
  UpdateWebhookInputSchema,
} from "./schemas.js";

/** @typedef {import("./errors.js").ValidationIssue} ValidationIssue */

/**
 * Converts valibot validation issues to a MonimeValidationError.
 *
 * Transforms valibot's raw issue format into a structured ValidationIssue array
 * and creates a MonimeValidationError with appropriate error messaging. Handles
 * nested field paths by joining path segments with dots (e.g., "customer.name").
 *
 * @internal
 * @param {v.BaseIssue<unknown>[]} issues - Array of valibot validation issues from failed parse operations
 * @returns {MonimeValidationError} A MonimeValidationError with formatted validation issues
 */
function to_validation_error(issues) {
  if (issues.length === 0) {
    return new MonimeValidationError("Validation failed", [
      { message: "Validation failed", field: "unknown" },
    ]);
  }
  /** @type {ValidationIssue[]} */
  const validation_issues = issues.map((issue) => ({
    message: issue.message,
    field: issue.path?.map((p) => p.key).join(".") ?? "unknown",
    value: issue.input,
  }));
  const first_issue = validation_issues.at(0);
  const message =
    validation_issues.length === 1
      ? first_issue?.message
      : `Validation failed with ${validation_issues.length} errors`;
  return new MonimeValidationError(String(message), validation_issues);
}

/**
 * Validates data against a valibot schema and throws on validation failure.
 *
 * A generic validation function that accepts any valibot schema and input data,
 * parses it against the schema, and throws a MonimeValidationError if validation
 * fails. This is the single entry point for all input validation in the SDK.
 *
 * The function performs type-safe validation using valibot's schema definitions
 * while maintaining detailed error information about what failed and why. All
 * validation errors are caught and transformed into structured MonimeValidationError
 * instances with field paths, messages, and problematic values.
 *
 * @template T - The expected type of valid data (inferred from schema)
 * @param {v.BaseSchema<unknown, T, v.BaseIssue<unknown>>} schema - A valibot schema to validate against
 * @param {unknown} data - Unknown input data to validate
 * @throws {MonimeValidationError} If validation fails with details about validation issues
 */
function validate(schema, data) {
  const result = v.safeParse(schema, data);
  if (!result.success) {
    throw to_validation_error(result.issues);
  }
}

export {
  BankProviderIdSchema,
  ClientOptionsSchema,
  CountryCodeSchema,
  CreateCheckoutSessionInputSchema,
  CreateFinancialAccountInputSchema,
  CreateInternalTransferInputSchema,
  CreatePaymentCodeInputSchema,
  CreatePayoutInputSchema,
  CreateUssdOtpInputSchema,
  CreateWebhookInputSchema,
  IdSchema,
  LimitSchema,
  MomoProviderIdSchema,
  ReceiptOrderNumberSchema,
  RedeemReceiptInputSchema,
  UpdateFinancialAccountInputSchema,
  UpdateInternalTransferInputSchema,
  UpdatePaymentCodeInputSchema,
  UpdatePaymentInputSchema,
  UpdatePayoutInputSchema,
  UpdateWebhookInputSchema,
  validate,
};
