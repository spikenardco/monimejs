import { createHmac, timingSafeEqual } from "node:crypto";
import { MonimeWebhookVerificationError } from "./errors.js";

/** @typedef {import("./http-client.js").MonimeHttpClient} MonimeHttpClient */
/** @typedef {import("./index.d.ts").ApiDeleteResponse} ApiDeleteResponse */
/** @typedef {import("./index.d.ts").ApiListResponse<import("./index.d.ts").Webhook>} WebhookListResponse */
/** @typedef {import("./index.d.ts").ApiResponse<import("./index.d.ts").Webhook>} WebhookResponse */
/** @typedef {import("./index.d.ts").CreateWebhookInput} CreateWebhookInput */
/** @typedef {import("./index.d.ts").ListWebhooksParams} ListWebhooksParams */
/** @typedef {import("./index.d.ts").RequestConfig} RequestConfig */
/** @typedef {import("./index.d.ts").UpdateWebhookInput} UpdateWebhookInput */
/** @typedef {import("./index.d.ts").WebhookEvent} WebhookEvent */
/** @typedef {import("./index.d.ts").WebhookVerificationErrorReason} WebhookVerificationErrorReason */

const DEFAULT_SIGNATURE_TOLERANCE_SECONDS = 300;

/**
 * @param {WebhookVerificationErrorReason} reason
 * @param {string} message
 * @returns {never}
 */
function throw_verification_error(reason, message) {
  throw new MonimeWebhookVerificationError(message, reason);
}

/**
 * @param {string} signature_header
 * @returns {{ timestamp_text: string, signature: Buffer }}
 */
function parse_signature_header(signature_header) {
  if (typeof signature_header !== "string") {
    throw_verification_error(
      "signature_header_invalid",
      "The Monime-Signature header is invalid.",
    );
  }

  const fields = new Map();
  const parts = signature_header.split(",");
  if (parts.length !== 2) {
    throw_verification_error(
      "signature_header_invalid",
      "The Monime-Signature header is invalid.",
    );
  }

  for (const part of parts) {
    const separator_index = part.indexOf("=");
    const key = part.slice(0, separator_index).trim();
    const value = part.slice(separator_index + 1).trim();
    if (key !== "t" && key !== "v1") {
      throw_verification_error(
        "signature_header_invalid",
        "The Monime-Signature header is invalid.",
      );
    }
    fields.set(key, value);
  }

  const timestamp_text = fields.get("t");
  const signature_text = fields.get("v1");
  if (timestamp_text === undefined || signature_text === undefined) {
    throw_verification_error(
      "signature_header_invalid",
      "The Monime-Signature header is invalid.",
    );
  }

  if (
    !/^(0|[1-9]\d*)$/.test(timestamp_text) ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(signature_text)
  ) {
    throw_verification_error(
      "signature_header_invalid",
      "The Monime-Signature header is invalid.",
    );
  }

  const timestamp = Number(timestamp_text);
  const signature = Buffer.from(signature_text, "base64");
  if (
    !Number.isSafeInteger(timestamp) ||
    signature.length !== 32 ||
    signature.toString("base64") !== signature_text
  ) {
    throw_verification_error(
      "signature_header_invalid",
      "The Monime-Signature header is invalid.",
    );
  }

  return { timestamp_text, signature };
}

/**
 * @param {string | Buffer} rawBody
 * @param {string} signatureHeader
 * @param {string} webhookSecret
 * @returns {WebhookEvent}
 */
function verify_webhook_signature(rawBody, signatureHeader, webhookSecret) {
  if (typeof rawBody !== "string" && !Buffer.isBuffer(rawBody)) {
    throw new TypeError("rawBody must be a string or Buffer.");
  }

  const { timestamp_text, signature } = parse_signature_header(signatureHeader);
  const timestamp = Number(timestamp_text);
  const current_timestamp = Math.floor(Date.now() / 1000);
  if (
    Math.abs(current_timestamp - timestamp) >
    DEFAULT_SIGNATURE_TOLERANCE_SECONDS
  ) {
    throw_verification_error(
      "timestamp_outside_tolerance",
      "Webhook timestamp is outside the allowed range.",
    );
  }

  const raw_body = Buffer.isBuffer(rawBody)
    ? rawBody
    : Buffer.from(rawBody, "utf8");
  const signed_payload = Buffer.concat([
    Buffer.from(`${timestamp_text}_`, "utf8"),
    raw_body,
  ]);
  const expected_signature = createHmac("sha256", webhookSecret)
    .update(signed_payload)
    .digest();
  if (!timingSafeEqual(expected_signature, signature)) {
    throw_verification_error(
      "signature_mismatch",
      "Webhook signature does not match.",
    );
  }

  try {
    const event = JSON.parse(raw_body.toString("utf8"));
    if (event === null || typeof event !== "object" || Array.isArray(event)) {
      throw new TypeError("Webhook event must be an object.");
    }
    return /** @type {WebhookEvent} */ (event);
  } catch {
    throw_verification_error(
      "payload_invalid",
      "Webhook body is not valid JSON.",
    );
  }
}

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
 * - HS256 request signature verification
 * - Automatic retry with exponential backoff
 * - Configurable timeout settings
 * - Enable/disable endpoints without deletion
 *
 * @see {@link https://docs.monime.io/apis/versions/caph-2025-08-23/webhook/object} Webhooks API Documentation
 */
class WebhookModule {
  /** @type {MonimeHttpClient} */
  #http_client;
  /** @type {string | undefined} */
  #webhook_secret;

  /**
   * @param {MonimeHttpClient} http_client
   * @param {string | undefined} webhook_secret
   */
  constructor(http_client, webhook_secret) {
    this.#http_client = http_client;
    this.#webhook_secret = webhook_secret;
  }
  /**
   * Creates a new webhook.
   * @param {CreateWebhookInput} input - Webhook configuration including URL and events
   * @param {RequestConfig} [config] - Optional request configuration (timeout, idempotencyKey, signal)
   * @returns {Promise<WebhookResponse>} The created webhook
   * @throws {MonimeApiError} If the API returns an error
   */
  async create(input, config) {
    return this.#http_client.request({
      method: "POST",
      path: "/webhooks",
      body: input,
      config,
    });
  }
  /**
   * Retrieves a webhook by ID.
   * @param {string} id - The webhook ID
   * @param {RequestConfig} [config] - Optional request configuration (timeout, idempotencyKey, signal)
   * @returns {Promise<WebhookResponse>} The webhook
   * @throws {MonimeApiError} If the API returns an error
   */
  async get(id, config) {
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
   * @throws {MonimeApiError} If the API returns an error
   */
  async list(params, config) {
    return this.#http_client.request({
      method: "GET",
      path: "/webhooks",
      params,
      config,
    });
  }
  /**
   * Updates a webhook.
   * @param {string} id - The webhook ID
   * @param {UpdateWebhookInput} input - Fields to update
   * @param {RequestConfig} [config] - Optional request configuration (timeout, idempotencyKey, signal)
   * @returns {Promise<WebhookResponse>} The updated webhook
   * @throws {MonimeApiError} If the API returns an error
   */
  async update(id, input, config) {
    return this.#http_client.request({
      method: "PATCH",
      path: `/webhooks/${encodeURIComponent(id)}`,
      body: input,
      config,
    });
  }
  /**
   * Deletes a webhook. This action is irreversible.
   * @param {string} id - The webhook ID
   * @param {RequestConfig} [config] - Optional request configuration (timeout, idempotencyKey, signal)
   * @returns {Promise<ApiDeleteResponse>} Confirmation of deletion
   * @throws {MonimeApiError} If the API returns an error
   */
  async delete(id, config) {
    return this.#http_client.request({
      method: "DELETE",
      path: `/webhooks/${encodeURIComponent(id)}`,
      config,
    });
  }

  /**
   * Verifies the signature of an incoming webhook request.
   *
   * The raw body must be the exact bytes received from Monime. Parsing and
   * re-serializing JSON before verification changes the signed payload.
   * This method supports HS256 signatures only. Monime has not published the
   * delivery details needed to verify ES256 signatures.
   *
   * @param {string | Buffer} rawBody - Exact request body
   * @param {string} signatureHeader - Complete Monime-Signature header value
   * @returns {WebhookEvent} The authenticated, decoded webhook event
   * @throws {TypeError} If caller-provided arguments are invalid
   * @throws {MonimeWebhookVerificationError} If verification or JSON decoding fails
   * @see {@link https://docs.monime.io/guide/webhook/hmac-verification}
   */
  verify(rawBody, signatureHeader) {
    const secret = this.#webhook_secret;
    if (secret === undefined) {
      throw new TypeError(
        "Configure webhookSecret before verifying webhook signatures.",
      );
    }
    return verify_webhook_signature(rawBody, signatureHeader, secret);
  }
}

/**
 * Standalone webhook signature verification.
 *
 * Use this when you don't have (or don't want) a full MonimeClient instance.
 * Verify incoming Monime webhook requests directly with just the secret.
 *
 * @param {string | Buffer} rawBody - Exact request body bytes
 * @param {string} signatureHeader - Complete Monime-Signature header value
 * @param {string} webhookSecret - Your webhook signing secret (from Monime dashboard)
 * @returns {WebhookEvent} The authenticated, decoded webhook event
 * @throws {TypeError} If arguments are invalid
 * @throws {MonimeWebhookVerificationError} If verification fails
 */
function verifyWebhookSignature(rawBody, signatureHeader, webhookSecret) {
  if (typeof webhookSecret !== "string" || webhookSecret.length < 32) {
    throw new TypeError(
      "webhookSecret must be a string at least 32 characters long.",
    );
  }
  return verify_webhook_signature(rawBody, signatureHeader, webhookSecret);
}

export { verifyWebhookSignature, WebhookModule };
