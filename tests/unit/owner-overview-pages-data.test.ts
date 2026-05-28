import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  contractTenantFindMany: vi.fn(),
  getCurrentOwnerProfileForProperties: vi.fn(),
  invitationFindMany: vi.fn(),
  paymentAggregate: vi.fn(),
  paymentCount: vi.fn(),
  paymentFindMany: vi.fn(),
  propertyFindMany: vi.fn(),
  receiptCount: vi.fn(),
  receiptFindMany: vi.fn(),
  rentalContractCount: vi.fn(),
  rentalContractFindMany: vi.fn(),
  tenantRequestFindMany: vi.fn(),
}));

vi.mock("@/server/owner/properties", () => ({
  getCurrentOwnerProfileForProperties:
    mocks.getCurrentOwnerProfileForProperties,
}));

vi.mock("@/server/owner/finances", () => ({
  OWNER_FINANCE_REMAINING_PAYMENT_STATUSES: [
    "PLANNED",
    "PENDING",
    "PROCESSING",
    "FAILED",
    "DISPUTED",
  ],
  getOwnerFinanceMonthRange: vi.fn(() => ({
    start: new Date("2026-05-01T00:00:00.000Z"),
    end: new Date("2026-06-01T00:00:00.000Z"),
  })),
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    contractTenant: {
      findMany: mocks.contractTenantFindMany,
    },
    invitation: {
      findMany: mocks.invitationFindMany,
    },
    payment: {
      aggregate: mocks.paymentAggregate,
      count: mocks.paymentCount,
      findMany: mocks.paymentFindMany,
    },
    property: {
      findMany: mocks.propertyFindMany,
    },
    receipt: {
      count: mocks.receiptCount,
      findMany: mocks.receiptFindMany,
    },
    rentalContract: {
      count: mocks.rentalContractCount,
      findMany: mocks.rentalContractFindMany,
    },
    tenantRequest: {
      findMany: mocks.tenantRequestFindMany,
    },
  },
}));

import { listOwnerPropertiesForContractCreation } from "@/server/owner/contracts";
import { getOwnerContractsOverview } from "@/server/owner/contracts-overview";
import { getOwnerPaymentsOverview } from "@/server/owner/payments-overview";
import { getOwnerReceiptsOverview } from "@/server/owner/receipts-overview";
import { getOwnerTenantInvitationContractOptions } from "@/server/owner/tenant-invitations";
import { getOwnerTenantsOverview } from "@/server/owner/tenants";

describe("owner overview pages data", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-16T12:00:00.000Z"));
    vi.clearAllMocks();
    mocks.getCurrentOwnerProfileForProperties.mockResolvedValue({
      ownerProfile: {
        id: "owner_profile_1",
      },
    });
  });

  it("loads tenants and invitations only through owner-scoped relations", async () => {
    mocks.contractTenantFindMany.mockResolvedValue([
      { id: "tenant_active", status: "ACTIVE" },
      { id: "tenant_former", status: "TERMINATED" },
    ]);
    mocks.invitationFindMany.mockResolvedValue([
      { id: "invitation_sent", status: "SENT" },
      { id: "invitation_accepted", status: "ACCEPTED" },
    ]);
    mocks.tenantRequestFindMany.mockResolvedValue([
      { id: "request_open", status: "OPEN" },
      { id: "request_resolved", status: "RESOLVED_BY_OWNER" },
    ]);
    mocks.rentalContractCount.mockResolvedValue(3);

    const overview = await getOwnerTenantsOverview();

    expect(overview.summary).toEqual({
      activeTenants: 1,
      pendingInvitations: 1,
      formerTenants: 1,
      openTenantRequests: 1,
      contractCount: 3,
    });
    expect(mocks.contractTenantFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          rentalContract: {
            ownerProfileId: "owner_profile_1",
          },
        },
      }),
    );
    expect(mocks.invitationFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          ownerProfileId: "owner_profile_1",
        },
      }),
    );
    expect(mocks.tenantRequestFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          ownerProfileId: "owner_profile_1",
          status: {
            in: ["OPEN", "RESOLVED_BY_OWNER", "REFUSED_BY_OWNER"],
          },
        },
      }),
    );
  });

  it("loads contract overview with a strict ownerProfileId filter", async () => {
    mocks.rentalContractFindMany.mockResolvedValue([
      {
        id: "contract_draft",
        status: "DRAFT",
        contractTenants: [],
        _count: {
          contractTenants: 0,
        },
      },
      {
        id: "contract_active",
        status: "ACTIVE",
        contractTenants: [{ id: "contract_tenant_active" }],
        _count: {
          contractTenants: 1,
        },
      },
      {
        id: "contract_without_active_tenant",
        status: "ACTIVE",
        contractTenants: [],
        _count: {
          contractTenants: 1,
        },
      },
    ]);

    const overview = await getOwnerContractsOverview();

    expect(overview.summary).toEqual({
      totalContracts: 3,
      draftContracts: 1,
      activeContracts: 2,
      pausedOrFinishedContracts: 0,
    });
    expect(mocks.rentalContractFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          ownerProfileId: "owner_profile_1",
        },
      }),
    );
    expect(overview.contractsWithoutActiveTenant).toHaveLength(2);
  });

  it("loads payments with owner filters and keeps Payment.status read-only", async () => {
    mocks.paymentFindMany.mockResolvedValueOnce([]).mockResolvedValueOnce([
      {
        id: "payment_declared",
        declarations: [{ declarationType: "PAID_EXTERNALLY" }],
      },
      {
        id: "payment_not_paid",
        declarations: [{ declarationType: "NOT_PAID_YET" }],
      },
    ]);
    mocks.paymentAggregate
      .mockResolvedValueOnce({ _sum: { amountInCents: 120000 } })
      .mockResolvedValueOnce({ _sum: { amountInCents: 90000 } });
    mocks.paymentCount.mockResolvedValue(2);

    const overview = await getOwnerPaymentsOverview();

    expect(overview.summary).toEqual({
      expectedRentInCents: 120000,
      collectedRentInCents: 90000,
      watchPayments: 2,
      declaredPaidExternalPayments: 1,
    });
    expect(mocks.paymentFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          ownerProfileId: "owner_profile_1",
          type: "RENT",
        },
      }),
    );
    expect(mocks.paymentCount).toHaveBeenCalledWith({
      where: {
        ownerProfileId: "owner_profile_1",
        type: "RENT",
        dueDate: {
          lt: new Date("2026-05-16T12:00:00.000Z"),
        },
        status: {
          in: ["PLANNED", "PENDING", "PROCESSING", "FAILED", "DISPUTED"],
        },
      },
    });
    expect(mocks.paymentFindMany.mock.calls.flat()).not.toEqual(
      expect.objectContaining({
        data: expect.anything(),
      }),
    );
  });

  it("loads receipts and counters with ownerProfileId filters", async () => {
    mocks.receiptFindMany
      .mockResolvedValueOnce([
        { id: "receipt_requested", status: "REQUESTED" },
        { id: "receipt_generated", status: "GENERATED" },
      ])
      .mockResolvedValueOnce([
        { propertyId: "property_1" },
        { propertyId: "property_1" },
        { propertyId: "property_2" },
      ]);
    mocks.receiptCount
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0);

    const overview = await getOwnerReceiptsOverview();

    expect(overview.summary).toEqual({
      requestedReceipts: 1,
      generatedReceipts: 1,
      sentReceipts: 0,
      propertiesWithReceipts: 2,
    });
    expect(mocks.receiptFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          ownerProfileId: "owner_profile_1",
          status: {
            not: "CANCELED",
          },
        },
      }),
    );
    expect(mocks.receiptCount).toHaveBeenCalledWith({
      where: {
        ownerProfileId: "owner_profile_1",
        status: "REQUESTED",
      },
    });
  });

  it("loads tenant invitation contract options with owner and eligibility filters", async () => {
    mocks.rentalContractFindMany.mockResolvedValue([
      {
        id: "contract_ready",
        contractTenants: [],
        invitations: [],
      },
      {
        id: "contract_with_active_tenant",
        contractTenants: [{ id: "contract_tenant_active" }],
        invitations: [],
      },
      {
        id: "contract_with_sent_invitation",
        contractTenants: [],
        invitations: [{ id: "invitation_sent" }],
      },
    ]);

    const options = await getOwnerTenantInvitationContractOptions();

    expect(options).toEqual([
      expect.objectContaining({
        id: "contract_ready",
      }),
    ]);
    expect(mocks.rentalContractFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          ownerProfileId: "owner_profile_1",
          status: "DRAFT",
          contractType: "INDIVIDUAL",
          colocationMode: "NONE",
          property: {
            status: {
              not: "ARCHIVED",
            },
          },
        },
        select: expect.objectContaining({
          contractTenants: expect.objectContaining({
            where: {
              status: "ACTIVE",
            },
          }),
          invitations: expect.objectContaining({
            where: expect.objectContaining({
              status: "SENT",
            }),
          }),
        }),
      }),
    );
  });

  it("loads contract creation properties with owner filter and excludes archived properties", async () => {
    mocks.propertyFindMany.mockResolvedValue([
      {
        id: "property_available",
        status: "ACTIVE",
      },
    ]);

    const properties = await listOwnerPropertiesForContractCreation();

    expect(properties).toEqual([
      expect.objectContaining({
        id: "property_available",
      }),
    ]);
    expect(mocks.propertyFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          ownerProfileId: "owner_profile_1",
          status: {
            not: "ARCHIVED",
          },
        },
      }),
    );
  });
});
