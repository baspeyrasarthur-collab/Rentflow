import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auditLogCreate: vi.fn(),
  contractTenantFindFirst: vi.fn(),
  contractTenantUpdateMany: vi.fn(),
  invitationFindFirst: vi.fn(),
  invitationUpdateMany: vi.fn(),
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
    invitation: {
      findFirst: mocks.invitationFindFirst,
    },
    contractTenant: {
      findFirst: mocks.contractTenantFindFirst,
    },
  },
}));

import { acceptTenantDashboardInvitationAction } from "@/app/(tenant)/tenant/invitations/actions";

function createFormData(overrides: Record<string, string | null> = {}) {
  const formData = new FormData();

  formData.set("invitationId", overrides.invitationId ?? "invitation_1");
  if (overrides.confirmAccept !== null) {
    formData.set("confirmAccept", overrides.confirmAccept ?? "on");
  }

  Object.entries(overrides).forEach(([key, value]) => {
    if (key !== "invitationId" && key !== "confirmAccept" && value !== null) {
      formData.set(key, value);
    }
  });

  return formData;
}

function createInvitation(overrides: Record<string, unknown> = {}) {
  return {
    id: "invitation_1",
    tenantEmail: "tenant@example.com",
    propertyId: "property_1",
    rentalContractId: "contract_1",
    contractTenantId: "contract_tenant_1",
    contractTenant: {
      id: "contract_tenant_1",
      status: "INVITED",
      tenantProfileId: null,
    },
    ...overrides,
  };
}

describe("tenant dashboard invitation acceptance action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-10T12:00:00.000Z"));

    mocks.requireTenantAccess.mockResolvedValue({
      user: {
        id: "user_tenant",
        email: "tenant@example.com",
        role: "OWNER",
      },
      tenantProfile: {
        id: "tenant_profile_1",
        userId: "user_tenant",
      },
    });
    mocks.invitationFindFirst.mockResolvedValue(createInvitation());
    mocks.contractTenantFindFirst.mockResolvedValue(null);
    mocks.invitationUpdateMany.mockResolvedValue({ count: 1 });
    mocks.contractTenantUpdateMany.mockResolvedValue({ count: 1 });
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        auditLog: {
          create: mocks.auditLogCreate,
        },
        contractTenant: {
          updateMany: mocks.contractTenantUpdateMany,
        },
        invitation: {
          updateMany: mocks.invitationUpdateMany,
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

  it("accepts a sent non-expired invitation for the connected tenant email", async () => {
    await expect(
      acceptTenantDashboardInvitationAction(createFormData()),
    ).rejects.toMatchObject({
      message: "NEXT_REDIRECT",
      url: "/tenant",
    });

    expect(mocks.invitationFindFirst).toHaveBeenCalledWith({
      where: {
        id: "invitation_1",
        tenantEmail: "tenant@example.com",
        status: "SENT",
        expiresAt: {
          gte: new Date("2026-06-10T12:00:00.000Z"),
        },
      },
      select: expect.any(Object),
    });
    expect(
      mocks.invitationFindFirst.mock.calls[0]?.[0].select,
    ).not.toHaveProperty("tokenHash");
    expect(mocks.contractTenantFindFirst).toHaveBeenCalledWith({
      where: {
        rentalContractId: "contract_1",
        tenantProfileId: "tenant_profile_1",
      },
      select: {
        id: true,
        status: true,
      },
    });
    expect(mocks.invitationUpdateMany).toHaveBeenCalledWith({
      where: {
        id: "invitation_1",
        status: "SENT",
        expiresAt: {
          gte: new Date("2026-06-10T12:00:00.000Z"),
        },
      },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date("2026-06-10T12:00:00.000Z"),
      },
    });
    expect(mocks.contractTenantUpdateMany).toHaveBeenCalledWith({
      where: {
        id: "contract_tenant_1",
        status: "INVITED",
        OR: [
          { tenantProfileId: null },
          { tenantProfileId: "tenant_profile_1" },
        ],
      },
      data: {
        tenantProfileId: "tenant_profile_1",
        status: "ACTIVE",
      },
    });
    expect(mocks.auditLogCreate).toHaveBeenCalledWith({
      data: {
        userId: "user_tenant",
        action: "tenant_invitation.accepted",
        entityType: "Invitation",
        entityId: "invitation_1",
        metadata: {
          source: "tenant_dashboard_accept_invitation",
          invitationId: "invitation_1",
          rentalContractId: "contract_1",
          contractTenantId: "contract_tenant_1",
          tenantProfileId: "tenant_profile_1",
          reusedTerminatedContractTenant: false,
        },
      },
    });
  });

  it("does not accept extra client fields", async () => {
    await expect(
      acceptTenantDashboardInvitationAction(
        createFormData({
          status: "ACCEPTED",
        }),
      ),
    ).rejects.toBeInstanceOf(Error);

    expect(mocks.invitationFindFirst).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("refuses acceptance without explicit confirmation", async () => {
    await expect(
      acceptTenantDashboardInvitationAction(
        createFormData({
          confirmAccept: null,
        }),
      ),
    ).rejects.toBeInstanceOf(Error);

    expect(mocks.invitationFindFirst).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("refuses invitations for another email or no longer pending", async () => {
    mocks.invitationFindFirst.mockResolvedValue(null);

    await expect(
      acceptTenantDashboardInvitationAction(createFormData()),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });

    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("refuses an incompatible contract tenant", async () => {
    mocks.invitationFindFirst.mockResolvedValue(
      createInvitation({
        contractTenant: {
          id: "contract_tenant_1",
          status: "INVITED",
          tenantProfileId: "tenant_profile_other",
        },
      }),
    );

    await expect(
      acceptTenantDashboardInvitationAction(createFormData()),
    ).rejects.toMatchObject({
      code: "CONFLICT",
    });

    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("refuses when the tenant profile is already active on the contract", async () => {
    mocks.contractTenantFindFirst.mockResolvedValue({
      id: "contract_tenant_existing",
      status: "ACTIVE",
    });

    await expect(
      acceptTenantDashboardInvitationAction(createFormData()),
    ).rejects.toMatchObject({
      code: "CONFLICT",
    });

    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("reactivates a terminated contract tenant instead of creating a duplicate", async () => {
    mocks.invitationFindFirst.mockResolvedValue(
      createInvitation({
        contractTenantId: "contract_tenant_previous",
        contractTenant: {
          id: "contract_tenant_previous",
          status: "TERMINATED",
          tenantProfileId: "tenant_profile_1",
        },
      }),
    );
    mocks.contractTenantFindFirst.mockResolvedValue({
      id: "contract_tenant_previous",
      status: "TERMINATED",
    });

    await expect(
      acceptTenantDashboardInvitationAction(createFormData()),
    ).rejects.toMatchObject({
      message: "NEXT_REDIRECT",
      url: "/tenant",
    });

    expect(mocks.contractTenantUpdateMany).toHaveBeenCalledWith({
      where: {
        id: "contract_tenant_previous",
        status: "TERMINATED",
        tenantProfileId: "tenant_profile_1",
      },
      data: {
        status: "ACTIVE",
        startDate: new Date("2026-06-10T12:00:00.000Z"),
        endDate: null,
      },
    });
    expect(mocks.auditLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        metadata: expect.objectContaining({
          contractTenantId: "contract_tenant_previous",
          reusedTerminatedContractTenant: true,
        }),
      }),
    });
  });

  it("refuses a tenant slot that is already active", async () => {
    mocks.invitationFindFirst.mockResolvedValue(
      createInvitation({
        contractTenant: {
          id: "contract_tenant_1",
          status: "ACTIVE",
          tenantProfileId: null,
        },
      }),
    );

    await expect(
      acceptTenantDashboardInvitationAction(createFormData()),
    ).rejects.toMatchObject({
      code: "CONFLICT",
    });

    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("keeps the rental contract untouched while accepting the tenant slot", async () => {
    await expect(
      acceptTenantDashboardInvitationAction(createFormData()),
    ).rejects.toMatchObject({
      message: "NEXT_REDIRECT",
      url: "/tenant",
    });

    expect(mocks.contractTenantUpdateMany).toHaveBeenCalledTimes(1);
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
  });
});
