import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auditLogCreate: vi.fn(),
  contractTenantCreate: vi.fn(),
  contractTenantFindFirst: vi.fn(),
  getOwnerContractForInvitation: vi.fn(),
  invitationCreate: vi.fn(),
  invitationFindFirst: vi.fn(),
  redirect: vi.fn(),
  sendEmail: vi.fn(),
  transaction: vi.fn(),
  userFindUnique: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/server/config/env", () => ({
  env: {
    NEXT_PUBLIC_APP_URL: "https://rentflow.test",
  },
}));

vi.mock("@/server/email", () => ({
  getEmailProvider: () => ({
    sendEmail: mocks.sendEmail,
  }),
}));

vi.mock("@/server/owner/invitations", () => ({
  getOwnerContractForInvitation: mocks.getOwnerContractForInvitation,
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
    contractTenant: {
      findFirst: mocks.contractTenantFindFirst,
    },
    invitation: {
      findFirst: mocks.invitationFindFirst,
    },
    user: {
      findUnique: mocks.userFindUnique,
    },
  },
}));

import { createOwnerTenantInvitationAction } from "@/app/(owner)/owner/properties/[id]/contracts/[contractId]/invitations/new/actions";

function createFormData() {
  const formData = new FormData();

  formData.set("tenantEmail", "locataire@example.com");
  formData.set("tenantFirstName", "Camille");
  formData.set("tenantLastName", "Martin");

  return formData;
}

function createOwnerInvitationContext() {
  return {
    user: {
      id: "user_owner",
    },
    ownerProfile: {
      id: "owner_profile_1",
    },
    property: {
      id: "property_1",
    },
    contract: {
      id: "contract_1",
      startDate: new Date("2026-06-01T00:00:00.000Z"),
      endDate: null,
      totalRentAmountInCents: 95000,
      totalChargesAmountInCents: 12000,
      depositAmountInCents: 95000,
      currency: "EUR",
    },
  };
}

describe("owner tenant invitation creation action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-10T12:00:00.000Z"));

    mocks.getOwnerContractForInvitation.mockResolvedValue(
      createOwnerInvitationContext(),
    );
    mocks.invitationFindFirst.mockResolvedValue(null);
    mocks.userFindUnique.mockResolvedValue(null);
    mocks.contractTenantFindFirst.mockResolvedValue(null);
    mocks.contractTenantCreate.mockResolvedValue({
      id: "contract_tenant_new",
    });
    mocks.invitationCreate.mockResolvedValue({
      id: "invitation_1",
    });
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        auditLog: {
          create: mocks.auditLogCreate,
        },
        contractTenant: {
          create: mocks.contractTenantCreate,
        },
        invitation: {
          create: mocks.invitationCreate,
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

  it("refuses invitation creation when the tenant is already attached to the contract", async () => {
    mocks.userFindUnique.mockResolvedValue({
      tenantProfile: {
        id: "tenant_profile_1",
      },
    });
    mocks.contractTenantFindFirst.mockResolvedValue({
      id: "contract_tenant_active",
      status: "ACTIVE",
    });

    await expect(
      createOwnerTenantInvitationAction(
        "property_1",
        "contract_1",
        createFormData(),
      ),
    ).rejects.toMatchObject({
      code: "CONFLICT",
    });

    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.invitationCreate).not.toHaveBeenCalled();
  });

  it("reuses a terminated contract tenant as the invitation target", async () => {
    mocks.userFindUnique.mockResolvedValue({
      tenantProfile: {
        id: "tenant_profile_1",
      },
    });
    mocks.contractTenantFindFirst.mockResolvedValue({
      id: "contract_tenant_previous",
      status: "TERMINATED",
    });

    await expect(
      createOwnerTenantInvitationAction(
        "property_1",
        "contract_1",
        createFormData(),
      ),
    ).rejects.toMatchObject({
      message: "NEXT_REDIRECT",
      url: "/owner/properties/property_1/contracts/contract_1",
    });

    expect(mocks.contractTenantCreate).not.toHaveBeenCalled();
    expect(mocks.invitationCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        contractTenantId: "contract_tenant_previous",
        rentalContractId: "contract_1",
        status: "SENT",
      }),
      select: {
        id: true,
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

  it("creates a new invited contract tenant when there is no historical attachment", async () => {
    await expect(
      createOwnerTenantInvitationAction(
        "property_1",
        "contract_1",
        createFormData(),
      ),
    ).rejects.toMatchObject({
      message: "NEXT_REDIRECT",
      url: "/owner/properties/property_1/contracts/contract_1",
    });

    expect(mocks.contractTenantCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        rentalContractId: "contract_1",
        tenantProfileId: null,
        invitedEmail: "locataire@example.com",
        status: "INVITED",
      }),
      select: {
        id: true,
      },
    });
    expect(mocks.invitationCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        contractTenantId: "contract_tenant_new",
        rentalContractId: "contract_1",
        status: "SENT",
      }),
      select: {
        id: true,
      },
    });
  });
});
