/** @typedef {import("./http-client.js").MonimeHttpClient} MonimeHttpClient */
/** @typedef {import("./index.d.ts").ApiDeleteResponse} ApiDeleteResponse */
/** @typedef {import("./index.d.ts").ApiListResponse<import("./index.d.ts").CheckoutSession>} CheckoutSessionListResponse */
/** @typedef {import("./index.d.ts").ApiResponse<import("./index.d.ts").CheckoutSession>} CheckoutSessionResponse */
/** @typedef {import("./index.d.ts").CreateCheckoutSessionInput} CreateCheckoutSessionInput */
/** @typedef {import("./index.d.ts").ListCheckoutSessionsParams} ListCheckoutSessionsParams */
/** @typedef {import("./index.d.ts").RequestConfig} RequestConfig */

/**
 * Module for managing checkout sessions.
 *
 * Checkout sessions provide hosted payment pages for e-commerce integrations.
 * Create a session with line items and redirect customers to a Monime-hosted
 * checkout page that handles the entire payment flow.
 *
 * Features:
 * - Hosted payment pages with customizable branding
 * - Support for multiple line items (products, fees, discounts)
 * - Automatic receipt generation
 * - Success and cancel URL redirects
 * - Session expiration controls
 * - Payment method selection (mobile money, bank transfer)
 *
 * @see {@link https://docs.monime.io/apis/versions/caph-2025-08-23/checkout-session/object} Checkout Sessions API Documentation
 */
class CheckoutSessionModule {
  /** @type {MonimeHttpClient} */
  #http_client;

  /** @param {MonimeHttpClient} http_client */
  constructor(http_client) {
    this.#http_client = http_client;
  }
  /**
   * Creates a new checkout session.
   * @param {CreateCheckoutSessionInput} input - Checkout session configuration including line items
   * @param {RequestConfig} [config] - Optional request configuration (timeout, idempotencyKey, signal)
   * @returns {Promise<CheckoutSessionResponse>} The created checkout session with redirect URL
   * @throws {MonimeApiError} If the API returns an error
   */
  async create(input, config) {
    return this.#http_client.request({
      method: "POST",
      path: "/checkout-sessions",
      body: input,
      config,
    });
  }
  /**
   * Retrieves a checkout session by ID.
   * @param {string} id - The checkout session ID
   * @param {RequestConfig} [config] - Optional request configuration
   * @returns {Promise<CheckoutSessionResponse>} The checkout session
   * @throws {MonimeApiError} If the API returns an error
   */
  async get(id, config) {
    return this.#http_client.request({
      method: "GET",
      path: `/checkout-sessions/${encodeURIComponent(id)}`,
      config,
    });
  }
  /**
   * Lists checkout sessions with optional pagination.
   * @param {ListCheckoutSessionsParams} [params] - Optional pagination parameters
   * @param {RequestConfig} [config] - Optional request configuration
   * @returns {Promise<CheckoutSessionListResponse>} A paginated list of checkout sessions
   * @throws {MonimeApiError} If the API returns an error
   */
  async list(params, config) {
    return this.#http_client.request({
      method: "GET",
      path: "/checkout-sessions",
      params,
      config,
    });
  }
  /**
   * Deletes a checkout session.
   * @param {string} id - The checkout session ID
   * @param {RequestConfig} [config] - Optional request configuration
   * @returns {Promise<ApiDeleteResponse>} Confirmation of deletion
   * @throws {MonimeApiError} If the API returns an error
   */
  async delete(id, config) {
    return this.#http_client.request({
      method: "DELETE",
      path: `/checkout-sessions/${encodeURIComponent(id)}`,
      config,
    });
  }
}

export { CheckoutSessionModule };
