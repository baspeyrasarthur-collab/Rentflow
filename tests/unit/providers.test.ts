import { describe, expect, it } from "vitest";

import { MockEmailProvider } from "@/server/email/mock-email-provider";
import type { EmailProvider } from "@/server/email/types";
import { MockIdentityProvider } from "@/server/identity/mock-identity-provider";
import type { IdentityProvider } from "@/server/identity/types";
import { MockPaymentProvider } from "@/server/payments/mock-payment-provider";
import type { PaymentProvider } from "@/server/payments/types";
import { MockStorageProvider } from "@/server/storage/mock-storage-provider";
import type { StorageProvider } from "@/server/storage/types";

describe("mock providers", () => {
  it("keeps payment behavior behind the provider interface", async () => {
    const provider: PaymentProvider = new MockPaymentProvider();
    const mandate = await provider.createMandate({
      tenantId: "tenant_1",
      rentalContractId: "contract_1",
    });

    expect(mandate.provider).toBe("MOCK");
    expect(mandate.providerMandateId).toMatch(/^mandate_/);
    expect(mandate.ibanLast4).toBeUndefined();
  });

  it("keeps identity behavior behind the provider interface", async () => {
    const provider: IdentityProvider = new MockIdentityProvider();
    const session = await provider.startVerification({ userId: "user_1" });

    expect(session.provider).toBe("MOCK");
    expect(session.status).toBe("PENDING");
  });

  it("keeps email behavior behind the provider interface", async () => {
    const provider: EmailProvider = new MockEmailProvider();
    const sentEmail = await provider.sendEmail({
      to: "tenant@example.com",
      subject: "RentFlow",
      html: "<p>Hello</p>",
    });

    expect(sentEmail.provider).toBe("mock");
    expect(sentEmail.providerMessageId).toMatch(/^email_/);
  });

  it("keeps storage behavior behind the provider interface", async () => {
    const provider: StorageProvider = new MockStorageProvider();
    const storedFile = await provider.uploadFile({
      bucket: "receipts",
      key: "receipt.pdf",
      contentType: "application/pdf",
      body: Buffer.from("pdf"),
    });

    expect(storedFile.provider).toBe("mock");
    expect(storedFile.url).toBe("mock://storage/receipts/receipt.pdf");
  });
});
