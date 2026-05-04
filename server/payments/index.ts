import { MockPaymentProvider } from "@/server/payments/mock-payment-provider";
import type { PaymentProvider } from "@/server/payments/types";

export function getPaymentProvider(): PaymentProvider {
  return new MockPaymentProvider();
}
