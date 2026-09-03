/** @typedef {import("./http-client.js").MonimeHttpClient} MonimeHttpClient */
/** @typedef {import("./index.d.ts").ApiListResponse<import("./index.d.ts").FinancialAccount>} FinancialAccountListResponse */
/** @typedef {import("./index.d.ts").ApiResponse<import("./index.d.ts").FinancialAccount>} FinancialAccountResponse */
/** @typedef {import("./index.d.ts").CreateFinancialAccountInput} CreateFinancialAccountInput */
/** @typedef {import("./index.d.ts").GetFinancialAccountParams} GetFinancialAccountParams */
/** @typedef {import("./index.d.ts").ListFinancialAccountsParams} ListFinancialAccountsParams */
/** @typedef {import("./index.d.ts").RequestConfig} RequestConfig */
/** @typedef {import("./index.d.ts").UpdateFinancialAccountInput} UpdateFinancialAccountInput */

/**
 * Module for managing financial accounts.
 *
 * Financial accounts are digital wallets that hold and track funds in your Monime
 * workspace. Each account maintains its own balance, transaction history, and
 * unique identifiers for receiving funds.
 *
 * Account features:
 * - Single currency per account (SLE or USD)
 * - UVAN (Universal Virtual Account Number) for receiving transfers
 * - Real-time balance tracking
 * - Complete transaction ledger
 * - Customizable reference IDs and metadata
 *
 * Use cases:
 * - Separate accounts for different business units or departments
 * - Collection accounts dedicated to receiving customer payments
 * - Disbursement accounts for managing payouts
 * - Escrow or reserve accounts for holding funds
 * - Multi-tenant systems with account-per-customer architecture
 *
 * @see {@link https://docs.monime.io/apis/versions/caph-2025-08-23/financial-account/object} Financial Accounts API Documentation
 */
class FinancialAccountModule {
  /** @type {MonimeHttpClient} */
  #http_client;

  /** @param {MonimeHttpClient} http_client */
  constructor(http_client) {
    this.#http_client = http_client;
  }
  /**
   * Creates a new financial account.
   * @param {CreateFinancialAccountInput} input - Financial account configuration including name and currency
   * @param {RequestConfig} [config] - Optional request configuration (timeout, idempotencyKey, signal)
   * @returns {Promise<FinancialAccountResponse>} The created financial account
   * @throws {MonimeApiError} If the API returns an error
   */
  async create(input, config) {
    return this.#http_client.request({
      method: "POST",
      path: "/financial-accounts",
      body: input,
      config,
    });
  }
  /**
   * Retrieves a financial account by ID.
   * @param {string} id - The financial account ID
   * @param {GetFinancialAccountParams} [params] - Optional parameters
   * @param {RequestConfig} [config] - Optional request configuration (timeout, idempotencyKey, signal)
   * @returns {Promise<FinancialAccountResponse>} The financial account
   * @throws {MonimeApiError} If the API returns an error
   */
  async get(id, params, config) {
    return this.#http_client.request({
      method: "GET",
      path: `/financial-accounts/${encodeURIComponent(id)}`,
      params,
      config,
    });
  }
  /**
   * Lists financial accounts with optional filtering.
   * @param {ListFinancialAccountsParams} [params] - Optional filter and pagination parameters
   * @param {RequestConfig} [config] - Optional request configuration (timeout, idempotencyKey, signal)
   * @returns {Promise<FinancialAccountListResponse>} A paginated list of financial accounts
   * @throws {MonimeApiError} If the API returns an error
   */
  async list(params, config) {
    return this.#http_client.request({
      method: "GET",
      path: "/financial-accounts",
      params,
      config,
    });
  }
  /**
   * Updates a financial account.
   * @param {string} id - The financial account ID
   * @param {UpdateFinancialAccountInput} input - Fields to update
   * @param {RequestConfig} [config] - Optional request configuration (timeout, idempotencyKey, signal)
   * @returns {Promise<FinancialAccountResponse>} The updated financial account
   * @throws {MonimeApiError} If the API returns an error
   */
  async update(id, input, config) {
    return this.#http_client.request({
      method: "PATCH",
      path: `/financial-accounts/${encodeURIComponent(id)}`,
      body: input,
      config,
    });
  }
}

export { FinancialAccountModule };
