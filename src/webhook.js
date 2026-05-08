import {
  CreateWebhookInputSchema,
  IdSchema,
  LimitSchema,
  UpdateWebhookInputSchema,
  validate,
} from "./validation.js";

/** @typedef {import("./http-client.js").MonimeHttpClient} MonimeHttpClient */
/** @typedef {import("./index.d.ts").ApiDeleteResponse} ApiDeleteResponse */
/** @typedef {import("./index.d.ts").ApiListResponse<import("./index.d.ts").Webhook>} WebhookListResponse */
/** @typedef {import("./index.d.ts").ApiResponse<import("./index.d.ts").Webhook>} WebhookResponse */
/** @typedef {import("./index.d.ts").CreateWebhookInput} CreateWebhookInput */
/** @typedef {import("./index.d.ts").ListWebhooksParams} ListWebhooksParams */
/** @typedef {import("./index.d.ts").RequestConfig} RequestConfig */
/** @typedef {import("./index.d.ts").UpdateWebhookInput} UpdateWebhookInput */

/**
 * Module for managing webhooks.
 *
 * Webhooks enable real-time HTTP notifications when events occur in your Monime
 * account. Configure endpoints to receive instant updates about payments, payouts,
 * and other transactions, eliminating the need for polling.
 *
 * Supported events:
 * - payment.created, payment.completed
 * - payout.created, payout.completed, payout.failed
 * - checkout_session.completed
 * - internal_transfer.completed
 *
 * Security features:
 * - Request signatures for verification (HS256 HMAC or ES256 ECDSA)
 * - Automatic retry with exponential backoff
 * - Configurable timeout settings
 * - Enable/disable endpoints without deletion
 *
 * @see {@link https://docs.monime.io/apis/versions/caph-2025-08-23/webhook/object} Webhooks API Documentation
 */
class WebhookModule {
  /** @type {MonimeHttpClient} */
  #http_client;

  /** @param {MonimeHttpClient} http_client */
  constructor(http_client) {
    this.#http_client = http_client;
  }
  /**
   * Creates a new webhook.
   * @param {CreateWebhookInput} input - Webhook configuration including URL and events
   * @param {RequestConfig} [config] - Optional request configuration (timeout, idempotencyKey, signal)
   * @returns {Promise<WebhookResponse>} The created webhook
   * @throws {MonimeValidationError} If input validation fails
   * @throws {MonimeApiError} If the API returns an error
   * @deprecated - Create webhook from the dashboard instead. this is not guaranteed to work.
   */
  async create(input, config) {
    if (this.#http_client.should_validate) {
      validate(CreateWebhookInputSchema, input);
    }
    return this.#http_client.request({
      method: "POST",
      path: "/webhooks",
      body: input,
      config,
    });
  }
  /**
   * Retrieves a webhook by ID.
   * @param {string} id - The webhook ID (must start with "whk-")
   * @param {RequestConfig} [config] - Optional request configuration (timeout, idempotencyKey, signal)
   * @returns {Promise<WebhookResponse>} The webhook
   * @throws {MonimeValidationError} If ID validation fails
   * @throws {MonimeApiError} If the API returns an error
   */
  async get(id, config) {
    if (this.#http_client.should_validate) {
      validate(IdSchema, id);
    }
    return this.#http_client.request({
      method: "GET",
      path: `/webhooks/${encodeURIComponent(id)}`,
      config,
    });
  }
  /**
   * Lists webhooks with optional pagination.
   * @param {ListWebhooksParams} [params] - Optional pagination parameters
   * @param {RequestConfig} [config] - Optional request configuration (timeout, idempotencyKey, signal)
   * @returns {Promise<WebhookListResponse>} A paginated list of webhooks
   * @throws {MonimeValidationError} If params validation fails
   * @throws {MonimeApiError} If the API returns an error
   */
  async list(params, config) {
    if (this.#http_client.should_validate && params?.limit !== undefined) {
      validate(LimitSchema, params.limit);
    }
    const query_params = params
      ? {
          limit: params.limit,
          after: params.after,
        }
      : undefined;
    return this.#http_client.request({
      method: "GET",
      path: "/webhooks",
      params: query_params,
      config,
    });
  }
  /**
   * Updates a webhook.
   * @param {string} id - The webhook ID (must start with "whk-")
   * @param {UpdateWebhookInput} input - Fields to update
   * @param {RequestConfig} [config] - Optional request configuration (timeout, idempotencyKey, signal)
   * @returns {Promise<WebhookResponse>} The updated webhook
   * @throws {MonimeValidationError} If validation fails
   * @throws {MonimeApiError} If the API returns an error
   */
  async update(id, input, config) {
    if (this.#http_client.should_validate) {
      validate(IdSchema, id);
      validate(UpdateWebhookInputSchema, input);
    }
    return this.#http_client.request({
      method: "PATCH",
      path: `/webhooks/${encodeURIComponent(id)}`,
      body: input,
      config,
    });
  }
  /**
   * Deletes a webhook.
   * @param {string} id - The webhook ID (must start with "whk-")
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
      path: `/webhooks/${encodeURIComponent(id)}`,
      config,
    });
  }
}

export { WebhookModule };
