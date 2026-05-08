import {
  IdSchema,
  LimitSchema,
  UpdatePaymentInputSchema,
  validate,
} from "./validation.js";

/** @typedef {import("./http-client.js").MonimeHttpClient} MonimeHttpClient */
/** @typedef {import("./index.d.ts").ApiListResponse<import("./index.d.ts").Payment>} PaymentListResponse */
/** @typedef {import("./index.d.ts").ApiResponse<import("./index.d.ts").Payment>} PaymentResponse */
/** @typedef {import("./index.d.ts").ListPaymentsParams} ListPaymentsParams */
/** @typedef {import("./index.d.ts").RequestConfig} RequestConfig */
/** @typedef {import("./index.d.ts").UpdatePaymentInput} UpdatePaymentInput */

/**
 * Module for managing payments.
 *
 * Payments represent completed payment transactions from customers. This module
 * provides read-only access to view and query payment records. Payments are
 * automatically created when customers complete transactions via payment codes,
 * checkout sessions, or other payment channels.
 *
 * Features:
 * - View payment details and status
 * - Track payment sources (payment code, checkout session)
 * - Filter by order number or financial account
 * - Access transaction references for accounting
 * - Update metadata for record keeping
 *
 * @see {@link https://docs.monime.io/apis/versions/caph-2025-08-23/payment/object} Payments API Documentation
 */
class PaymentModule {
  /** @type {MonimeHttpClient} */
  #http_client;

  /** @param {MonimeHttpClient} http_client */
  constructor(http_client) {
    this.#http_client = http_client;
  }
  /**
   * Retrieves a payment by ID.
   * @param {string} id - The payment ID
   * @param {RequestConfig} [config] - Optional request configuration
   * @returns {Promise<PaymentResponse>} The payment
   * @throws {MonimeValidationError} If ID validation fails
   * @throws {MonimeApiError} If the API returns an error
   */
  async get(id, config) {
    if (this.#http_client.should_validate) {
      validate(IdSchema, id);
    }
    return this.#http_client.request({
      method: "GET",
      path: `/payments/${encodeURIComponent(id)}`,
      config,
    });
  }
  /**
   * Lists payments with optional filtering and pagination.
   * @param {ListPaymentsParams} [params] - Optional filter and pagination parameters
   * @param {RequestConfig} [config] - Optional request configuration
   * @returns {Promise<PaymentListResponse>} A paginated list of payments
   * @throws {MonimeValidationError} If params validation fails
   * @throws {MonimeApiError} If the API returns an error
   */
  async list(params, config) {
    if (this.#http_client.should_validate && params?.limit !== undefined) {
      validate(LimitSchema, params.limit);
    }
    const query_params = params
      ? {
          orderNumber: params.orderNumber,
          financialAccountId: params.financialAccountId,
          financialTransactionReference: params.financialTransactionReference,
          limit: params.limit,
          after: params.after,
        }
      : undefined;
    return this.#http_client.request({
      method: "GET",
      path: "/payments",
      params: query_params,
      config,
    });
  }
  /**
   * Updates a payment.
   * @param {string} id - The payment ID
   * @param {UpdatePaymentInput} input - Fields to update
   * @param {RequestConfig} [config] - Optional request configuration
   * @returns {Promise<PaymentResponse>} The updated payment
   * @throws {MonimeValidationError} If validation fails
   * @throws {MonimeApiError} If the API returns an error
   */
  async update(id, input, config) {
    if (this.#http_client.should_validate) {
      validate(IdSchema, id);
      validate(UpdatePaymentInputSchema, input);
    }
    return this.#http_client.request({
      method: "PATCH",
      path: `/payments/${encodeURIComponent(id)}`,
      body: input,
      config,
    });
  }
}

export { PaymentModule };
