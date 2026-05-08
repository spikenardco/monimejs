import {
  MonimeApiError,
  MonimeNetworkError,
  MonimeTimeoutError,
  MonimeValidationError,
} from "./errors.js";
import { ClientOptionsSchema, validate } from "./validation.js";

/** @typedef {import("./index.d.ts").ClientOptions} ClientOptions */
/** @typedef {import("./index.d.ts").RequestConfig} RequestConfig */

/** @typedef {"GET" | "POST" | "PATCH" | "DELETE"} HttpMethod */
/**
 * @typedef {object} RequestOptions
 * @property {HttpMethod} method
 * @property {string} path
 * @property {unknown} [body]
 * @property {Record<string, string | number | boolean | undefined> | undefined} [params]
 * @property {RequestConfig | undefined} [config]
 */
/**
 * @typedef {object} ApiErrorResponse
 * @property {false} success
 * @property {string[]} messages
 * @property {{ code: number, reason: string, message: string, details: unknown[] }} error
 */

const API_VERSION = "v1";

/** API version prefix for all endpoints */
/** @type {number} */
const DEFAULT_TIMEOUT = 3e4;
/** @type {number} */
const DEFAULT_RETRIES = 2;
/** @type {number} */
const DEFAULT_RETRY_DELAY = 1e3;
/** @type {number} */
const DEFAULT_RETRY_BACKOFF = 2;
/** @type {string} */
const DEFAULT_BASE_URL = "https://api.monime.io";

/**
 * Internal HTTP client for making requests to the Monime API.
 * Handles authentication, retries, timeouts, and error handling.
 */
class MonimeHttpClient {
  /** @type {string} */
  #base_url;
  /** @type {string} */
  #space_id;
  /** @type {string} */
  #access_token;
  /** @type {number} */
  #timeout;
  /** @type {number} */
  #retries;
  /** @type {number} */
  #retry_delay;
  /** @type {number} */
  #retry_backoff;
  /** @type {boolean} */
  #validate_inputs;

  /** @param {ClientOptions} options */
  constructor(options) {
    if (
      options.baseUrl !== undefined &&
      !options.baseUrl.startsWith("https://")
    ) {
      throw new MonimeValidationError("baseUrl must use HTTPS for security", [
        {
          message: "baseUrl must use HTTPS for security",
          field: "baseUrl",
          value: options.baseUrl,
        },
      ]);
    }
    if (options.validateInputs !== false) {
      validate(ClientOptionsSchema, options);
    }
    this.#base_url = options.baseUrl ?? DEFAULT_BASE_URL;
    this.#space_id = options.spaceId;
    this.#access_token = options.accessToken;
    this.#timeout = options.timeout ?? DEFAULT_TIMEOUT;
    this.#retries = options.retries ?? DEFAULT_RETRIES;
    this.#retry_delay = options.retryDelay ?? DEFAULT_RETRY_DELAY;
    this.#retry_backoff = options.retryBackoff ?? DEFAULT_RETRY_BACKOFF;
    this.#validate_inputs = options.validateInputs ?? true;
  }
  /**
   * Whether input validation is enabled
   * @returns {boolean}
   */
  get should_validate() {
    return this.#validate_inputs;
  }

  /**
   * Makes an HTTP request to the Monime API.
   * @template T
   * @param {RequestOptions} options
   * @returns {Promise<T>}
   * @throws {MonimeApiError} When the API returns an error response
   * @throws {MonimeTimeoutError} When the request times out
   * @throws {MonimeNetworkError} When a network error occurs
   * @throws {MonimeValidationError} When input validation fails
   */
  async request(options) {
    const { method, path, body, params, config } = options;
    const timeout = config?.timeout ?? this.#timeout;
    const max_retries = config?.retries ?? this.#retries;
    const external_signal = config?.signal;
    const idempotency_key = config?.idempotencyKey;
    const url = this.#build_url(path, params);
    const headers = this.#build_headers(method, body, idempotency_key);
    /** @type {RequestInit} */
    const fetch_options = {
      method,
      headers,
    };
    if (body !== undefined) {
      fetch_options.body = JSON.stringify(body);
    }
    return this.#execute_with_retry(
      url,
      fetch_options,
      timeout,
      max_retries,
      external_signal,
    );
  }

  /**
   * @param {string} path
   * @param {Record<string, string | number | boolean | undefined>} [params]
   * @returns {string}
   */
  #build_url(path, params) {
    let url = `${this.#base_url}/${API_VERSION}${path}`;
    if (params) {
      const search_params = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          search_params.set(key, String(value));
        }
      }
      const query_string = search_params.toString();
      if (query_string) {
        url += `?${query_string}`;
      }
    }
    return url;
  }

  /**
   * @param {HttpMethod} method
   * @param {unknown} [body]
   * @param {string} [idempotency_key]
   * @returns {Record<string, string>}
   */
  #build_headers(method, body, idempotency_key) {
    /** @type {Record<string, string>} */
    const headers = {
      "Monime-Space-Id": this.#space_id,
      Authorization: `Bearer ${this.#access_token}`,
    };
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }
    if (method === "POST") {
      headers["Idempotency-Key"] = idempotency_key ?? crypto.randomUUID();
    }
    return headers;
  }

  /**
   * @template T
   * @param {string} url
   * @param {RequestInit} fetch_options
   * @param {number} timeout
   * @param {number} max_retries
   * @param {AbortSignal} [external_signal]
   * @returns {Promise<T>}
   */
  async #execute_with_retry(
    url,
    fetch_options,
    timeout,
    max_retries,
    external_signal,
  ) {
    let last_error;
    const total_attempts = 1 + max_retries;
    for (
      let attempt_number = 1;
      attempt_number <= total_attempts;
      attempt_number++
    ) {
      try {
        return await this.#execute_request(
          url,
          fetch_options,
          timeout,
          external_signal,
        );
      } catch (error) {
        last_error = /** @type {Error} */ (error);
        if (last_error.name === "AbortError" && external_signal?.aborted) {
          throw last_error;
        }
        if (last_error instanceof MonimeTimeoutError) {
          throw last_error;
        }
        const is_retryable = this.#is_retryable_error(last_error);
        const is_last_attempt = attempt_number === total_attempts;
        if (!is_retryable || is_last_attempt) {
          throw last_error;
        }
        const retry_index = attempt_number - 1;
        const delay = this.#calculate_retry_delay(retry_index, last_error);
        await this.#sleep(delay);
      }
    }
    throw last_error ?? new Error("Unknown error during retry");
  }

  /**
   * @template T
   * @param {string} url
   * @param {RequestInit} fetch_options
   * @param {number} timeout
   * @param {AbortSignal} [external_signal]
   * @returns {Promise<T>}
   */
  async #execute_request(url, fetch_options, timeout, external_signal) {
    /** @type {AbortSignal[]} */
    const signals = [];
    let timeout_id;
    /** @type {AbortController | undefined} */
    let timeout_controller;
    if (timeout > 0) {
      timeout_controller = new AbortController();
      timeout_id = setTimeout(() => {
        timeout_controller?.abort();
      }, timeout);
      signals.push(timeout_controller.signal);
    }
    if (external_signal) {
      signals.push(external_signal);
    }
    const signal = signals.length > 0 ? AbortSignal.any(signals) : undefined;
    try {
      const res = await fetch(url, {
        ...fetch_options,
        ...(signal && { signal }),
      });
      let data;
      try {
        data = await res.json();
      } catch {
        throw new MonimeApiError(
          `Invalid JSON response from server: ${res.status} ${res.statusText}`,
          res.status,
          "invalid_json",
          [],
        );
      }
      if (!res.ok) {
        const retry_after = this.#parse_retry_after(res.headers);
        const error_response = /** @type {ApiErrorResponse} */ (data);
        if (error_response.error) {
          throw new MonimeApiError(
            error_response.error.message,
            error_response.error.code,
            error_response.error.reason,
            error_response.error.details,
            retry_after,
          );
        }
        throw new MonimeApiError(
          `HTTP ${res.status}: ${res.statusText}`,
          res.status,
          "http_error",
          [],
          retry_after,
        );
      }
      return /** @type {T} */ (data);
    } catch (error) {
      if (
        error instanceof MonimeApiError ||
        error instanceof MonimeTimeoutError ||
        error instanceof MonimeNetworkError
      ) {
        throw error;
      }
      if (error instanceof Error && error.name === "AbortError") {
        if (timeout_controller?.signal.aborted && !external_signal?.aborted) {
          throw new MonimeTimeoutError(timeout, url);
        }
        throw error;
      }
      if (error instanceof TypeError) {
        throw new MonimeNetworkError(`Network error: ${error.message}`, error);
      }
      throw error;
    } finally {
      if (timeout_id !== undefined) {
        clearTimeout(timeout_id);
      }
    }
  }
  /**
   * Parse Retry-After header value to milliseconds
   * Supports both seconds format (e.g., "120") and HTTP-date format
   * @param {Headers} headers
   * @returns {number | undefined}
   */
  #parse_retry_after(headers) {
    const retry_after = headers.get("Retry-After");
    if (!retry_after) return undefined;
    const seconds = Number.parseInt(retry_after, 10);
    if (!Number.isNaN(seconds)) {
      return seconds * 1e3;
    }
    const date = Date.parse(retry_after);
    if (!Number.isNaN(date)) {
      const delay = date - Date.now();
      return delay > 0 ? delay : undefined;
    }
    return undefined;
  }
  /**
   * @param {Error} error
   * @returns {boolean}
   */
  #is_retryable_error(error) {
    if (error instanceof MonimeNetworkError) {
      return true;
    }
    if (error instanceof MonimeApiError) {
      return error.isRetryable;
    }
    if (error.name === "AbortError") {
      return false;
    }
    return false;
  }
  /**
   * @param {number} retry_index
   * @param {Error} error
   * @returns {number}
   */
  #calculate_retry_delay(retry_index, error) {
    if (error instanceof MonimeApiError && error.retryAfter !== undefined) {
      return error.retryAfter;
    }
    const base_delay = this.#retry_delay * this.#retry_backoff ** retry_index;
    const jitter = Math.random() * 500;
    return base_delay + jitter;
  }
  /**
   * @param {number} ms
   * @returns {Promise<void>}
   */
  #sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export { MonimeHttpClient };
