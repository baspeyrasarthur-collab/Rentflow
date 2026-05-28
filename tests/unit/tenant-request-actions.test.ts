import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auditLogCreate: vi.fn(),
  contractTenantFindFirst: vi.fn(),
  notificationCreate: vi.fn(),
  redirect: vi.fn(),
  requireOwnerAccess: vi.fn(),
  requireTenantAccess: vi.fn(),
  tenantRequestCreate: vi.fn(),
  tenantRequestFindFirst: vi.fn(),
  tenantRequestUpdateMany: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/server/auth/access", () => ({
  requireOwnerAccess: mocks.requireOwnerAccess,
  requireTenantAccess: mocks.requireTenantAccess,
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
    contractTenant: {
      findFirst: mocks.contractTenantFindFirst,
    },
    tenantRequest: {
      findFirst: mocks.tenantRequestFindFirst,
    },
  },
}));

import {
  acknowledgeRefusedTenantRequestAction,
  acknowledgeResolvedTenantRequestAction,
  createTenantRequestAction,
} from "@/app/(tenant)/tenant/requests/actions";
import {
  refuseOwnerTenantRequestAction,
  resolveOwnerTenantRequestAction,
} from "@/app/(owner)/owner/tenants/requests/actions";

function formDataFrom(values: Record<string, string>) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }

  return formData;
}

function createTargetContractTenant() {
  return {
    id: "contract_tenant_1",
    rentalContractId: "contract_1",
    rentalContract: {
      id: "contract_1",
      ownerProfileId: "owner_profile_1",
      propertyId: "property_1",
      property: {
        name: "Appartement Canal",
      },
      ownerProfile: {
        userId: "user_owner",
      },
    },
  };
}

function createOpenTenantRequest(status = "OPEN") {
  return {
    id: "tenant_request_1",
    status,
    tenantProfile: {
      userId: "user_tenant",
    },
    property: {
      name: "Appartement Canal",
    },
  };
}

describe("tenant request actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireTenantAccess.mockResolvedValue({
      user: {
        id: "user_tenant",
        email: "tenant@example.com",
      },
      tenantProfile: {
        id: "tenant_profile_1",
      },
    });
    mocks.requireOwnerAccess.mockResolvedValue({
      user: {
        id: "user_owner",
        email: "owner@example.com",
      },
      ownerProfile: {
        id: "owner_profile_1",
      },
    });
    mocks.contractTenantFindFirst.mockResolvedValue(
      createTargetContractTenant(),
    );
    mocks.tenantRequestFindFirst.mockResolvedValue(createOpenTenantRequest());
    mocks.tenantRequestCreate.mockResolvedValue({
      id: "tenant_request_1",
    });
    mocks.tenantRequestUpdateMany.mockResolvedValue({ count: 1 });
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        auditLog: {
          create: mocks.auditLogCreate,
        },
        notification: {
          create: mocks.notificationCreate,
        },
        tenantRequest: {
          create: mocks.tenantRequestCreate,
          updateMany: mocks.tenantRequestUpdateMany,
        },
      }),
    );
    mocks.redirect.mockImplementation((url: string) => {
      throw Object.assign(new Error("NEXT_REDIRECT"), { url });
    });
  });

  it("creates an open tenant request for the connected tenant attachment", async () => {
    await expect(
      createTenantRequestAction(
        formDataFrom({
          contractTenantId: "contract_tenant_1",
          category: "REPAIR",
          title: "Chauffage bloque",
          description: "Le chauffage du salon ne demarre plus.",
        }),
      ),
    ).rejects.toMatchObject({
      message: "NEXT_REDIRECT",
      url: "/tenant/requests",
    });

    expect(mocks.contractTenantFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "contract_tenant_1",
          tenantProfileId: "tenant_profile_1",
        }),
      }),
    );
    expect(mocks.tenantRequestCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        status: "OPEN",
        tenantProfileId: "tenant_profile_1",
        ownerProfileId: "owner_profile_1",
        propertyId: "property_1",
        rentalContractId: "contract_1",
        contractTenantId: "contract_tenant_1",
      }),
      select: {
        id: true,
      },
    });
    expect(mocks.notificationCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user_owner",
        type: "SYSTEM_ALERT",
      }),
    });
    expect(mocks.auditLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user_tenant",
        action: "tenant_request.created",
        entityType: "TenantRequest",
      }),
    });
  });

  it("resolves an open tenant request for the connected owner", async () => {
    await expect(
      resolveOwnerTenantRequestAction(
        formDataFrom({
          tenantRequestId: "tenant_request_1",
          confirmResolved: "on",
          ownerResponse: "Intervention planifiee.",
        }),
      ),
    ).rejects.toMatchObject({
      message: "NEXT_REDIRECT",
      url: "/owner/tenants",
    });

    expect(mocks.tenantRequestFindFirst).toHaveBeenCalledWith({
      where: {
        id: "tenant_request_1",
        ownerProfileId: "owner_profile_1",
      },
      select: expect.any(Object),
    });
    expect(mocks.tenantRequestUpdateMany).toHaveBeenCalledWith({
      where: {
        id: "tenant_request_1",
        ownerProfileId: "owner_profile_1",
        status: "OPEN",
      },
      data: expect.objectContaining({
        status: "RESOLVED_BY_OWNER",
        ownerResponse: "Intervention planifiee.",
      }),
    });
    expect(mocks.notificationCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user_tenant",
        type: "SYSTEM_ALERT",
      }),
    });
  });

  it("refuses an open tenant request for the connected owner", async () => {
    await expect(
      refuseOwnerTenantRequestAction(
        formDataFrom({
          tenantRequestId: "tenant_request_1",
          confirmRefused: "on",
        }),
      ),
    ).rejects.toMatchObject({
      message: "NEXT_REDIRECT",
      url: "/owner/tenants",
    });

    expect(mocks.tenantRequestUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "REFUSED_BY_OWNER",
        }),
      }),
    );
    expect(mocks.auditLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user_owner",
        action: "tenant_request.refused_by_owner",
      }),
    });
  });

  it("acknowledges an owner response for the connected tenant", async () => {
    mocks.tenantRequestFindFirst.mockResolvedValue({
      id: "tenant_request_1",
      status: "RESOLVED_BY_OWNER",
    });

    await expect(
      acknowledgeResolvedTenantRequestAction(
        formDataFrom({
          tenantRequestId: "tenant_request_1",
          confirmAcknowledge: "on",
        }),
      ),
    ).rejects.toMatchObject({
      message: "NEXT_REDIRECT",
      url: "/tenant",
    });

    expect(mocks.tenantRequestFindFirst).toHaveBeenCalledWith({
      where: {
        id: "tenant_request_1",
        tenantProfileId: "tenant_profile_1",
      },
      select: {
        id: true,
        status: true,
      },
    });
    expect(mocks.tenantRequestUpdateMany).toHaveBeenCalledWith({
      where: {
        id: "tenant_request_1",
        tenantProfileId: "tenant_profile_1",
        status: "RESOLVED_BY_OWNER",
      },
      data: expect.objectContaining({
        status: "ACKNOWLEDGED_BY_TENANT",
      }),
    });
  });

  it("returns to the dedicated requests page when requested by the tenant UI", async () => {
    mocks.tenantRequestFindFirst.mockResolvedValue({
      id: "tenant_request_1",
      status: "RESOLVED_BY_OWNER",
    });

    await expect(
      acknowledgeResolvedTenantRequestAction(
        formDataFrom({
          tenantRequestId: "tenant_request_1",
          confirmAcknowledge: "on",
          returnTo: "/tenant/requests",
        }),
      ),
    ).rejects.toMatchObject({
      message: "NEXT_REDIRECT",
      url: "/tenant/requests",
    });
  });

  it("refuses tenant acknowledge when the expected status does not match", async () => {
    mocks.tenantRequestFindFirst.mockResolvedValue({
      id: "tenant_request_1",
      status: "OPEN",
    });

    await expect(
      acknowledgeRefusedTenantRequestAction(
        formDataFrom({
          tenantRequestId: "tenant_request_1",
          confirmAcknowledge: "on",
        }),
      ),
    ).rejects.toMatchObject({
      code: "CONFLICT",
    });

    expect(mocks.tenantRequestUpdateMany).not.toHaveBeenCalled();
  });
});
