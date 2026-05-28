import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  expenseAggregate: vi.fn(),
  invitationFindMany: vi.fn(),
  paymentAggregate: vi.fn(),
  paymentCount: vi.fn(),
  paymentFindMany: vi.fn(),
  propertyCount: vi.fn(),
  propertyFindMany: vi.fn(),
  receiptCount: vi.fn(),
  receiptFindMany: vi.fn(),
  rentalContractCount: vi.fn(),
  requireOwnerAccess: vi.fn(),
  tenantRequestFindMany: vi.fn(),
}));

vi.mock("@/server/auth/access", () => ({
  requireOwnerAccess: mocks.requireOwnerAccess,
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    payment: {
      aggregate: mocks.paymentAggregate,
      count: mocks.paymentCount,
      findMany: mocks.paymentFindMany,
    },
    expense: {
      aggregate: mocks.expenseAggregate,
    },
    invitation: {
      findMany: mocks.invitationFindMany,
    },
    property: {
      count: mocks.propertyCount,
      findMany: mocks.propertyFindMany,
    },
    receipt: {
      count: mocks.receiptCount,
      findMany: mocks.receiptFindMany,
    },
    rentalContract: {
      count: mocks.rentalContractCount,
    },
    tenantRequest: {
      findMany: mocks.tenantRequestFindMany,
    },
  },
}));

import { getOwnerDashboardData } from "@/server/owner/dashboard";

describe("owner dashboard action signals", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-16T12:00:00.000Z"));
    vi.clearAllMocks();

    mocks.requireOwnerAccess.mockResolvedValue({
      user: {
        id: "user_owner",
        email: "owner@example.com",
        role: "TENANT",
      },
      ownerProfile: {
        id: "owner_profile_1",
        userId: "user_owner",
        plan: "FREE",
      },
    });
    mocks.propertyCount
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1);
    mocks.rentalContractCount.mockResolvedValueOnce(1).mockResolvedValueOnce(2);
    mocks.paymentCount
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(2);
    mocks.paymentAggregate
      .mockResolvedValueOnce({ _sum: { amountInCents: 200000 } })
      .mockResolvedValueOnce({ _sum: { amountInCents: 80000 } })
      .mockResolvedValueOnce({ _sum: { amountInCents: 120000 } });
    mocks.expenseAggregate.mockResolvedValue({
      _sum: {
        amountInCents: 30000,
      },
    });
    mocks.paymentFindMany
      .mockResolvedValueOnce([
        {
          id: "payment_with_latest_paid_declaration",
          declarations: [{ declarationType: "PAID_EXTERNALLY" }],
        },
        {
          id: "payment_with_latest_not_paid_declaration",
          declarations: [{ declarationType: "NOT_PAID_YET" }],
        },
      ])
      .mockResolvedValueOnce([]);
    mocks.receiptCount.mockResolvedValue(4);
    mocks.receiptFindMany.mockResolvedValue([]);
    mocks.invitationFindMany.mockResolvedValue([]);
    mocks.tenantRequestFindMany.mockResolvedValue([]);
    mocks.propertyFindMany.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("loads owner-scoped counters for actionable dashboard signals", async () => {
    const dashboard = await getOwnerDashboardData();

    expect(dashboard.stats).toEqual(
      expect.objectContaining({
        declaredPaidExternalRentPayments: 1,
        requestedReceipts: 4,
        overdueExternalRentPayments: 2,
        draftProperties: 1,
        draftContracts: 2,
      }),
    );
    expect(mocks.paymentFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          ownerProfileId: "owner_profile_1",
          provider: null,
          providerPaymentId: null,
          type: "RENT",
          status: {
            not: "SUCCEEDED",
          },
          declarations: {
            some: {
              declarationType: "PAID_EXTERNALLY",
            },
          },
        },
        select: expect.objectContaining({
          declarations: {
            orderBy: [
              {
                declaredAt: "desc",
              },
              {
                createdAt: "desc",
              },
            ],
            take: 1,
            select: {
              declarationType: true,
            },
          },
        }),
      }),
    );
    expect(mocks.receiptCount).toHaveBeenCalledWith({
      where: {
        ownerProfileId: "owner_profile_1",
        status: "REQUESTED",
      },
    });
    expect(mocks.propertyCount).toHaveBeenLastCalledWith({
      where: {
        ownerProfileId: "owner_profile_1",
        status: "DRAFT",
      },
    });
    expect(mocks.rentalContractCount).toHaveBeenLastCalledWith({
      where: {
        ownerProfileId: "owner_profile_1",
        status: "DRAFT",
      },
    });
    expect(mocks.invitationFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          ownerProfileId: "owner_profile_1",
        }),
      }),
    );
    expect(mocks.tenantRequestFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          ownerProfileId: "owner_profile_1",
          status: {
            in: ["RESOLVED_BY_OWNER", "REFUSED_BY_OWNER"],
          },
        }),
      }),
    );
    expect(mocks.propertyFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          imageUrl: true,
        }),
      }),
    );
  });

  it("does not count succeeded or canceled external rent payments as overdue actions", async () => {
    await getOwnerDashboardData();

    expect(mocks.paymentCount).toHaveBeenLastCalledWith({
      where: {
        ownerProfileId: "owner_profile_1",
        provider: null,
        providerPaymentId: null,
        type: "RENT",
        dueDate: {
          lt: new Date(2026, 4, 16),
        },
        status: {
          notIn: ["SUCCEEDED", "CANCELED", "REFUNDED"],
        },
      },
    });
  });

  it("includes resolved tenant requests in recent owner activity", async () => {
    mocks.tenantRequestFindMany.mockResolvedValue([
      {
        id: "tenant_request_resolved",
        title: "Chauffage repare",
        status: "RESOLVED_BY_OWNER",
        resolvedAt: new Date("2026-05-15T10:00:00.000Z"),
        refusedAt: null,
        updatedAt: new Date("2026-05-15T10:00:00.000Z"),
        property: {
          name: "Appartement Canal",
          city: "Paris",
        },
      },
    ]);

    const dashboard = await getOwnerDashboardData();

    expect(dashboard.recentActivity).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "tenant-request-tenant_request_resolved",
          title: "Demande locataire traitee",
          description: "Chauffage repare",
        }),
      ]),
    );
  });
});
