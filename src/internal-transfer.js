import {
  CreateInternalTransferInputSchema,
  IdSchema,
  LimitSchema,
  UpdateInternalTransferInputSchema,
  validate,
} from "./validation.js";

/** @typedef {import("./http-client.js").MonimeHttpClient} MonimeHttpClient */
/** @typedef {import("./index.d.ts").ApiDeleteResponse} ApiDeleteResponse */
/** @typedef {import("./index.d.ts").ApiListResponse<import("./index.d.ts").InternalTransfer>} InternalTransferListResponse */
/** @typedef {import("./index.d.ts").ApiResponse<import("./index.d.ts").InternalTransfer>} InternalTransferResponse */
/** @typedef {import("./index.d.ts").CreateInternalTransferInput} CreateInternalTransferInput */
/** @typedef {import("./index.d.ts").ListInternalTransfersParams} ListInternalTransfersParams */
/** @typedef {import("./index.d.ts").RequestConfig} RequestConfig */
/** @typedef {import("./index.d.ts").UpdateInternalTransferInput} UpdateInternalTransferInput */

/**
 * Module for managing internal transfers.
 *
 * Internal transfers move funds between financial accounts within the same
 * Monime workspace. Unlike payouts (which send funds externally), internal
 * transfers are instant, free, and ideal for fund management operations.
 *
 * Use cases:
 * - Move funds from collection accounts to disbursement accounts
 * - Split revenue between multiple business units
 * - Reserve funds for specific purposes or escrow
 * - Consolidate balances across accounts
 *
 * Features:
 * - Instant settlement between accounts
 * - No transaction fees
 * - Same-currency transfers only
 * - Automatic balance updates
 * - Full audit trail via financial transactions
 *
 * @see {@link https://docs.monime.io/apis/versions/caph-2025-08-23/internal-transfer/object} Internal Transfers API Documentation
 */
class InternalTransferModule {
  /** @type {MonimeHttpClient} */
  #http_client;

  /** @param {MonimeHttpClient} http_client */
  constructor(http_client) {
    this.#http_client = http_client;
  }
  /**
   * Creates a new internal transfer.
   * @param {CreateInternalTransferInput} input - Transfer configuration including amount and accounts
   * @param {RequestConfig} [config] - Optional request configuration (timeout, idempotencyKey, signal)
   * @returns {Promise<InternalTransferResponse>} The created internal transfer
   * @throws {MonimeValidationError} If input validation fails
   * @throws {MonimeApiError} If the API returns an error
   */
  async create(input, config) {
    if (this.#http_client.should_validate) {
      validate(CreateInternalTransferInputSchema, input);
    }
    return this.#http_client.request({
      method: "POST",
      path: "/internal-transfers",
      body: input,
      config,
    });
  }
  /**
   * Retrieves an internal transfer by ID.
   * @param {string} id - The internal transfer ID (must start with "trn-")
   * @param {RequestConfig} [config] - Optional request configuration (timeout, idempotencyKey, signal)
   * @returns {Promise<InternalTransferResponse>} The internal transfer
   * @throws {MonimeValidationError} If ID validation fails
   * @throws {MonimeApiError} If the API returns an error
   */
  async get(id, config) {
    if (this.#http_client.should_validate) {
      validate(IdSchema, id);
    }
    return this.#http_client.request({
      method: "GET",
      path: `/internal-transfers/${encodeURIComponent(id)}`,
      config,
    });
  }
  /**
   * Lists internal transfers with optional filtering.
   * @param {ListInternalTransfersParams} [params] - Optional filter and pagination parameters
   * @param {RequestConfig} [config] - Optional request configuration (timeout, idempotencyKey, signal)
   * @returns {Promise<InternalTransferListResponse>} A paginated list of internal transfers
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
          destinationFinancialAccountId: params.destinationFinancialAccountId,
          financialTransactionReference: params.financialTransactionReference,
          limit: params.limit,
          after: params.after,
        }
      : undefined;
    return this.#http_client.request({
      method: "GET",
      path: "/internal-transfers",
      params: query_params,
      config,
    });
  }
  /**
   * Updates an internal transfer.
   * @param {string} id - The internal transfer ID (must start with "trn-")
   * @param {UpdateInternalTransferInput} input - Fields to update
   * @param {RequestConfig} [config] - Optional request configuration (timeout, idempotencyKey, signal)
   * @returns {Promise<InternalTransferResponse>} The updated internal transfer
   * @throws {MonimeValidationError} If validation fails
   * @throws {MonimeApiError} If the API returns an error
   */
  async update(id, input, config) {
    if (this.#http_client.should_validate) {
      validate(IdSchema, id);
      validate(UpdateInternalTransferInputSchema, input);
    }
    return this.#http_client.request({
      method: "PATCH",
      path: `/internal-transfers/${encodeURIComponent(id)}`,
      body: input,
      config,
    });
  }
  /**
   * Deletes an internal transfer.
   * @param {string} id - The internal transfer ID (must start with "trn-")
   * @param {RequestConfig} [config] - Optional request configuration (timeout, idempotencyKey, signal)
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
      path: `/internal-transfers/${encodeURIComponent(id)}`,
      config,
    });
  }
}

export { InternalTransferModule };
