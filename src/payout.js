import {
  CreatePayoutInputSchema,
  IdSchema,
  LimitSchema,
  UpdatePayoutInputSchema,
  validate,
} from "./validation.js";

/** @typedef {import("./http-client.js").MonimeHttpClient} MonimeHttpClient */
/** @typedef {import("./index.d.ts").ApiDeleteResponse} ApiDeleteResponse */
/** @typedef {import("./index.d.ts").ApiListResponse<import("./index.d.ts").Payout>} PayoutListResponse */
/** @typedef {import("./index.d.ts").ApiResponse<import("./index.d.ts").Payout>} PayoutResponse */
/** @typedef {import("./index.d.ts").CreatePayoutInput} CreatePayoutInput */
/** @typedef {import("./index.d.ts").ListPayoutsParams} ListPayoutsParams */
/** @typedef {import("./index.d.ts").RequestConfig} RequestConfig */
/** @typedef {import("./index.d.ts").UpdatePayoutInput} UpdatePayoutInput */

/**
 * Module for managing payouts.
 *
 * Payouts enable disbursements from your financial accounts to external recipients
 * via bank transfers, mobile money, or wallet transfers. Use payouts for vendor
 * payments, refunds, salary disbursements, and other outbound transfers.
 *
 * Features:
 * - Send funds to bank accounts (local and international)
 * - Disburse to mobile money wallets (Orange, Africell, QCell)
 * - Transfer to other Monime wallet addresses
 * - Track payout status (pending, completed, failed)
 * - Batch processing support
 * - Transaction reference tracking
 *
 * @see {@link https://docs.monime.io/apis/versions/caph-2025-08-23/payout/object} Payouts API Documentation
 */
class PayoutModule {
  /** @type {MonimeHttpClient} */
  #http_client;

  /** @param {MonimeHttpClient} http_client */
  constructor(http_client) {
    this.#http_client = http_client;
  }
  /**
   * Creates a new payout.
   * @param {CreatePayoutInput} input - Payout configuration including amount and destination
   * @param {RequestConfig} [config] - Optional request configuration (timeout, idempotencyKey, signal)
   * @returns {Promise<PayoutResponse>} The created payout
   * @throws {MonimeValidationError} If input validation fails
   * @throws {MonimeApiError} If the API returns an error
   */
  async create(input, config) {
    if (this.#http_client.should_validate) {
      validate(CreatePayoutInputSchema, input);
    }
    return this.#http_client.request({
      method: "POST",
      path: "/payouts",
      body: input,
      config,
    });
  }
  /**
   * Retrieves a payout by ID.
   * @param {string} id - The payout ID
   * @param {RequestConfig} [config] - Optional request configuration
   * @returns {Promise<PayoutResponse>} The payout
   * @throws {MonimeValidationError} If ID validation fails
   * @throws {MonimeApiError} If the API returns an error
   */
  async get(id, config) {
    if (this.#http_client.should_validate) {
      validate(IdSchema, id);
    }
    return this.#http_client.request({
      method: "GET",
      path: `/payouts/${encodeURIComponent(id)}`,
      config,
    });
  }
  /**
   * Lists payouts with optional filtering and pagination.
   * @param {ListPayoutsParams} [params] - Optional filter and pagination parameters
   * @param {RequestConfig} [config] - Optional request configuration
   * @returns {Promise<PayoutListResponse>} A paginated list of payouts
   * @throws {MonimeValidationError} If params validation fails
   * @throws {MonimeApiError} If the API returns an error
   */
  async list(params, config) {
    if (this.#http_client.should_validate && params?.limit !== undefined) {
      validate(LimitSchema, params.limit);
    }
    const query_params = params
      ? {
          status: params.status,
          sourceFinancialAccountId: params.sourceFinancialAccountId,
          sourceTransactionReference: params.sourceTransactionReference,
          destinationTransactionReference:
            params.destinationTransactionReference,
          limit: params.limit,
          after: params.after,
        }
      : undefined;
    return this.#http_client.request({
      method: "GET",
      path: "/payouts",
      params: query_params,
      config,
    });
  }
  /**
   * Updates a payout.
   * @param {string} id - The payout ID
   * @param {UpdatePayoutInput} input - Fields to update
   * @param {RequestConfig} [config] - Optional request configuration
   * @returns {Promise<PayoutResponse>} The updated payout
   * @throws {MonimeValidationError} If validation fails
   * @throws {MonimeApiError} If the API returns an error
   */
  async update(id, input, config) {
    if (this.#http_client.should_validate) {
      validate(IdSchema, id);
      validate(UpdatePayoutInputSchema, input);
    }
    return this.#http_client.request({
      method: "PATCH",
      path: `/payouts/${encodeURIComponent(id)}`,
      body: input,
      config,
    });
  }
  /**
   * Deletes a payout.
   * @param {string} id - The payout ID
   * @param {RequestConfig} [config] - Optional request configuration
   * @returns {Promise<ApiDeleteResponse>} Confirmation of deletion
   * @throws {MonimeValidationError} If ID validation fails
   * @throws {MonimeApiError} If the API returns an error
   */
  async delete(id, config) {
    if (this.#http_client.should_validate) {
      validate(IdSchema, id);
    }
    return this.#http_client.request({
      method: "DELETE",
      path: `/payouts/${encodeURIComponent(id)}`,
      config,
    });
  }
}

export { PayoutModule };
