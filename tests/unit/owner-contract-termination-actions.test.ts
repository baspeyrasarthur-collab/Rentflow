import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auditLogCreate: vi.fn(),
  contractTenantFindFirst: vi.fn(),
  contractTenantUpdateMany: vi.fn(),
  notificationCreate: vi.fn(),
  paymentUpdateMany: vi.fn(),
  receiptUpdateMany: vi.fn(),
  redirect: vi.fn(),
  rentalContractUpdateMany: vi.fn(),
  requireOwnerAccess: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/server/auth/access", () => ({
  requireOwnerAccess: mocks.requireOwnerAccess,
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
    contractTenant: {
      findFirst: mocks.contractTenantFindFirst,
    },
  },
}));

import {
  confirmOwnerContractTenantTerminationAction,
  terminateOwnerContractTenantAction,
} from "@/app/(owner)/owner/properties/[id]/contracts/[contractId]/actions";

function createConfirmFormData(overrides: Record<string, string | null> = {}) {
  const formData = new FormData();

  formData.set(
    "contractTenantId",
    overrides.contractTenantId ?? "contract_tenant_1",
  );
  if (overrides.confirmTerminationRequest !== null) {
    formData.set(
      "confirmTerminationRequest",
      overrides.confirmTerminationRequest ?? "on",
    );
  }

  return formData;
}

function createTerminateFormData(
  overrides: Record<string, string | null> = {},
) {
  const formData = new FormData();

  formData.set(
    "contractTenantId",
    overrides.contractTenantId ?? "contract_tenant_1",
  );
  if (overrides.confirmation !== null) {
    formData.set("confirmation", overrides.confirmation ?? "TERMINER");
  }

  return formData;
}

function createContractTenant(overrides: Record<string, unknown> = {}) {
  return {
    id: "contract_tenant_1",
    rentalContractId: "contract_1",
    tenantProfileId: "tenant_profile_1",
    status: "TERMINATION_REQUESTED",
    rentalContract: {
      id: "contract_1",
      propertyId: "property_1",
      ownerProfileId: "owner_profile_1",
      status: "DRAFT",
      property: {
        name: "Appartement Canal",
      },
    },
    tenantProfile: {
      userId: "user_tenant",
    },
    ...overrides,
  };
}

describe("owner contract tenant termination actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-10T12:00:00.000Z"));

    mocks.requireOwnerAccess.mockResolvedValue({
      user: {
        id: "user_owner",
        email: "owner@example.com",
        role: "OWNER",
      },
      ownerProfile: {
        id: "owner_profile_1",
        userId: "user_owner",
      },
    });
    mocks.contractTenantFindFirst.mockResolvedValue(createContractTenant());
    mocks.contractTenantUpdateMany.mockResolvedValue({ count: 1 });
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        auditLog: {
          create: mocks.auditLogCreate,
        },
        contractTenant: {
          updateMany: mocks.contractTenantUpdateMany,
        },
        notification: {
          create: mocks.notificationCreate,
        },
        payment: {
          updateMany: mocks.paymentUpdateMany,
        },
        receipt: {
          updateMany: mocks.receiptUpdateMany,
        },
        rentalContract: {
          updateMany: mocks.rentalContractUpdateMany,
        },
      }),
    );
    mocks.redirect.mockImplementation((url: string) => {
      throw Object.assign(new Error("NEXT_REDIRECT"), { url });
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("confirms a tenant termination request for an owner contract", async () => {
    await expect(
      confirmOwnerContractTenantTerminationAction(createConfirmFormData()),
    ).rejects.toMatchObject({
      message: "NEXT_REDIRECT",
      url: "/owner/properties/property_1/contracts/contract_1",
    });

    expect(mocks.contractTenantFindFirst).toHaveBeenCalledWith({
      where: {
        id: "contract_tenant_1",
        rentalContract: {
          ownerProfileId: "owner_profile_1",
        },
      },
      select: expect.any(Object),
    });
    expect(mocks.contractTenantUpdateMany).toHaveBeenCalledWith({
      where: {
        id: "contract_tenant_1",
        rentalContractId: "contract_1",
        status: "TERMINATION_REQUESTED",
      },
      data: {
        status: "TERMINATED",
        endDate: new Date("2026-06-10T12:00:00.000Z"),
      },
    });
    expect(mocks.notificationCreate).toHaveBeenCalledWith({
      data: {
        userId: "user_tenant",
        type: "RENTAL_TERMINATED",
        title: "Contrat termine",
        body: "Votre proprietaire a mis fin au contrat pour Appartement Canal.",
      },
    });
    expect(mocks.auditLogCreate).toHaveBeenCalledWith({
      data: {
        userId: "user_owner",
        action: "contract_tenant.termination_confirmed",
        entityType: "ContractTenant",
        entityId: "contract_tenant_1",
        metadata: {
          source: "owner_confirm_contract_tenant_termination",
          rentalContractId: "contract_1",
          tenantProfileId: "tenant_profile_1",
        },
      },
    });
    expect(mocks.rentalContractUpdateMany).not.toHaveBeenCalled();
    expect(mocks.paymentUpdateMany).not.toHaveBeenCalled();
    expect(mocks.receiptUpdateMany).not.toHaveBeenCalled();
  });

  it("refuses confirmation for another owner", async () => {
    mocks.contractTenantFindFirst.mockResolvedValue(null);

    await expect(
      confirmOwnerContractTenantTerminationAction(createConfirmFormData()),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });

    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("refuses confirmation when no termination was requested", async () => {
    mocks.contractTenantFindFirst.mockResolvedValue(
      createContractTenant({
        status: "ACTIVE",
      }),
    );

    await expect(
      confirmOwnerContractTenantTerminationAction(createConfirmFormData()),
    ).rejects.toMatchObject({
      code: "CONFLICT",
    });

    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("terminates an active tenant attachment with strong confirmation", async () => {
    mocks.contractTenantFindFirst.mockResolvedValue(
      createContractTenant({
        status: "ACTIVE",
      }),
    );

    await expect(
      terminateOwnerContractTenantAction(createTerminateFormData()),
    ).rejects.toMatchObject({
      message: "NEXT_REDIRECT",
      url: "/owner/properties/property_1/contracts/contract_1",
    });

    expect(mocks.contractTenantUpdateMany).toHaveBeenCalledWith({
      where: {
        id: "contract_tenant_1",
        rentalContractId: "contract_1",
        status: "ACTIVE",
      },
      data: {
        status: "TERMINATED",
        endDate: new Date("2026-06-10T12:00:00.000Z"),
      },
    });
    expect(mocks.notificationCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user_tenant",
        type: "RENTAL_TERMINATED",
        title: "Contrat termine",
      }),
    });
    expect(mocks.auditLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "contract_tenant.terminated_by_owner",
        metadata: expect.objectContaining({
          source: "owner_terminate_contract_tenant",
        }),
      }),
    });
    expect(mocks.rentalContractUpdateMany).not.toHaveBeenCalled();
    expect(mocks.paymentUpdateMany).not.toHaveBeenCalled();
    expect(mocks.receiptUpdateMany).not.toHaveBeenCalled();
  });

  it("refuses owner termination for another owner", async () => {
    mocks.contractTenantFindFirst.mockResolvedValue(null);

    await expect(
      terminateOwnerContractTenantAction(createTerminateFormData()),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });

    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("refuses owner termination without exact confirmation", async () => {
    await expect(
      terminateOwnerContractTenantAction(
        createTerminateFormData({
          confirmation: "SUPPRIMER",
        }),
      ),
    ).rejects.toBeInstanceOf(Error);

    expect(mocks.contractTenantFindFirst).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("refuses owner termination when already terminated", async () => {
    mocks.contractTenantFindFirst.mockResolvedValue(
      createContractTenant({
        status: "TERMINATED",
      }),
    );

    await expect(
      terminateOwnerContractTenantAction(createTerminateFormData()),
    ).rejects.toMatchObject({
      code: "CONFLICT",
    });

    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("refuses owner termination for a pending tenant request", async () => {
    await expect(
      terminateOwnerContractTenantAction(createTerminateFormData()),
    ).rejects.toMatchObject({
      code: "CONFLICT",
    });

    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
