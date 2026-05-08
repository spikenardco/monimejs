import { BankModule } from "./bank.js";
import { CheckoutSessionModule } from "./checkout-session.js";
import { FinancialAccountModule } from "./financial-account.js";
import { FinancialTransactionModule } from "./financial-transaction.js";
import { MonimeHttpClient } from "./http-client.js";
import { InternalTransferModule } from "./internal-transfer.js";
import { MomoModule } from "./momo.js";
import { PaymentModule } from "./payment.js";
import { PaymentCodeModule } from "./payment-code.js";
import { PayoutModule } from "./payout.js";
import { ReceiptModule } from "./receipt.js";
import { UssdOtpModule } from "./ussd-otp.js";
import { WebhookModule } from "./webhook.js";

/** @typedef {import("./index.d.ts").ClientOptions} ClientOptions */

/**
 * The main Monime SDK client.
 *
 * Creates a client instance with the provided credentials and configuration.
 * All API modules are accessible as properties of this client.
 *
 * @example
 * ```javascript
 * import { MonimeClient } from "monimejs";
 *
 * const client = new MonimeClient({
 *   spaceId: process.env.MONIME_SPACE_ID,
 *   accessToken: process.env.MONIME_ACCESS_TOKEN,
 * });
 *
 * // Create a payment code
 * const { result } = await client.paymentCode.create({
 *   name: "Order #1234",
 *   amount: { currency: "SLE", value: 1000 },
 * });
 * ```
 */
class MonimeClient {
  /** @type {MonimeHttpClient} */
  #http_client;
  /** Module for retrieving bank information (financial institution providers) */
  /** @type {BankModule} */
  bank;
  /** Module for managing financial accounts (wallets that hold and track money) */
  /** @type {FinancialAccountModule} */
  financialAccount;
  /** Module for managing financial transactions (fund movements affecting accounts) */
  /** @type {FinancialTransactionModule} */
  financialTransaction;
  /** Module for managing payment codes (USSD payment links) */
  /** @type {PaymentCodeModule} */
  paymentCode;
  /** Module for managing payments (read-only, created via payment codes) */
  /** @type {PaymentModule} */
  payment;
  /** Module for managing checkout sessions (hosted payment pages) */
  /** @type {CheckoutSessionModule} */
  checkoutSession;
  /** Module for managing payouts (disbursements to external accounts) */
  /** @type {PayoutModule} */
  payout;
  /** Module for managing webhooks (event notifications) */
  /** @type {WebhookModule} */
  webhook;
  /** Module for managing internal transfers (between financial accounts) */
  /** @type {InternalTransferModule} */
  internalTransfer;
  /** Module for retrieving mobile money provider information */
  /** @type {MomoModule} */
  momo;
  /** Module for managing receipts (proof of customer entitlements) */
  /** @type {ReceiptModule} */
  receipt;
  /** Module for managing USSD OTP verification */
  /** @type {UssdOtpModule} */
  ussdOtp;
  /**
   * Creates a new Monime client instance.
   *
   * @param {ClientOptions} options - Client configuration options
   * @param {object} options - Options object
   * @param {string} options.spaceId - Your Monime space ID (must start with "spc-")
   * @param {string} options.accessToken - Your Monime API access token
   * @param {string} [options.baseUrl] - Optional custom API base URL (must use HTTPS)
   * @param {number} [options.timeout] - Request timeout in milliseconds (default: 30000)
   * @param {number} [options.retries] - Number of retry attempts (default: 2)
   * @param {number} [options.retryDelay] - Initial retry delay in milliseconds (default: 1000)
   * @param {number} [options.retryBackoff] - Retry backoff multiplier (default: 2)
   * @param {boolean} [options.validateInputs] - Whether to validate inputs before requests (default: true)
   *
   * @throws {MonimeValidationError} If options validation fails
   *
   * @example
   * ```javascript
   * // Basic usage
   * const client = new MonimeClient({
   *   spaceId: "spc-your-space-id",
   *   accessToken: "your-access-token",
   * });
   *
   * // With custom configuration
   * const client = new MonimeClient({
   *   spaceId: "spc-your-space-id",
   *   accessToken: "your-access-token",
   *   timeout: 60000,
   *   retries: 3,
   * });
   * ```
   */
  constructor(options) {
    this.#http_client = new MonimeHttpClient(options);
    this.bank = new BankModule(this.#http_client);
    this.financialAccount = new FinancialAccountModule(this.#http_client);
    this.financialTransaction = new FinancialTransactionModule(
      this.#http_client,
    );
    this.paymentCode = new PaymentCodeModule(this.#http_client);
    this.payment = new PaymentModule(this.#http_client);
    this.checkoutSession = new CheckoutSessionModule(this.#http_client);
    this.payout = new PayoutModule(this.#http_client);
    this.webhook = new WebhookModule(this.#http_client);
    this.internalTransfer = new InternalTransferModule(this.#http_client);
    this.momo = new MomoModule(this.#http_client);
    this.receipt = new ReceiptModule(this.#http_client);
    this.ussdOtp = new UssdOtpModule(this.#http_client);
  }
}

export { MonimeClient };
