import { beforeEach, describe, expect, it, vi } from "vitest";

import { deleteOwnerPropertyPermanently } from "@/server/owner/properties";

const mocks = vi.hoisted(() => ({
  auditLogCreate: vi.fn(),
  contractTenantDeleteMany: vi.fn(),
  contractTenantFindMany: vi.fn(),
  expenseDeleteMany: vi.fn(),
  invitationDeleteMany: vi.fn(),
  paymentDeclarationDeleteMany: vi.fn(),
  paymentDeleteMany: vi.fn(),
  paymentFindMany: vi.fn(),
  paymentMandateDeleteMany: vi.fn(),
  platformCommissionDeleteMany: vi.fn(),
  propertyDelete: vi.fn(),
  propertyFindFirst: vi.fn(),
  receiptDeleteMany: vi.fn(),
  recurringExpenseRuleDeleteMany: vi.fn(),
  rentalContractDeleteMany: vi.fn(),
  rentalContractFindMany: vi.fn(),
  requireOwnerAccess: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/server/auth/access", () => ({
  requireOwnerAccess: mocks.requireOwnerAccess,
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
    property: {
      findFirst: mocks.propertyFindFirst,
    },
  },
}));

function createTransactionClient() {
  return {
    auditLog: {
      create: mocks.auditLogCreate,
    },
    contractTenant: {
      deleteMany: mocks.contractTenantDeleteMany,
      findMany: mocks.contractTenantFindMany,
    },
    expense: {
      deleteMany: mocks.expenseDeleteMany,
    },
    invitation: {
      deleteMany: mocks.invitationDeleteMany,
    },
    payment: {
      deleteMany: mocks.paymentDeleteMany,
      findMany: mocks.paymentFindMany,
    },
    paymentDeclaration: {
      deleteMany: mocks.paymentDeclarationDeleteMany,
    },
    paymentMandate: {
      deleteMany: mocks.paymentMandateDeleteMany,
    },
    platformCommission: {
      deleteMany: mocks.platformCommissionDeleteMany,
    },
    property: {
      delete: mocks.propertyDelete,
    },
    receipt: {
      deleteMany: mocks.receiptDeleteMany,
    },
    recurringExpenseRule: {
      deleteMany: mocks.recurringExpenseRuleDeleteMany,
    },
    rentalContract: {
      deleteMany: mocks.rentalContractDeleteMany,
      findMany: mocks.rentalContractFindMany,
    },
  };
}

describe("owner permanent property deletion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireOwnerAccess.mockResolvedValue({
      user: {
        id: "user_owner",
        role: "TENANT",
      },
      ownerProfile: {
        id: "owner_profile_1",
        userId: "user_owner",
        plan: "FREE",
      },
    });
    mocks.propertyFindFirst.mockResolvedValue({
      id: "property_1",
      name: "Appartement Test",
      ownerProfileId: "owner_profile_1",
    });
    mocks.rentalContractFindMany.mockResolvedValue([{ id: "contract_1" }]);
    mocks.contractTenantFindMany.mockResolvedValue([
      { id: "contract_tenant_1" },
    ]);
    mocks.paymentFindMany.mockResolvedValue([{ id: "payment_1" }]);

    for (const deleteManyMock of [
      mocks.contractTenantDeleteMany,
      mocks.expenseDeleteMany,
      mocks.invitationDeleteMany,
      mocks.paymentDeclarationDeleteMany,
      mocks.paymentDeleteMany,
      mocks.paymentMandateDeleteMany,
      mocks.platformCommissionDeleteMany,
      mocks.receiptDeleteMany,
      mocks.recurringExpenseRuleDeleteMany,
      mocks.rentalContractDeleteMany,
    ]) {
      deleteManyMock.mockResolvedValue({ count: 1 });
    }

    mocks.propertyDelete.mockResolvedValue({ id: "property_1" });
    mocks.auditLogCreate.mockResolvedValue({ id: "audit_1" });
    mocks.transaction.mockImplementation(async (callback) =>
      callback(createTransactionClient()),
    );
  });

  it("deletes a property and its linked data when owner and confirmation are valid", async () => {
    await expect(
      deleteOwnerPropertyPermanently("property_1", "SUPPRIMER"),
    ).resolves.toEqual({
      propertyId: "property_1",
      deletedRelatedDataSummary: {
        contractTenants: 1,
        expenses: 1,
        invitations: 1,
        paymentDeclarations: 1,
        paymentMandates: 1,
        payments: 1,
        platformCommissions: 1,
        receipts: 1,
        recurringExpenseRules: 1,
        rentalContracts: 1,
      },
    });

    expect(mocks.propertyFindFirst).toHaveBeenCalledWith({
      where: {
        id: "property_1",
        ownerProfileId: "owner_profile_1",
      },
      select: {
        id: true,
        name: true,
        ownerProfileId: true,
      },
    });
    expect(mocks.propertyDelete).toHaveBeenCalledWith({
      where: {
        id: "property_1",
      },
      select: {
        id: true,
      },
    });
    expect(mocks.auditLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user_owner",
        action: "property.deleted",
        entityType: "Property",
        entityId: "property_1",
        metadata: expect.objectContaining({
          source: "owner_delete_property",
          propertyName: "Appartement Test",
          ownerProfileId: "owner_profile_1",
        }),
      }),
    });
  });

  it("deletes restrictive child data before deleting payments, contracts, and property", async () => {
    await deleteOwnerPropertyPermanently("property_1", "SUPPRIMER");

    expect(
      mocks.paymentDeclarationDeleteMany.mock.invocationCallOrder[0],
    ).toBeLessThan(mocks.paymentDeleteMany.mock.invocationCallOrder[0]);
    expect(
      mocks.platformCommissionDeleteMany.mock.invocationCallOrder[0],
    ).toBeLessThan(mocks.paymentDeleteMany.mock.invocationCallOrder[0]);
    expect(
      mocks.contractTenantDeleteMany.mock.invocationCallOrder[0],
    ).toBeLessThan(mocks.rentalContractDeleteMany.mock.invocationCallOrder[0]);
    expect(
      mocks.rentalContractDeleteMany.mock.invocationCallOrder[0],
    ).toBeLessThan(mocks.propertyDelete.mock.invocationCallOrder[0]);
  });

  it("rejects deletion when the property belongs to another owner", async () => {
    mocks.propertyFindFirst.mockResolvedValue(null);

    await expect(
      deleteOwnerPropertyPermanently("property_other", "SUPPRIMER"),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });

    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.propertyDelete).not.toHaveBeenCalled();
  });

  it("rejects deletion when the confirmation text is incorrect", async () => {
    await expect(
      deleteOwnerPropertyPermanently("property_1", "supprimer"),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });

    expect(mocks.requireOwnerAccess).toHaveBeenCalledTimes(1);
    expect(mocks.propertyFindFirst).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
