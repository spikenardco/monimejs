import {
  ProviderKycAccountIdSchema,
  ProviderKycProviderIdSchema,
  validate,
} from "./validation.js";

/** @typedef {import("./http-client.js").MonimeHttpClient} MonimeHttpClient */
/** @typedef {import("./index.d.ts").ApiResponse<import("./index.d.ts").ProviderKyc>} ProviderKycResponse */
/** @typedef {import("./index.d.ts").GetProviderKycParams} GetProviderKycParams */
/** @typedef {import("./index.d.ts").RequestConfig} RequestConfig */

/**
 * Module for retrieving Know-Your-Customer (KYC) information from financial
 * providers.
 *
 * Looks up the KYC profile registered with a specific Mobile Money operator,
 * bank, or wallet provider for a given account. Useful for confirming the
 * legal holder name behind a phone number or bank account before initiating
 * a payout or transfer.
 *
 * Returned data includes:
 * - The account's id, display name, holder name, and metadata as known to the provider
 * - The provider's id, type (`momo`, `bank`, `wallet`), and display name
 *
 * Common use cases:
 * - Verify the registered holder name before paying out to a phone number
 * - Pre-fill recipient details in a transfer UI
 * - Reconcile beneficiary identity against your own records
 *
 * @see {@link https://docs.monime.io/apis/versions/caph-2025-08-23/provider-kyc/object} Provider KYC API Documentation
 */
class ProviderKycModule {
  /** @type {MonimeHttpClient} */
  #http_client;

  /** @param {MonimeHttpClient} http_client */
  constructor(http_client) {
    this.#http_client = http_client;
  }
  /**
   * Retrieves the KYC profile of an account from a specified provider.
   * @param {string} providerId - The Monime-assigned provider ID (e.g., "m17")
   * @param {GetProviderKycParams} params - Query parameters; must include `accountId`
   * @param {RequestConfig} [config] - Optional request configuration (timeout, idempotencyKey, signal)
   * @returns {Promise<ProviderKycResponse>} The provider KYC profile
   * @throws {MonimeValidationError} If validation fails
   * @throws {MonimeApiError} If the API returns an error
   */
  async get(providerId, params, config) {
    if (this.#http_client.should_validate) {
      validate(ProviderKycProviderIdSchema, providerId);
      validate(ProviderKycAccountIdSchema, params?.accountId);
    }
    return this.#http_client.request({
      method: "GET",
      path: `/provider-kyc/${encodeURIComponent(providerId)}`,
      params: { accountId: params.accountId },
      config,
    });
  }
}

export { ProviderKycModule };
