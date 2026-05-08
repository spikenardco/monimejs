import { IdSchema, LimitSchema, validate } from "./validation.js";

/** @typedef {import("./http-client.js").MonimeHttpClient} MonimeHttpClient */
/** @typedef {import("./index.d.ts").ApiListResponse<import("./index.d.ts").FinancialTransaction>} FinancialTransactionListResponse */
/** @typedef {import("./index.d.ts").ApiResponse<import("./index.d.ts").FinancialTransaction>} FinancialTransactionResponse */
/** @typedef {import("./index.d.ts").ListFinancialTransactionsParams} ListFinancialTransactionsParams */
/** @typedef {import("./index.d.ts").RequestConfig} RequestConfig */

/**
 * Module for viewing financial transactions.
 *
 * Financial transactions are immutable ledger entries that record every fund movement
 * across your financial accounts. This module provides read-only access to the complete
 * transaction history for accounting, reconciliation, and audit purposes.
 *
 * Transaction types:
 * - "credit": Money incoming (payments, refunds, transfers in)
 * - "debit": Money outgoing (payouts, fees, transfers out)
 *
 * Each transaction includes:
 * - Precise amount and timestamp
 * - Account balance after the transaction
 * - Reference to the source operation (payment, payout, transfer, etc.)
 * - Unique transaction reference for reconciliation
 * - Metadata for custom tracking
 *
 * Use cases:
 * - Generate account statements
 * - Reconcile with external accounting systems
 * - Track fund flows across accounts
 * - Audit financial operations
 * - Build reporting dashboards
 *
 * @see {@link https://docs.monime.io/apis/versions/caph-2025-08-23/financial-transaction/object} Financial Transactions API Documentation
 */
class FinancialTransactionModule {
  /** @type {MonimeHttpClient} */
  #http_client;

  /** @param {MonimeHttpClient} http_client */
  constructor(http_client) {
    this.#http_client = http_client;
  }
  /**
   * Retrieves a financial transaction by ID.
   * @param {string} id - The financial transaction ID
   * @param {RequestConfig} [config] - Optional request configuration
   * @returns {Promise<FinancialTransactionResponse>} The financial transaction
   * @throws {MonimeValidationError} If ID validation fails
   * @throws {MonimeApiError} If the API returns an error
   */
  async get(id, config) {
    if (this.#http_client.should_validate) {
      validate(IdSchema, id);
    }
    return this.#http_client.request({
      method: "GET",
      path: `/financial-transactions/${encodeURIComponent(id)}`,
      config,
    });
  }
  /**
   * Lists financial transactions with optional filtering.
   * @param {ListFinancialTransactionsParams} [params] - Optional filter and pagination parameters
   * @param {RequestConfig} [config] - Optional request configuration
   * @returns {Promise<FinancialTransactionListResponse>} A paginated list of financial transactions
   * @throws {MonimeValidationError} If params validation fails
   * @throws {MonimeApiError} If the API returns an error
   */
  async list(params, config) {
    if (this.#http_client.should_validate && params?.limit !== undefined) {
      validate(LimitSchema, params.limit);
    }
    const query_params = params
      ? {
          financialAccountId: params.financialAccountId,
          reference: params.reference,
          type: params.type,
          limit: params.limit,
          after: params.after,
        }
      : undefined;
    return this.#http_client.request({
      method: "GET",
      path: "/financial-transactions",
      params: query_params,
      config,
    });
  }
}

export { FinancialTransactionModule };
