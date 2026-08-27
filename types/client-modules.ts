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
  Payment,
  PaymentCode,
  Payout,
  ProviderKyc,
  Receipt,
  RedeemReceiptResult,
  UssdOtp,
  Webhook,
} from "monimejs";
import { MonimeClient } from "monimejs";

const client = new MonimeClient({
  spaceId: "spc-example",
  accessToken: "token-example",
});

const bank_response: Promise<ApiResponse<Bank>> = client.bank.get("slb004");
const bank_list_response: Promise<ApiListResponse<Bank>> = client.bank.list({
  country: "SL",
});
const account_response: Promise<ApiResponse<FinancialAccount>> =
  client.financialAccount.get("fa-1", { withBalance: true });
const account_list_response: Promise<ApiListResponse<FinancialAccount>> =
  client.financialAccount.list();
const transaction_response: Promise<ApiResponse<FinancialTransaction>> =
  client.financialTransaction.get("txn-1");
const transaction_list_response: Promise<
  ApiListResponse<FinancialTransaction>
> = client.financialTransaction.list();
const payment_code_response: Promise<ApiResponse<PaymentCode>> =
  client.paymentCode.create({ name: "Order" });
const payment_code_list_response: Promise<ApiListResponse<PaymentCode>> =
  client.paymentCode.list();
const payment_response: Promise<ApiResponse<Payment>> =
  client.payment.get("pay-1");
const payment_list_response: Promise<ApiListResponse<Payment>> =
  client.payment.list();
const checkout_response: Promise<ApiResponse<CheckoutSession>> =
  client.checkoutSession.create({
    name: "Order",
    lineItems: [],
  });
const payout_response: Promise<ApiResponse<Payout>> = client.payout.create({
  amount: { currency: "SLE", value: 100 },
  destination: { type: "momo", providerId: "m17", phoneNumber: "23200000000" },
});
const webhook_response: Promise<ApiResponse<Webhook>> =
  client.webhook.get("whk-1");
const transfer_response: Promise<ApiResponse<InternalTransfer>> =
  client.internalTransfer.update("trn-1", { description: "Reserve" });
const momo_response: Promise<ApiResponse<Momo>> = client.momo.get("m17");
const provider_kyc_response: Promise<ApiResponse<ProviderKyc>> =
  client.providerKyc.get("m17", { accountId: "23200000000" });
const receipt_response: Promise<ApiResponse<Receipt>> =
  client.receipt.get("order-1");
const redemption_response: Promise<ApiResponse<RedeemReceiptResult>> =
  client.receipt.redeem("order-1", { redeemAll: true });
const ussd_otp_response: Promise<ApiResponse<UssdOtp>> = client.ussdOtp.create({
  authorizedPhoneNumber: "23200000000",
});
const checkout_delete_response: Promise<ApiDeleteResponse> =
  client.checkoutSession.delete("cs-1");

client.financialAccount.create({ name: "Main", currency: "SLE" });
client.financialAccount.update("fa-1", { name: "Reserve" });
client.paymentCode.get("pmc-1");
client.paymentCode.update("pmc-1", { name: "Updated" });
client.paymentCode.delete("pmc-1");
client.payment.update("pay-1", { name: "Updated" });
client.checkoutSession.get("cs-1");
client.checkoutSession.list();
client.payout.get("pyt-1");
client.payout.list();
client.payout.update("pyt-1", { metadata: { reason: "Updated" } });
client.payout.delete("pyt-1");
client.webhook.create({
  name: "Example",
  url: "https://example.com/webhook",
  apiRelease: "caph",
  events: [],
});
client.webhook.list();
client.webhook.update("whk-1", { enabled: true });
client.webhook.delete("whk-1");
client.internalTransfer.create({
  amount: { currency: "SLE", value: 100 },
  sourceFinancialAccount: { id: "fa-source" },
  destinationFinancialAccount: { id: "fa-destination" },
});
client.internalTransfer.get("trn-1");
client.internalTransfer.list();
client.internalTransfer.delete("trn-1");
client.bank.list({ country: "SL", limit: 10, after: "cursor" });
client.momo.list({ country: "SL" });
client.ussdOtp.get("uop-1");
client.ussdOtp.list();
client.ussdOtp.delete("uop-1");

// @ts-expect-error Request inputs must retain their declared types.
client.paymentCode.create({ name: 123 });

void [
  bank_response,
  bank_list_response,
  account_response,
  account_list_response,
  transaction_response,
  transaction_list_response,
  payment_code_response,
  payment_code_list_response,
  payment_response,
  payment_list_response,
  checkout_response,
  payout_response,
  webhook_response,
  transfer_response,
  momo_response,
  provider_kyc_response,
  receipt_response,
  redemption_response,
  ussd_otp_response,
  checkout_delete_response,
];
