import type {
  MarkPaymentFailedInput,
  PaymentProvider,
  ProviderMandate,
  ProviderPayment,
} from "@/server/payments/types";

function createMockId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

export class MockPaymentProvider implements PaymentProvider {
  async createMandate(): Promise<ProviderMandate> {
    return {
      provider: "MOCK",
      providerMandateId: createMockId("mandate"),
      status: "CREATED",
      ibanLast4: undefined,
    };
  }

  async acceptMandate(providerMandateId: string): Promise<ProviderMandate> {
    return {
      provider: "MOCK",
      providerMandateId,
      status: "ACCEPTED",
      ibanLast4: "0000",
    };
  }

  async createPayment(): Promise<ProviderPayment> {
    return {
      provider: "MOCK",
      providerPaymentId: createMockId("payment"),
      status: "PLANNED",
    };
  }

  async markPaymentSucceeded(
    providerPaymentId: string,
  ): Promise<ProviderPayment> {
    return {
      provider: "MOCK",
      providerPaymentId,
      status: "SUCCEEDED",
    };
  }

  async markPaymentFailed(
    input: MarkPaymentFailedInput,
  ): Promise<ProviderPayment> {
    return {
      provider: "MOCK",
      providerPaymentId: input.providerPaymentId,
      status: "FAILED",
    };
  }
}
