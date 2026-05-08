/**
 * @typedef {object} ValidationIssue
 * @property {string} message - Human-readable error message
 * @property {string} field - Path to the field that failed validation (e.g., "amount.value", "lineItems.0.name")
 * @property {unknown} [value] - The invalid value that was provided
 */

/**
 * Base error class for all Monime SDK errors.
 * All SDK-specific errors extend this class for consistent error handling.
 */
class MonimeError extends Error {
  /** @param {string} message */
  constructor(message) {
    super(message);
    this.name = "MonimeError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Error thrown when the API returns an error response (4xx, 5xx).
 * Contains detailed information about the API error including status code,
 * reason, and any additional details from the response.
 */
class MonimeApiError extends MonimeError {
  /** @type {number} */
  code;
  /** @type {string} */
  reason;
  /** @type {unknown[]} */
  details;

  /**
   * @param {string} message
   * @param {number} code
   * @param {string} reason
   * @param {unknown[]} details
   * @param {number} [retryAfter]
   */
  constructor(message, code, reason, details, retryAfter) {
    super(message);
    this.code = code;
    this.reason = reason;
    this.details = details;
    this.name = "MonimeApiError";
    Object.setPrototypeOf(this, new.target.prototype);
    if (retryAfter !== undefined) {
      this.retryAfter = retryAfter;
    }
  }
  /**
   * Retry-After value in milliseconds (parsed from header for 429 responses)
   */
  /** @type {number | undefined} */
  retryAfter;
  /**
   * Whether this error is retryable based on HTTP status code.
   * Retryable codes: 429 (rate limit), 500, 502, 503, 504 (server errors)
   */
  get isRetryable() {
    return (
      this.code === 429 ||
      this.code === 500 ||
      this.code === 502 ||
      this.code === 503 ||
      this.code === 504
    );
  }
}

/**
 * Error thrown when a request times out.
 * Contains the timeout value and the URL that timed out.
 */
class MonimeTimeoutError extends MonimeError {
  /** @type {number} */
  timeout;
  /** @type {string} */
  url;

  /**
   * @param {number} timeout
   * @param {string} url
   */
  constructor(timeout, url) {
    super(`Request to ${url} timed out after ${timeout}ms`);
    this.timeout = timeout;
    this.url = url;
    this.name = "MonimeTimeoutError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Error thrown when input validation fails.
 * Contains all validation issues found, allowing users to fix multiple errors at once.
 */
class MonimeValidationError extends MonimeError {
  /** @type {ValidationIssue[]} */
  issues;

  /**
   * @param {string} message
   * @param {ValidationIssue[]} issues
   */
  constructor(message, issues) {
    super(message);
    this.issues = issues;
    this.name = "MonimeValidationError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Error thrown when a network error occurs (connection refused, DNS failure, etc.).
 * These errors are generally retryable as they may be transient.
 */
class MonimeNetworkError extends MonimeError {
  /** @type {Error | undefined} */
  cause;

  /**
   * @param {string} message
   * @param {Error} [cause]
   */
  constructor(message, cause) {
    super(message);
    this.cause = cause;
    this.name = "MonimeNetworkError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
  /**
   * Network errors are generally retryable
   */
  get isRetryable() {
    return true;
  }
}

export {
  MonimeApiError,
  MonimeError,
  MonimeNetworkError,
  MonimeTimeoutError,
  MonimeValidationError,
};
