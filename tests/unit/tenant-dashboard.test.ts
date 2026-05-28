import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auditLogFindMany: vi.fn(),
  contractTenantCount: vi.fn(),
  contractTenantFindMany: vi.fn(),
  invitationCount: vi.fn(),
  invitationFindMany: vi.fn(),
  paymentAggregate: vi.fn(),
  paymentCount: vi.fn(),
  paymentFindMany: vi.fn(),
  paymentMandateCount: vi.fn(),
  receiptCount: vi.fn(),
  receiptFindMany: vi.fn(),
  requireTenantAccess: vi.fn(),
  tenantRequestFindMany: vi.fn(),
}));

vi.mock("@/server/auth/access", () => ({
  requireTenantAccess: mocks.requireTenantAccess,
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    contractTenant: {
      count: mocks.contractTenantCount,
      findMany: mocks.contractTenantFindMany,
    },
    invitation: {
      count: mocks.invitationCount,
      findMany: mocks.invitationFindMany,
    },
    payment: {
      aggregate: mocks.paymentAggregate,
      count: mocks.paymentCount,
      findMany: mocks.paymentFindMany,
    },
    paymentMandate: {
      count: mocks.paymentMandateCount,
    },
    auditLog: {
      findMany: mocks.auditLogFindMany,
    },
    receipt: {
      count: mocks.receiptCount,
      findMany: mocks.receiptFindMany,
    },
    tenantRequest: {
      findMany: mocks.tenantRequestFindMany,
    },
  },
}));

import { getTenantDashboardData } from "@/server/tenant/dashboard";

const latestDeclaration = {
  id: "payment_declaration_latest",
  declarationType: "NOT_PAID_YET",
  declaredAt: new Date("2026-05-11T10:00:00.000Z"),
};

function createRecentPayment() {
  return {
    id: "payment_1",
    rentalContractId: "contract_1",
    contractTenantId: "contract_tenant_1",
    tenantProfileId: "tenant_profile_1",
    provider: null,
    providerPaymentId: null,
    type: "RENT",
    status: "PLANNED",
    amountInCents: 107000,
    currency: "EUR",
    dueDate: new Date("2026-05-05T00:00:00.000Z"),
    paidAt: null,
    declarations: [latestDeclaration],
    contractTenant: {
      id: "contract_tenant_1",
      status: "ACTIVE",
      rentShareAmountInCents: 95000,
      chargesShareAmountInCents: 12000,
      paymentMandates: [],
    },
    property: {
      name: "Appartement Canal",
      imageUrl: "/uploads/properties/appartement-canal.jpg",
    },
  };
}

function createContractTenant(
  status: string,
  id = `contract_tenant_${status}`,
) {
  return {
    id,
    roomLabel: null,
    rentShareAmountInCents: 95000,
    chargesShareAmountInCents: 12000,
    depositShareAmountInCents: 95000,
    currency: "EUR",
    startDate: new Date("2026-01-01T00:00:00.000Z"),
    endDate:
      status === "TERMINATED" ? new Date("2026-05-01T00:00:00.000Z") : null,
    status,
    rentalContract: {
      contractType: "INDIVIDUAL",
      status: "ACTIVE",
      paymentDayOfMonth: 5,
      ownerProfile: {
        user: {
          firstName: "Arthur",
          lastName: "Martin",
          email: "owner@example.com",
        },
      },
      property: {
        name: "Appartement Canal",
        city: "Paris",
        imageUrl: "/uploads/properties/appartement-canal.jpg",
        propertyType: "APARTMENT",
        isColocation: false,
      },
    },
    paymentMandates: [],
  };
}

describe("tenant dashboard payment declarations", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-04T12:00:00.000Z"));
    vi.clearAllMocks();
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
    mocks.contractTenantCount.mockResolvedValue(0);
    mocks.paymentCount.mockResolvedValue(0);
    mocks.paymentAggregate.mockResolvedValue({
      _sum: {
        amountInCents: null,
      },
    });
    mocks.paymentMandateCount.mockResolvedValue(0);
    mocks.receiptCount.mockResolvedValue(0);
    mocks.invitationCount.mockResolvedValue(0);
    mocks.invitationFindMany.mockResolvedValue([]);
    mocks.contractTenantFindMany.mockResolvedValue([]);
    mocks.paymentFindMany.mockResolvedValue([createRecentPayment()]);
    mocks.receiptFindMany.mockResolvedValue([]);
    mocks.auditLogFindMany.mockResolvedValue([]);
    mocks.tenantRequestFindMany.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("loads only the latest declaration for the connected tenant regardless of type", async () => {
    const dashboard = await getTenantDashboardData();

    expect(dashboard.recentPayments).toEqual([
      expect.objectContaining({
        id: "payment_1",
        declarations: [latestDeclaration],
      }),
    ]);
    expect(mocks.paymentFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantProfileId: "tenant_profile_1",
        },
        select: expect.objectContaining({
          declarations: {
            where: {
              tenantProfileId: "tenant_profile_1",
            },
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
              id: true,
              declarationType: true,
              declaredAt: true,
            },
          },
        }),
      }),
    );
  });

  it("loads pending invitations for the connected email without selecting tokenHash", async () => {
    const invitation = {
      id: "invitation_1",
      tenantEmail: "tenant@example.com",
      tenantFirstName: "Alice",
      tenantLastName: "Martin",
      contractTenantId: "contract_tenant_2",
      expiresAt: new Date("2026-05-25T00:00:00.000Z"),
      createdAt: new Date("2026-05-10T00:00:00.000Z"),
      property: {
        name: "Appartement Canal",
        city: "Paris",
      },
      rentalContract: {
        id: "contract_2",
        contractType: "INDIVIDUAL",
        status: "DRAFT",
        startDate: new Date("2026-06-01T00:00:00.000Z"),
        endDate: null,
        totalRentAmountInCents: 95000,
        totalChargesAmountInCents: 12000,
        currency: "EUR",
        paymentDayOfMonth: 5,
      },
      ownerProfile: {
        user: {
          firstName: "Arthur",
          lastName: "Martin",
          email: "owner@example.com",
        },
      },
    };

    mocks.invitationCount.mockResolvedValue(1);
    mocks.invitationFindMany.mockResolvedValue([invitation]);

    const dashboard = await getTenantDashboardData();

    expect(dashboard.stats.pendingInvitations).toBe(1);
    expect(dashboard.receivedInvitations).toEqual([invitation]);
    expect(mocks.invitationCount).toHaveBeenCalledWith({
      where: {
        tenantEmail: "tenant@example.com",
        status: "SENT",
        expiresAt: {
          gte: expect.any(Date),
        },
      },
    });
    expect(mocks.invitationFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantEmail: "tenant@example.com",
          status: "SENT",
          expiresAt: {
            gte: expect.any(Date),
          },
        },
      }),
    );
    expect(
      mocks.invitationFindMany.mock.calls[0]?.[0].select,
    ).not.toHaveProperty("tokenHash");
    expect(
      mocks.invitationFindMany.mock.calls[0]?.[0].select.rentalContract.select,
    ).toEqual(
      expect.objectContaining({
        startDate: true,
        endDate: true,
        totalRentAmountInCents: true,
        totalChargesAmountInCents: true,
        currency: true,
        paymentDayOfMonth: true,
      }),
    );
  });

  it("separates current rentals from former terminated rentals", async () => {
    const activeRental = createContractTenant("ACTIVE", "active_rental");
    const terminationRequestedRental = createContractTenant(
      "TERMINATION_REQUESTED",
      "termination_requested_rental",
    );
    const formerRental = createContractTenant("TERMINATED", "former_rental");

    mocks.contractTenantFindMany.mockResolvedValue([
      activeRental,
      terminationRequestedRental,
      formerRental,
    ]);

    const dashboard = await getTenantDashboardData();

    expect(dashboard.currentRentals).toEqual([
      activeRental,
      terminationRequestedRental,
    ]);
    expect(dashboard.formerRentals).toEqual([formerRental]);
    expect(dashboard.currentRentals[0]?.rentalContract.property.imageUrl).toBe(
      "/uploads/properties/appartement-canal.jpg",
    );
    expect(
      mocks.contractTenantFindMany.mock.calls[0]?.[0].select.rentalContract
        .select.property.select,
    ).toEqual(
      expect.objectContaining({
        imageUrl: true,
      }),
    );
  });

  it("loads external payments to declare and excludes already paid declarations", async () => {
    const alreadyDeclaredPaid = {
      ...createRecentPayment(),
      id: "payment_declared_paid",
      declarations: [
        {
          id: "declaration_paid",
          declarationType: "PAID_EXTERNALLY",
          declaredAt: new Date("2026-05-11T10:00:00.000Z"),
        },
      ],
    };
    const stillDeclarable = {
      ...createRecentPayment(),
      id: "payment_not_paid_yet",
      declarations: [latestDeclaration],
    };

    mocks.paymentFindMany
      .mockReset()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([alreadyDeclaredPaid, stillDeclarable]);

    const dashboard = await getTenantDashboardData();

    expect(dashboard.externalPaymentsToDeclare).toEqual([stillDeclarable]);
    expect(mocks.paymentFindMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: expect.objectContaining({
          tenantProfileId: "tenant_profile_1",
          provider: null,
          providerPaymentId: null,
          type: "RENT",
          status: {
            in: ["PLANNED", "PENDING"],
          },
        }),
      }),
    );
  });

  it("loads external payments to declare one day before the due date, but not earlier", async () => {
    const dueTomorrow = {
      ...createRecentPayment(),
      id: "payment_due_tomorrow",
      dueDate: new Date("2026-05-05T00:00:00.000Z"),
      declarations: [],
    };
    const dueInTwoDays = {
      ...createRecentPayment(),
      id: "payment_due_in_two_days",
      dueDate: new Date("2026-05-06T00:00:00.000Z"),
      declarations: [],
    };

    mocks.paymentFindMany
      .mockReset()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([dueTomorrow, dueInTwoDays]);

    const dashboard = await getTenantDashboardData();

    expect(dashboard.externalPaymentsToDeclare).toEqual([dueTomorrow]);
    expect(mocks.paymentFindMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: expect.objectContaining({
          dueDate: {
            lte: new Date("2026-05-05T12:00:00.000Z"),
          },
        }),
      }),
    );
  });

  it("keeps seen available receipts in the receipt list but out of urgent receipt actions", async () => {
    const receipt = {
      id: "receipt_generated",
      type: "RENT_RECEIPT",
      status: "GENERATED",
      periodStart: new Date("2026-05-01T00:00:00.000Z"),
      periodEnd: new Date("2026-05-31T00:00:00.000Z"),
      totalAmountInCents: 107000,
      currency: "EUR",
      property: {
        name: "Appartement Canal",
      },
    };

    mocks.receiptFindMany
      .mockReset()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([receipt])
      .mockResolvedValueOnce([]);
    mocks.auditLogFindMany.mockResolvedValue([
      {
        entityId: "receipt_generated",
      },
    ]);

    const dashboard = await getTenantDashboardData();

    expect(dashboard.recentReceipts).toEqual([receipt]);
    expect(dashboard.unseenAvailableReceipts).toEqual([]);
    expect(mocks.auditLogFindMany).toHaveBeenCalledWith({
      where: {
        userId: "user_tenant",
        action: "receipt.seen_by_tenant",
        entityType: "Receipt",
        entityId: {
          in: ["receipt_generated"],
        },
      },
      select: {
        entityId: true,
      },
    });
  });
});
