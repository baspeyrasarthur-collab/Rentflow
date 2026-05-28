import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auditLogCreate: vi.fn(),
  contractTenantFindFirst: vi.fn(),
  contractTenantUpdateMany: vi.fn(),
  redirect: vi.fn(),
  requireTenantAccess: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/server/auth/access", () => ({
  requireTenantAccess: mocks.requireTenantAccess,
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
    contractTenant: {
      findFirst: mocks.contractTenantFindFirst,
    },
  },
}));

import { requestTenantContractTerminationAction } from "@/app/(tenant)/tenant/contracts/actions";

function createFormData(overrides: Record<string, string | null> = {}) {
  const formData = new FormData();

  formData.set(
    "contractTenantId",
    overrides.contractTenantId ?? "contract_tenant_1",
  );
  if (overrides.confirmation !== null) {
    formData.set("confirmation", overrides.confirmation ?? "DEMANDER LA FIN");
  }

  Object.entries(overrides).forEach(([key, value]) => {
    if (
      key !== "contractTenantId" &&
      key !== "confirmation" &&
      value !== null
    ) {
      formData.set(key, value);
    }
  });

  return formData;
}

function createContractTenant(overrides: Record<string, unknown> = {}) {
  return {
    id: "contract_tenant_1",
    rentalContractId: "contract_1",
    status: "ACTIVE",
    tenantProfileId: "tenant_profile_1",
    ...overrides,
  };
}

describe("tenant contract termination request action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-10T12:00:00.000Z"));

    mocks.requireTenantAccess.mockResolvedValue({
      user: {
        id: "user_tenant",
        email: "tenant@example.com",
        role: "TENANT",
      },
      tenantProfile: {
        id: "tenant_profile_1",
        userId: "user_tenant",
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
      }),
    );
    mocks.redirect.mockImplementation((url: string) => {
      throw Object.assign(new Error("NEXT_REDIRECT"), { url });
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("creates a termination request for an active contract tenant owned by the tenant", async () => {
    await expect(
      requestTenantContractTerminationAction(createFormData()),
    ).rejects.toMatchObject({
      message: "NEXT_REDIRECT",
      url: "/tenant",
    });

    expect(mocks.contractTenantFindFirst).toHaveBeenCalledWith({
      where: {
        id: "contract_tenant_1",
        tenantProfileId: "tenant_profile_1",
      },
      select: {
        id: true,
        rentalContractId: true,
        status: true,
        tenantProfileId: true,
      },
    });
    expect(mocks.contractTenantUpdateMany).toHaveBeenCalledWith({
      where: {
        id: "contract_tenant_1",
        tenantProfileId: "tenant_profile_1",
        status: "ACTIVE",
      },
      data: {
        status: "TERMINATION_REQUESTED",
      },
    });
    expect(mocks.auditLogCreate).toHaveBeenCalledWith({
      data: {
        userId: "user_tenant",
        action: "contract_tenant.termination_requested",
        entityType: "ContractTenant",
        entityId: "contract_tenant_1",
        metadata: {
          source: "tenant_request_contract_termination",
          rentalContractId: "contract_1",
          tenantProfileId: "tenant_profile_1",
        },
      },
    });
  });

  it("refuses a contract tenant from another tenant", async () => {
    mocks.contractTenantFindFirst.mockResolvedValue(null);

    await expect(
      requestTenantContractTerminationAction(createFormData()),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });

    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("refuses a contract tenant that already has a termination request", async () => {
    mocks.contractTenantFindFirst.mockResolvedValue(
      createContractTenant({
        status: "TERMINATION_REQUESTED",
      }),
    );

    await expect(
      requestTenantContractTerminationAction(createFormData()),
    ).rejects.toMatchObject({
      code: "CONFLICT",
    });

    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("refuses a terminated contract tenant", async () => {
    mocks.contractTenantFindFirst.mockResolvedValue(
      createContractTenant({
        status: "TERMINATED",
      }),
    );

    await expect(
      requestTenantContractTerminationAction(createFormData()),
    ).rejects.toMatchObject({
      code: "CONFLICT",
    });

    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("refuses without the exact textual confirmation", async () => {
    await expect(
      requestTenantContractTerminationAction(
        createFormData({
          confirmation: "CONFIRMER",
        }),
      ),
    ).rejects.toBeInstanceOf(Error);

    expect(mocks.contractTenantFindFirst).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("refuses without confirmation", async () => {
    await expect(
      requestTenantContractTerminationAction(
        createFormData({
          confirmation: null,
        }),
      ),
    ).rejects.toBeInstanceOf(Error);

    expect(mocks.contractTenantFindFirst).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("does not update the rental contract status", async () => {
    await expect(
      requestTenantContractTerminationAction(createFormData()),
    ).rejects.toMatchObject({
      message: "NEXT_REDIRECT",
      url: "/tenant",
    });

    expect(mocks.contractTenantUpdateMany).toHaveBeenCalledTimes(1);
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
  });
});
