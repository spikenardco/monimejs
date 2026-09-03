/** @typedef {import("./http-client.js").MonimeHttpClient} MonimeHttpClient */
/** @typedef {import("./index.d.ts").ApiListResponse<import("./index.d.ts").Momo>} MomoListResponse */
/** @typedef {import("./index.d.ts").ApiResponse<import("./index.d.ts").Momo>} MomoResponse */
/** @typedef {import("./index.d.ts").ListMomosParams} ListMomosParams */
/** @typedef {import("./index.d.ts").RequestConfig} RequestConfig */

/**
 * Module for retrieving mobile money provider information.
 *
 * Provides read-only access to the directory of supported mobile money (MoMo)
 * providers across different countries. Use this module to discover available
 * mobile money networks, populate provider selection interfaces, or validate
 * provider IDs before creating payment or payout transactions.
 *
 * Provider information includes:
 * - Unique provider ID and display name
 * - Country of operation
 * - Supported capabilities (payouts, payments, KYC verification)
 * - Current operational status
 * - Network metadata
 *
 * Use cases:
 * - Build mobile money provider selection dropdowns
 * - Validate provider IDs before payment or payout requests
 * - Display available MoMo networks by country
 * - Filter providers by supported features
 * - Check operational status before transactions
 *
 * @see {@link https://docs.monime.io/apis/versions/caph-2025-08-23/momo/object} Mobile Money Providers API Documentation
 */
class MomoModule {
  /** @type {MonimeHttpClient} */
  #http_client;

  /** @param {MonimeHttpClient} http_client */
  constructor(http_client) {
    this.#http_client = http_client;
  }
  /**
   * Lists mobile money providers available in a specified country.
   * @param {ListMomosParams} params - Filter and pagination parameters
   * @param {RequestConfig} [config] - Optional request configuration
   * @returns {Promise<MomoListResponse>} A paginated list of mobile money providers
   * @throws {MonimeApiError} If the API returns an error
   */
  async list(params, config) {
    return this.#http_client.request({
      method: "GET",
      path: "/momos",
      params,
      config,
    });
  }
  /**
   * Retrieves a mobile money provider by its provider ID.
   * @param {string} providerId - The mobile money provider ID
   * @param {RequestConfig} [config] - Optional request configuration
   * @returns {Promise<MomoResponse>} The mobile money provider
   * @throws {MonimeApiError} If the API returns an error
   */
  async get(providerId, config) {
    return this.#http_client.request({
      method: "GET",
      path: `/momos/${encodeURIComponent(providerId)}`,
      config,
    });
  }
}

export { MomoModule };
