/** @typedef {import("./http-client.js").MonimeHttpClient} MonimeHttpClient */
/** @typedef {import("./index.d.ts").ApiListResponse<import("./index.d.ts").Payment>} PaymentListResponse */
/** @typedef {import("./index.d.ts").ApiResponse<import("./index.d.ts").Payment>} PaymentResponse */
/** @typedef {import("./index.d.ts").ListPaymentsParams} ListPaymentsParams */
/** @typedef {import("./index.d.ts").RequestConfig} RequestConfig */
/** @typedef {import("./index.d.ts").UpdatePaymentInput} UpdatePaymentInput */

/**
 * Module for managing payments.
 *
 * Payments represent customer payment transactions. Their status can be pending,
 * processing, or completed. This module retrieves, lists, and partially updates
 * payment records.
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
   * @throws {MonimeApiError} If the API returns an error
   */
  async get(id, config) {
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
   * @throws {MonimeApiError} If the API returns an error
   */
  async list(params, config) {
    return this.#http_client.request({
      method: "GET",
      path: "/payments",
      params,
      config,
    });
  }
  /**
   * Updates a payment.
   * @param {string} id - The payment ID
   * @param {UpdatePaymentInput} input - Fields to update
   * @param {RequestConfig} [config] - Optional request configuration
   * @returns {Promise<PaymentResponse>} The updated payment
   * @throws {MonimeApiError} If the API returns an error
   */
  async update(id, input, config) {
    return this.#http_client.request({
      method: "PATCH",
      path: `/payments/${encodeURIComponent(id)}`,
      body: input,
      config,
    });
  }
}

export { PaymentModule };
