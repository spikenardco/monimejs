import {
  BankProviderIdSchema,
  CountryCodeSchema,
  LimitSchema,
  validate,
} from "./validation.js";

/** @typedef {import("./http-client.js").MonimeHttpClient} MonimeHttpClient */
/** @typedef {import("./index.d.ts").ApiListResponse<import("./index.d.ts").Bank>} BankListResponse */
/** @typedef {import("./index.d.ts").ApiResponse<import("./index.d.ts").Bank>} BankResponse */
/** @typedef {import("./index.d.ts").ListBanksParams} ListBanksParams */
/** @typedef {import("./index.d.ts").RequestConfig} RequestConfig */

/**
 * Module for retrieving bank provider information.
 *
 * Provides read-only access to the directory of supported bank providers across
 * different countries. Use this module to discover available banks for payouts,
 * populate selection interfaces, or validate provider IDs before creating transactions.
 *
 * Provider information includes:
 * - Unique provider ID and display name
 * - Country of operation
 * - Supported capabilities (payouts, payments, KYC verification)
 * - Current operational status
 * - Integration metadata
 *
 * Use cases:
 * - Build bank selection dropdowns for payout forms
 * - Validate provider IDs before initiating transfers
 * - Display available banking options by country
 * - Filter banks by supported features
 * - Check operational status before transactions
 *
 * @see {@link https://docs.monime.io/apis/versions/caph-2025-08-23/bank/object} Banks API Documentation
 */
class BankModule {
  /** @type {MonimeHttpClient} */
  #http_client;

  /** @param {MonimeHttpClient} http_client */
  constructor(http_client) {
    this.#http_client = http_client;
  }
  /**
   * Lists banks available in a specified country.
   * @param {ListBanksParams} params - Filter and pagination parameters
   * @param {RequestConfig} [config] - Optional request configuration
   * @returns {Promise<BankListResponse>} A paginated list of banks
   * @throws {MonimeValidationError} If params validation fails
   * @throws {MonimeApiError} If the API returns an error
   */
  async list(params, config) {
    if (this.#http_client.should_validate) {
      validate(CountryCodeSchema, params.country);
      if (params.limit !== undefined) {
        validate(LimitSchema, params.limit);
      }
    }
    const query_params = {
      country: params.country,
      limit: params.limit,
      after: params.after,
    };
    return this.#http_client.request({
      method: "GET",
      path: "/banks",
      params: query_params,
      config,
    });
  }
  /**
   * Retrieves a bank by its provider ID.
   * @param {string} providerId - The bank provider ID
   * @param {RequestConfig} [config] - Optional request configuration
   * @returns {Promise<BankResponse>} The bank
   * @throws {MonimeValidationError} If providerId validation fails
   * @throws {MonimeApiError} If the API returns an error
   */
  async get(providerId, config) {
    if (this.#http_client.should_validate) {
      validate(BankProviderIdSchema, providerId);
    }
    return this.#http_client.request({
      method: "GET",
      path: `/banks/${encodeURIComponent(providerId)}`,
      config,
    });
  }
}

export { BankModule };
