import type {
  ApiDeleteResponse,
  ApiListResponse,
  ApiResponse,
  Bank,
  CheckoutSession,
  FinancialAccount,
  FinancialTransaction,
  InternalTransfer,
  Momo,
  MonimeClient,
  Payment,
  PaymentCode,
  Payout,
  ProviderKyc,
  Receipt,
  RedeemReceiptResult,
  UssdOtp,
  Webhook,
} from "../../src/index.js";

declare const client: MonimeClient;

const bank_response: Promise<ApiResponse<Bank>> = client.bank.get("m17");
const bank_list_response: Promise<ApiListResponse<Bank>> = client.bank.list({
  country: "SL",
});
const checkout_response: Promise<ApiResponse<CheckoutSession>> =
  client.checkoutSession.create({
    name: "Order",
    lineItems: [],
  });
const checkout_delete_response: Promise<ApiDeleteResponse> =
  client.checkoutSession.delete("cs-1");
const account_response: Promise<ApiResponse<FinancialAccount>> =
  client.financialAccount.get("fa-1", { withBalance: true });
const transaction_response: Promise<ApiResponse<FinancialTransaction>> =
  client.financialTransaction.get("txn-1");
const transfer_response: Promise<ApiResponse<InternalTransfer>> =
  client.internalTransfer.update("trn-1", { description: "Reserve" });
const momo_response: Promise<ApiResponse<Momo>> = client.momo.get("m17");
const payment_code_response: Promise<ApiResponse<PaymentCode>> =
  client.paymentCode.create({
    name: "Order",
  });
const payment_response: Promise<ApiResponse<Payment>> = client.payment.update(
  "pay-1",
  {
    name: "Order",
  },
);
const payout_response: Promise<ApiResponse<Payout>> = client.payout.create({
  amount: { currency: "SLE", value: 100 },
  destination: { type: "momo", providerId: "m17", phoneNumber: "23200000000" },
});
const provider_kyc_response: Promise<ApiResponse<ProviderKyc>> =
  client.providerKyc.get("m17", {
    accountId: "23200000000",
  });
const receipt_response: Promise<ApiResponse<Receipt>> =
  client.receipt.get("order-1");
const redemption_response: Promise<ApiResponse<RedeemReceiptResult>> =
  client.receipt.redeem("order-1", { redeemAll: true });
const ussd_otp_response: Promise<ApiResponse<UssdOtp>> = client.ussdOtp.create({
  authorizedPhoneNumber: "23200000000",
});
const webhook_response: Promise<ApiResponse<Webhook>> = client.webhook.update(
  "whk-1",
  {
    enabled: true,
  },
);
const webhook_verification: never = client.webhook.verifySignature(
  "body",
  { "monime-signature": "signature" },
  "secret",
  { toleranceSeconds: 300 },
);

void [
  bank_response,
  bank_list_response,
  checkout_response,
  checkout_delete_response,
  account_response,
  transaction_response,
  transfer_response,
  momo_response,
  payment_code_response,
  payment_response,
  payout_response,
  provider_kyc_response,
  receipt_response,
  redemption_response,
  ussd_otp_response,
  webhook_response,
  webhook_verification,
];
