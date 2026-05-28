import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { hashInvitationToken } from "@/server/owner/invitation-token";

const mocks = vi.hoisted(() => ({
  auditLogCreate: vi.fn(),
  auth: vi.fn(),
  contractTenantFindFirst: vi.fn(),
  contractTenantUpdateMany: vi.fn(),
  invitationFindUnique: vi.fn(),
  invitationUpdateMany: vi.fn(),
  redirect: vi.fn(),
  tenantProfileCreate: vi.fn(),
  tenantProfileFindUnique: vi.fn(),
  transaction: vi.fn(),
  userFindUnique: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
    invitation: {
      findUnique: mocks.invitationFindUnique,
    },
    user: {
      findUnique: mocks.userFindUnique,
    },
  },
}));

import { acceptTenantInvitationAction } from "@/app/invitations/accept/actions";

const rawToken = "valid-token-value-that-is-long-enough-for-tests";

function createInvitation(overrides: Record<string, unknown> = {}) {
  return {
    id: "invitation_1",
    tenantEmail: "locataire@example.com",
    status: "SENT",
    expiresAt: new Date("2026-06-20T00:00:00.000Z"),
    acceptedAt: null,
    canceledAt: null,
    ownerProfileId: "owner_profile_1",
    propertyId: "property_1",
    rentalContractId: "contract_1",
    contractTenantId: "contract_tenant_1",
    rentalContract: {
      id: "contract_1",
      status: "DRAFT",
      contractType: "INDIVIDUAL",
      colocationMode: "NONE",
    },
    contractTenant: {
      id: "contract_tenant_1",
      tenantProfileId: null,
      status: "INVITED",
    },
    ...overrides,
  };
}

function createUser(overrides: Record<string, unknown> = {}) {
  return {
    id: "user_1",
    email: "locataire@example.com",
    role: "TENANT",
    disabledAt: null,
    ownerProfile: null,
    tenantProfile: {
      id: "tenant_profile_1",
    },
    ...overrides,
  };
}

function createFormData(overrides: { confirmAccept?: string | null } = {}) {
  const formData = new FormData();

  formData.set("token", rawToken);
  if (overrides.confirmAccept !== null) {
    formData.set("confirmAccept", overrides.confirmAccept ?? "on");
  }

  return formData;
}

describe("tenant invitation acceptance action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-10T12:00:00.000Z"));

    mocks.auth.mockResolvedValue({
      userId: "clerk_user_1",
    });
    mocks.userFindUnique.mockResolvedValue(createUser());
    mocks.invitationFindUnique.mockResolvedValue(createInvitation());
    mocks.tenantProfileFindUnique.mockResolvedValue(null);
    mocks.tenantProfileCreate.mockResolvedValue({
      id: "tenant_profile_created",
    });
    mocks.contractTenantFindFirst.mockResolvedValue(null);
    mocks.invitationUpdateMany.mockResolvedValue({ count: 1 });
    mocks.contractTenantUpdateMany.mockResolvedValue({ count: 1 });
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        auditLog: {
          create: mocks.auditLogCreate,
        },
        contractTenant: {
          findFirst: mocks.contractTenantFindFirst,
          updateMany: mocks.contractTenantUpdateMany,
        },
        invitation: {
          updateMany: mocks.invitationUpdateMany,
        },
        tenantProfile: {
          create: mocks.tenantProfileCreate,
          findUnique: mocks.tenantProfileFindUnique,
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

  it("accepts an invitation for an existing TENANT profile", async () => {
    await expect(
      acceptTenantInvitationAction(createFormData()),
    ).rejects.toMatchObject({
      message: "NEXT_REDIRECT",
      url: "/tenant",
    });

    expect(mocks.invitationFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tokenHash: hashInvitationToken(rawToken),
        },
      }),
    );
    expect(mocks.tenantProfileFindUnique).not.toHaveBeenCalled();
    expect(mocks.tenantProfileCreate).not.toHaveBeenCalled();
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
    expect(mocks.contractTenantUpdateMany).toHaveBeenCalledWith({
      where: {
        id: "contract_tenant_1",
        status: "INVITED",
        tenantProfileId: null,
      },
      data: {
        tenantProfileId: "tenant_profile_1",
        status: "ACTIVE",
      },
    });
    expect(mocks.auditLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user_1",
        action: "tenant_invitation.accepted",
        entityType: "Invitation",
        entityId: "invitation_1",
        metadata: expect.objectContaining({
          createdTenantProfile: false,
          tenantProfileId: "tenant_profile_1",
          reusedTerminatedContractTenant: false,
        }),
      }),
    });
  });

  it("creates a TenantProfile for an OWNER with matching email without changing the user role", async () => {
    mocks.userFindUnique.mockResolvedValue(
      createUser({
        role: "OWNER",
        ownerProfile: {
          id: "owner_profile_1",
        },
        tenantProfile: null,
      }),
    );

    await expect(
      acceptTenantInvitationAction(createFormData()),
    ).rejects.toMatchObject({
      message: "NEXT_REDIRECT",
      url: "/tenant",
    });

    expect(mocks.tenantProfileFindUnique).toHaveBeenCalledWith({
      where: {
        userId: "user_1",
      },
      select: {
        id: true,
      },
    });
    expect(mocks.tenantProfileCreate).toHaveBeenCalledWith({
      data: {
        userId: "user_1",
      },
      select: {
        id: true,
      },
    });
    expect(mocks.contractTenantUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          tenantProfileId: "tenant_profile_created",
          status: "ACTIVE",
        },
      }),
    );
    expect(mocks.auditLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        metadata: expect.objectContaining({
          createdTenantProfile: true,
          tenantProfileId: "tenant_profile_created",
        }),
      }),
    });
    expect(mocks.userFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          role: true,
          ownerProfile: {
            select: {
              id: true,
            },
          },
        }),
      }),
    );
  });

  it("creates a TenantProfile for a TENANT user when it is missing", async () => {
    mocks.userFindUnique.mockResolvedValue(
      createUser({
        role: "TENANT",
        tenantProfile: null,
      }),
    );

    await expect(
      acceptTenantInvitationAction(createFormData()),
    ).rejects.toMatchObject({
      message: "NEXT_REDIRECT",
      url: "/tenant",
    });

    expect(mocks.tenantProfileCreate).toHaveBeenCalledWith({
      data: {
        userId: "user_1",
      },
      select: {
        id: true,
      },
    });
    expect(mocks.contractTenantUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          tenantProfileId: "tenant_profile_created",
          status: "ACTIVE",
        },
      }),
    );
  });

  it("reuses an existing TenantProfile for an OWNER with matching email", async () => {
    mocks.userFindUnique.mockResolvedValue(
      createUser({
        role: "OWNER",
        ownerProfile: {
          id: "owner_profile_1",
        },
        tenantProfile: {
          id: "tenant_profile_existing",
        },
      }),
    );

    await expect(
      acceptTenantInvitationAction(createFormData()),
    ).rejects.toMatchObject({
      message: "NEXT_REDIRECT",
      url: "/tenant",
    });

    expect(mocks.tenantProfileFindUnique).not.toHaveBeenCalled();
    expect(mocks.tenantProfileCreate).not.toHaveBeenCalled();
    expect(mocks.contractTenantUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          tenantProfileId: "tenant_profile_existing",
          status: "ACTIVE",
        },
      }),
    );
    expect(mocks.auditLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        metadata: expect.objectContaining({
          createdTenantProfile: false,
          tenantProfileId: "tenant_profile_existing",
        }),
      }),
    });
  });

  it("reuses a TenantProfile created before the transaction when the user is an OWNER", async () => {
    mocks.userFindUnique.mockResolvedValue(
      createUser({
        role: "OWNER",
        tenantProfile: null,
      }),
    );
    mocks.tenantProfileFindUnique.mockResolvedValue({
      id: "tenant_profile_existing",
    });

    await expect(
      acceptTenantInvitationAction(createFormData()),
    ).rejects.toMatchObject({
      message: "NEXT_REDIRECT",
      url: "/tenant",
    });

    expect(mocks.tenantProfileCreate).not.toHaveBeenCalled();
    expect(mocks.contractTenantUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          tenantProfileId: "tenant_profile_existing",
          status: "ACTIVE",
        },
      }),
    );
    expect(mocks.auditLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        metadata: expect.objectContaining({
          createdTenantProfile: false,
          tenantProfileId: "tenant_profile_existing",
        }),
      }),
    });
  });

  it("refuses ADMIN users", async () => {
    mocks.userFindUnique.mockResolvedValue(
      createUser({
        role: "ADMIN",
        tenantProfile: null,
      }),
    );

    await expect(
      acceptTenantInvitationAction(createFormData()),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
    });

    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("refuses cleanly when the tenant profile is already active on the contract", async () => {
    mocks.contractTenantFindFirst.mockResolvedValue({
      id: "contract_tenant_existing",
      status: "ACTIVE",
    });

    await expect(
      acceptTenantInvitationAction(createFormData()),
    ).rejects.toMatchObject({
      code: "CONFLICT",
    });

    expect(mocks.invitationUpdateMany).not.toHaveBeenCalled();
    expect(mocks.contractTenantUpdateMany).not.toHaveBeenCalled();
  });

  it("reactivates a terminated contract tenant for a reinvitation", async () => {
    mocks.invitationFindUnique.mockResolvedValue(
      createInvitation({
        contractTenantId: "contract_tenant_previous",
        contractTenant: {
          id: "contract_tenant_previous",
          tenantProfileId: "tenant_profile_1",
          status: "TERMINATED",
        },
      }),
    );
    mocks.contractTenantFindFirst.mockResolvedValue({
      id: "contract_tenant_previous",
      status: "TERMINATED",
    });

    await expect(
      acceptTenantInvitationAction(createFormData()),
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

  it("refuses acceptance without explicit confirmation", async () => {
    await expect(
      acceptTenantInvitationAction(createFormData({ confirmAccept: null })),
    ).rejects.toBeInstanceOf(Error);

    expect(mocks.auth).not.toHaveBeenCalled();
    expect(mocks.invitationFindUnique).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("refuses a connected account with a different email", async () => {
    mocks.userFindUnique.mockResolvedValue(
      createUser({
        email: "autre@example.com",
      }),
    );

    await expect(
      acceptTenantInvitationAction(createFormData()),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
    });

    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("refuses invitations that are no longer sent", async () => {
    mocks.invitationFindUnique.mockResolvedValue(
      createInvitation({
        status: "ACCEPTED",
      }),
    );

    await expect(
      acceptTenantInvitationAction(createFormData()),
    ).rejects.toMatchObject({
      code: "CONFLICT",
    });

    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("refuses expired invitations", async () => {
    mocks.invitationFindUnique.mockResolvedValue(
      createInvitation({
        expiresAt: new Date("2026-06-01T00:00:00.000Z"),
      }),
    );

    await expect(
      acceptTenantInvitationAction(createFormData()),
    ).rejects.toMatchObject({
      code: "CONFLICT",
    });

    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("keeps the rental contract untouched while accepting the tenant slot", async () => {
    await expect(
      acceptTenantInvitationAction(createFormData()),
    ).rejects.toMatchObject({
      message: "NEXT_REDIRECT",
      url: "/tenant",
    });

    expect(mocks.contractTenantUpdateMany).toHaveBeenCalledTimes(1);
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
  });
});
