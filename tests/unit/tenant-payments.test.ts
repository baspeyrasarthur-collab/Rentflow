import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireTenantAccess: vi.fn(),
  paymentFindFirst: vi.fn(),
}));

vi.mock("@/server/auth/access", () => ({
  requireTenantAccess: mocks.requireTenantAccess,
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    payment: {
      findFirst: mocks.paymentFindFirst,
    },
  },
}));

import {
  canDeclareTenantExternalPaymentPaid,
  getTenantExternalPaymentForDeclaration,
  getTenantPaymentForMockPayment,
  hasAcceptedMockMandateForTenantPayment,
  isActiveContractTenantForTenantPayment,
} from "@/server/tenant/payments";

function createEligiblePayment() {
  return {
    id: "payment_1",
    propertyId: "property_1",
    rentalContractId: "contract_1",
    contractTenantId: "contract_tenant_1",
    tenantProfileId: "tenant_profile_1",
    ownerProfileId: "owner_profile_1",
    provider: null,
    providerPaymentId: null,
    type: "RENT",
    status: "PLANNED",
    amountInCents: 107000,
    currency: "EUR",
    dueDate: new Date("2026-06-05T00:00:00.000Z"),
    contractTenant: {
      id: "contract_tenant_1",
      tenantProfileId: "tenant_profile_1",
      status: "ACTIVE",
      paymentMandates: [
        { id: "mandate_1", provider: "MOCK", status: "ACCEPTED" },
      ],
    },
  };
}

function createExternalRentPayment() {
  return {
    id: "payment_1",
    propertyId: "property_1",
    rentalContractId: "contract_1",
    contractTenantId: "contract_tenant_1",
    tenantProfileId: "tenant_profile_1",
    ownerProfileId: "owner_profile_1",
    provider: null,
    providerPaymentId: null,
    type: "RENT",
    status: "PLANNED",
    declarations: [],
    contractTenant: {
      id: "contract_tenant_1",
      tenantProfileId: "tenant_profile_1",
    },
  };
}

describe("tenant payment helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireTenantAccess.mockResolvedValue({
      user: {
        id: "user_tenant",
        role: "OWNER",
      },
      tenantProfile: {
        id: "tenant_profile_1",
        userId: "user_tenant",
      },
    });
  });

  it("allows mock payments only for active tenant attachments", () => {
    expect(
      isActiveContractTenantForTenantPayment({
        tenantProfileId: "tenant_profile_1",
        status: "ACTIVE",
      }),
    ).toBe(true);
    expect(
      isActiveContractTenantForTenantPayment({
        tenantProfileId: "tenant_profile_1",
        status: "INVITED",
      }),
    ).toBe(false);
    expect(
      isActiveContractTenantForTenantPayment({
        tenantProfileId: null,
        status: "ACTIVE",
      }),
    ).toBe(false);
  });

  it("requires an accepted mock mandate", () => {
    expect(
      hasAcceptedMockMandateForTenantPayment([
        { provider: "MOCK", status: "ACCEPTED" },
      ]),
    ).toBe(true);
    expect(
      hasAcceptedMockMandateForTenantPayment([
        { provider: "MOCK", status: "CREATED" },
      ]),
    ).toBe(false);
    expect(
      hasAcceptedMockMandateForTenantPayment([
        { provider: "GOCARDLESS", status: "ACCEPTED" },
      ]),
    ).toBe(false);
  });

  it("allows declaration only for external rent payments that are planned or pending", () => {
    expect(
      canDeclareTenantExternalPaymentPaid(createExternalRentPayment()),
    ).toBe(true);
    expect(
      canDeclareTenantExternalPaymentPaid({
        ...createExternalRentPayment(),
        status: "PENDING",
      }),
    ).toBe(true);
    expect(
      canDeclareTenantExternalPaymentPaid({
        ...createExternalRentPayment(),
        status: "SUCCEEDED",
      }),
    ).toBe(false);
    expect(
      canDeclareTenantExternalPaymentPaid({
        ...createExternalRentPayment(),
        provider: "MOCK",
      }),
    ).toBe(false);
    expect(
      canDeclareTenantExternalPaymentPaid({
        ...createExternalRentPayment(),
        providerPaymentId: "provider_payment_1",
      }),
    ).toBe(false);
    expect(
      canDeclareTenantExternalPaymentPaid({
        ...createExternalRentPayment(),
        type: "CHARGES",
      }),
    ).toBe(false);
  });

  it("loads a tenant payment with tenantProfileId and accepted mandate filters", async () => {
    mocks.paymentFindFirst.mockResolvedValue(createEligiblePayment());

    await expect(
      getTenantPaymentForMockPayment("payment_1"),
    ).resolves.toMatchObject({
      payment: {
        id: "payment_1",
        tenantProfileId: "tenant_profile_1",
      },
    });

    expect(mocks.paymentFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "payment_1",
          tenantProfileId: "tenant_profile_1",
        },
      }),
    );
  });

  it("rejects payments for another tenant attachment", async () => {
    mocks.paymentFindFirst.mockResolvedValue({
      ...createEligiblePayment(),
      contractTenant: {
        ...createEligiblePayment().contractTenant,
        tenantProfileId: "tenant_profile_2",
      },
    });

    await expect(
      getTenantPaymentForMockPayment("payment_1"),
    ).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });

  it("rejects payments without an accepted mandate", async () => {
    mocks.paymentFindFirst.mockResolvedValue({
      ...createEligiblePayment(),
      contractTenant: {
        ...createEligiblePayment().contractTenant,
        paymentMandates: [],
      },
    });

    await expect(
      getTenantPaymentForMockPayment("payment_1"),
    ).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });

  it("rejects payments that are already completed", async () => {
    mocks.paymentFindFirst.mockResolvedValue({
      ...createEligiblePayment(),
      status: "SUCCEEDED",
    });

    await expect(
      getTenantPaymentForMockPayment("payment_1"),
    ).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });

  it("loads a planned external rent payment for tenant declaration", async () => {
    mocks.paymentFindFirst.mockResolvedValue(createExternalRentPayment());

    await expect(
      getTenantExternalPaymentForDeclaration("payment_1"),
    ).resolves.toMatchObject({
      payment: {
        id: "payment_1",
        tenantProfileId: "tenant_profile_1",
        status: "PLANNED",
      },
    });

    expect(mocks.requireTenantAccess).toHaveBeenCalledTimes(1);
    expect(mocks.paymentFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "payment_1",
          tenantProfileId: "tenant_profile_1",
        },
      }),
    );
  });

  it("loads a pending external rent payment for tenant declaration", async () => {
    mocks.paymentFindFirst.mockResolvedValue({
      ...createExternalRentPayment(),
      status: "PENDING",
    });

    await expect(
      getTenantExternalPaymentForDeclaration("payment_1"),
    ).resolves.toMatchObject({
      payment: {
        id: "payment_1",
        status: "PENDING",
      },
    });
  });

  it("rejects external declarations for another tenant", async () => {
    mocks.paymentFindFirst.mockResolvedValue(null);

    await expect(
      getTenantExternalPaymentForDeclaration("payment_other"),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("rejects external declarations for mismatched tenant attachments", async () => {
    mocks.paymentFindFirst.mockResolvedValue({
      ...createExternalRentPayment(),
      contractTenant: {
        id: "contract_tenant_1",
        tenantProfileId: "tenant_profile_2",
      },
    });

    await expect(
      getTenantExternalPaymentForDeclaration("payment_1"),
    ).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });

  it("rejects external declarations for mock provider payments", async () => {
    mocks.paymentFindFirst.mockResolvedValue({
      ...createExternalRentPayment(),
      provider: "MOCK",
    });

    await expect(
      getTenantExternalPaymentForDeclaration("payment_1"),
    ).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });

  it("rejects external declarations for payments with provider ids", async () => {
    mocks.paymentFindFirst.mockResolvedValue({
      ...createExternalRentPayment(),
      providerPaymentId: "provider_payment_1",
    });

    await expect(
      getTenantExternalPaymentForDeclaration("payment_1"),
    ).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });

  it("rejects external declarations for non-rent payments", async () => {
    mocks.paymentFindFirst.mockResolvedValue({
      ...createExternalRentPayment(),
      type: "CHARGES",
    });

    await expect(
      getTenantExternalPaymentForDeclaration("payment_1"),
    ).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });

  it("rejects external declarations for succeeded payments", async () => {
    mocks.paymentFindFirst.mockResolvedValue({
      ...createExternalRentPayment(),
      status: "SUCCEEDED",
    });

    await expect(
      getTenantExternalPaymentForDeclaration("payment_1"),
    ).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });

  it("rejects external declarations when the latest declaration is already paid externally", async () => {
    mocks.paymentFindFirst.mockResolvedValue({
      ...createExternalRentPayment(),
      declarations: [
        {
          declarationType: "PAID_EXTERNALLY",
        },
      ],
    });

    await expect(
      getTenantExternalPaymentForDeclaration("payment_1"),
    ).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });
});
