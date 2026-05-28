import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auditLogCreate: vi.fn(),
  notificationCreate: vi.fn(),
  paymentDeclarationCreate: vi.fn(),
  paymentFindFirst: vi.fn(),
  paymentUpdateMany: vi.fn(),
  redirect: vi.fn(),
  requireTenantAccess: vi.fn(),
  requireRole: vi.fn(),
  tenantProfileFindUnique: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/server/auth/access", () => ({
  requireTenantAccess: mocks.requireTenantAccess,
}));

vi.mock("@/server/auth/current-user", () => ({
  requireRole: mocks.requireRole,
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
    tenantProfile: {
      findUnique: mocks.tenantProfileFindUnique,
    },
    payment: {
      findFirst: mocks.paymentFindFirst,
    },
    platformSetting: {
      findUnique: vi.fn(),
    },
  },
}));

import {
  declareTenantExternalPaymentNotPaidYetAction,
  declareTenantExternalPaymentPaidAction,
} from "@/app/(tenant)/tenant/payments/actions";

function createDeclarationFormData(
  declarationType: "PAID_EXTERNALLY" | "NOT_PAID_YET" = "PAID_EXTERNALLY",
  options: { confirmPaid?: boolean } = {},
) {
  const formData = new FormData();

  formData.set("paymentId", "payment_1");
  formData.set("declarationType", declarationType);
  if (declarationType === "PAID_EXTERNALLY" && options.confirmPaid !== false) {
    formData.set("confirmPaid", "on");
  }

  return formData;
}

function createExternalRentPayment(status: "PLANNED" | "PENDING" = "PLANNED") {
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
    status,
    ownerProfile: {
      userId: "user_owner",
    },
    property: {
      name: "Appartement Canal",
    },
    contractTenant: {
      id: "contract_tenant_1",
      tenantProfileId: "tenant_profile_1",
    },
  };
}

describe("tenant external payment declaration action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireRole.mockResolvedValue({
      id: "user_tenant",
      role: "TENANT",
    });
    mocks.tenantProfileFindUnique.mockResolvedValue({
      id: "tenant_profile_1",
      userId: "user_tenant",
    });
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
    mocks.paymentFindFirst.mockResolvedValue(createExternalRentPayment());
    mocks.paymentDeclarationCreate.mockResolvedValue({
      id: "payment_declaration_1",
    });
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        auditLog: {
          create: mocks.auditLogCreate,
        },
        notification: {
          create: mocks.notificationCreate,
        },
        payment: {
          updateMany: mocks.paymentUpdateMany,
        },
        paymentDeclaration: {
          create: mocks.paymentDeclarationCreate,
        },
      }),
    );
    mocks.redirect.mockImplementation((url: string) => {
      throw Object.assign(new Error("NEXT_REDIRECT"), { url });
    });
  });

  it("creates a paid externally declaration for a planned external rent payment and audits it", async () => {
    await expect(
      declareTenantExternalPaymentPaidAction(createDeclarationFormData()),
    ).rejects.toMatchObject({
      message: "NEXT_REDIRECT",
      url: "/tenant",
    });

    expect(mocks.paymentFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "payment_1",
          tenantProfileId: "tenant_profile_1",
        },
      }),
    );
    expect(mocks.paymentDeclarationCreate).toHaveBeenCalledWith({
      data: {
        paymentId: "payment_1",
        tenantProfileId: "tenant_profile_1",
        contractTenantId: "contract_tenant_1",
        declarationType: "PAID_EXTERNALLY",
      },
      select: {
        id: true,
      },
    });
    expect(mocks.notificationCreate).toHaveBeenCalledWith({
      data: {
        userId: "user_owner",
        type: "PAYMENT_PLANNED",
        title: "Loyer declare paye",
        body: "Un locataire indique avoir paye un loyer pour Appartement Canal. Confirmez uniquement apres reception reelle.",
      },
    });
    expect(mocks.auditLogCreate).toHaveBeenCalledWith({
      data: {
        userId: "user_tenant",
        action: "payment_declaration.created",
        entityType: "PaymentDeclaration",
        entityId: "payment_declaration_1",
        metadata: {
          source: "tenant_declare_external_payment_paid",
          paymentId: "payment_1",
          contractTenantId: "contract_tenant_1",
          declarationType: "PAID_EXTERNALLY",
        },
      },
    });
    expect(mocks.paymentUpdateMany).not.toHaveBeenCalled();
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.redirect).toHaveBeenCalledWith("/tenant");
  });

  it("rejects paid externally declarations without explicit confirmation", async () => {
    await expect(
      declareTenantExternalPaymentPaidAction(
        createDeclarationFormData("PAID_EXTERNALLY", {
          confirmPaid: false,
        }),
      ),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });

    expect(mocks.paymentFindFirst).not.toHaveBeenCalled();
    expect(mocks.paymentDeclarationCreate).not.toHaveBeenCalled();
    expect(mocks.notificationCreate).not.toHaveBeenCalled();
    expect(mocks.auditLogCreate).not.toHaveBeenCalled();
  });

  it("creates a not paid yet declaration for a planned external rent payment and audits it", async () => {
    await expect(
      declareTenantExternalPaymentNotPaidYetAction(
        createDeclarationFormData("NOT_PAID_YET"),
      ),
    ).rejects.toMatchObject({
      message: "NEXT_REDIRECT",
      url: "/tenant",
    });

    expect(mocks.paymentDeclarationCreate).toHaveBeenCalledWith({
      data: {
        paymentId: "payment_1",
        tenantProfileId: "tenant_profile_1",
        contractTenantId: "contract_tenant_1",
        declarationType: "NOT_PAID_YET",
      },
      select: {
        id: true,
      },
    });
    expect(mocks.notificationCreate).toHaveBeenCalledWith({
      data: {
        userId: "user_owner",
        type: "PAYMENT_PLANNED",
        title: "Loyer pas encore paye",
        body: "Un locataire indique ne pas avoir encore paye un loyer pour Appartement Canal.",
      },
    });
    expect(mocks.auditLogCreate).toHaveBeenCalledWith({
      data: {
        userId: "user_tenant",
        action: "payment_declaration.created",
        entityType: "PaymentDeclaration",
        entityId: "payment_declaration_1",
        metadata: {
          source: "tenant_declare_external_payment_not_paid_yet",
          paymentId: "payment_1",
          contractTenantId: "contract_tenant_1",
          declarationType: "NOT_PAID_YET",
        },
      },
    });
    expect(mocks.paymentUpdateMany).not.toHaveBeenCalled();
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
  });

  it("creates a paid externally declaration for a pending external rent payment", async () => {
    mocks.paymentFindFirst.mockResolvedValue(
      createExternalRentPayment("PENDING"),
    );

    await expect(
      declareTenantExternalPaymentPaidAction(createDeclarationFormData()),
    ).rejects.toMatchObject({
      message: "NEXT_REDIRECT",
      url: "/tenant",
    });

    expect(mocks.paymentDeclarationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          paymentId: "payment_1",
          declarationType: "PAID_EXTERNALLY",
        }),
      }),
    );
    expect(mocks.paymentUpdateMany).not.toHaveBeenCalled();
  });

  it("rejects unexpected client fields", async () => {
    const formData = createDeclarationFormData();

    formData.set("message", "paid");

    await expect(
      declareTenantExternalPaymentPaidAction(formData),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });

    expect(mocks.paymentDeclarationCreate).not.toHaveBeenCalled();
    expect(mocks.notificationCreate).not.toHaveBeenCalled();
    expect(mocks.auditLogCreate).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("rejects a declaration type that does not match the action", async () => {
    await expect(
      declareTenantExternalPaymentPaidAction(
        createDeclarationFormData("NOT_PAID_YET"),
      ),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });

    expect(mocks.paymentDeclarationCreate).not.toHaveBeenCalled();
    expect(mocks.notificationCreate).not.toHaveBeenCalled();
    expect(mocks.auditLogCreate).not.toHaveBeenCalled();
  });

  it("does not create a declaration for non-eligible payments", async () => {
    mocks.paymentFindFirst.mockResolvedValue({
      ...createExternalRentPayment(),
      provider: "MOCK",
    });

    await expect(
      declareTenantExternalPaymentNotPaidYetAction(
        createDeclarationFormData("NOT_PAID_YET"),
      ),
    ).rejects.toMatchObject({
      code: "CONFLICT",
    });

    expect(mocks.paymentDeclarationCreate).not.toHaveBeenCalled();
    expect(mocks.notificationCreate).not.toHaveBeenCalled();
    expect(mocks.auditLogCreate).not.toHaveBeenCalled();
    expect(mocks.paymentUpdateMany).not.toHaveBeenCalled();
  });

  it("does not create a declaration for a payment outside the tenant scope", async () => {
    mocks.paymentFindFirst.mockResolvedValue(null);

    await expect(
      declareTenantExternalPaymentPaidAction(createDeclarationFormData()),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });

    expect(mocks.paymentDeclarationCreate).not.toHaveBeenCalled();
    expect(mocks.notificationCreate).not.toHaveBeenCalled();
    expect(mocks.auditLogCreate).not.toHaveBeenCalled();
    expect(mocks.paymentUpdateMany).not.toHaveBeenCalled();
  });
});
