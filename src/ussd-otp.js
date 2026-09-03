/** @typedef {import("./http-client.js").MonimeHttpClient} MonimeHttpClient */
/** @typedef {import("./index.d.ts").ApiDeleteResponse} ApiDeleteResponse */
/** @typedef {import("./index.d.ts").ApiListResponse<import("./index.d.ts").UssdOtp>} UssdOtpListResponse */
/** @typedef {import("./index.d.ts").ApiResponse<import("./index.d.ts").UssdOtp>} UssdOtpResponse */
/** @typedef {import("./index.d.ts").CreateUssdOtpInput} CreateUssdOtpInput */
/** @typedef {import("./index.d.ts").ListUssdOtpsParams} ListUssdOtpsParams */
/** @typedef {import("./index.d.ts").RequestConfig} RequestConfig */

/**
 * Module for USSD OTP verification.
 *
 * USSD OTP provides phone-bound verification through USSD dial codes. Users dial
 * the returned code and the session changes from pending to verified or expired.
 *
 * Verification flow:
 * 1. Create an OTP session with the mobile number to verify
 * 2. Display the generated USSD code to the user
 * 3. User dials the USSD code (e.g., *715*12345#) from their phone
 * 4. Poll the session status until verified
 *
 * @see {@link https://docs.monime.io/apis/versions/caph-2025-08-23/ussd-otp/object} USSD OTP API Documentation
 */
class UssdOtpModule {
  /** @type {MonimeHttpClient} */
  #http_client;

  /** @param {MonimeHttpClient} http_client */
  constructor(http_client) {
    this.#http_client = http_client;
  }
  /**
   * Creates a new USSD OTP verification request.
   * @param {CreateUssdOtpInput} input - OTP configuration including the mobile number
   * @param {RequestConfig} [config] - Optional request configuration (timeout, idempotencyKey, signal)
   * @returns {Promise<UssdOtpResponse>} The created USSD OTP with dial code
   * @throws {MonimeApiError} If the API returns an error
   */
  async create(input, config) {
    return this.#http_client.request({
      method: "POST",
      path: "/ussd-otps",
      body: input,
      config,
    });
  }
  /**
   * Retrieves a USSD OTP by ID.
   * @param {string} id - The USSD OTP session ID
   * @param {RequestConfig} [config] - Optional request configuration (timeout, idempotencyKey, signal)
   * @returns {Promise<UssdOtpResponse>} The USSD OTP
   * @throws {MonimeApiError} If the API returns an error
   */
  async get(id, config) {
    return this.#http_client.request({
      method: "GET",
      path: `/ussd-otps/${encodeURIComponent(id)}`,
      config,
    });
  }
  /**
   * Lists USSD OTPs with optional pagination.
   * @param {ListUssdOtpsParams} [params] - Optional pagination parameters
   * @param {RequestConfig} [config] - Optional request configuration (timeout, idempotencyKey, signal)
   * @returns {Promise<UssdOtpListResponse>} A paginated list of USSD OTPs
   * @throws {MonimeApiError} If the API returns an error
   */
  async list(params, config) {
    return this.#http_client.request({
      method: "GET",
      path: "/ussd-otps",
      params,
      config,
    });
  }
  /**
   * Deletes a USSD OTP.
   * @param {string} id - The USSD OTP session ID
   * @param {RequestConfig} [config] - Optional request configuration (timeout, idempotencyKey, signal)
   * @returns {Promise<ApiDeleteResponse>} Confirmation of deletion
   * @throws {MonimeApiError} If the API returns an error
   */
  async delete(id, config) {
    return this.#http_client.request({
      method: "DELETE",
      path: `/ussd-otps/${encodeURIComponent(id)}`,
      config,
    });
  }
}

export { UssdOtpModule };
