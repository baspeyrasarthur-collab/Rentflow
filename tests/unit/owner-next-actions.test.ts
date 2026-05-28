import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  contractTenantFindMany: vi.fn(),
  getCurrentOwnerProfileForProperties: vi.fn(),
  paymentFindMany: vi.fn(),
  propertyFindMany: vi.fn(),
  receiptFindMany: vi.fn(),
  rentalContractFindMany: vi.fn(),
  tenantRequestFindMany: vi.fn(),
}));

vi.mock("@/server/owner/properties", () => ({
  getCurrentOwnerProfileForProperties:
    mocks.getCurrentOwnerProfileForProperties,
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    payment: {
      findMany: mocks.paymentFindMany,
    },
    contractTenant: {
      findMany: mocks.contractTenantFindMany,
    },
    property: {
      findMany: mocks.propertyFindMany,
    },
    receipt: {
      findMany: mocks.receiptFindMany,
    },
    rentalContract: {
      findMany: mocks.rentalContractFindMany,
    },
    tenantRequest: {
      findMany: mocks.tenantRequestFindMany,
    },
  },
}));

import { getOwnerNextActions } from "@/server/owner/next-actions";

function draftProperty(overrides: Record<string, unknown> = {}) {
  return {
    id: "property_draft",
    name: "Appartement Republique",
    addressLine1: "10 rue de Paris",
    postalCode: "75010",
    city: "Paris",
    country: "FR",
    propertyType: "APARTMENT",
    surfaceAreaSqm: 42,
    updatedAt: new Date("2026-05-01T10:00:00.000Z"),
    ...overrides,
  };
}

function draftContract(overrides: Record<string, unknown> = {}) {
  return {
    id: "contract_draft",
    propertyId: "property_1",
    contractType: "INDIVIDUAL",
    startDate: new Date("2026-05-01T00:00:00.000Z"),
    totalRentAmountInCents: 90000,
    totalChargesAmountInCents: 10000,
    depositAmountInCents: 90000,
    currency: "EUR",
    paymentDayOfMonth: 5,
    updatedAt: new Date("2026-05-02T10:00:00.000Z"),
    ...overrides,
  };
}

function setupEmptyNextActionQueries() {
  mocks.propertyFindMany.mockResolvedValue([]);
  mocks.rentalContractFindMany
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([]);
  mocks.contractTenantFindMany.mockResolvedValue([]);
  mocks.tenantRequestFindMany.mockResolvedValue([]);
  mocks.paymentFindMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
  mocks.receiptFindMany.mockResolvedValue([]);
}

describe("owner next actions", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-16T12:00:00.000Z"));
    vi.clearAllMocks();
    mocks.getCurrentOwnerProfileForProperties.mockResolvedValue({
      ownerProfile: {
        id: "owner_profile_1",
      },
      user: {
        id: "user_owner",
      },
    });
    setupEmptyNextActionQueries();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not return PROPERTY_INCOMPLETE when a draft property is already complete", async () => {
    mocks.propertyFindMany.mockResolvedValue([draftProperty()]);

    await expect(getOwnerNextActions()).resolves.toEqual([]);
  });

  it("returns PROPERTY_INCOMPLETE TODO when required property fields are missing", async () => {
    mocks.propertyFindMany.mockResolvedValue([
      draftProperty({
        addressLine1: "",
      }),
    ]);

    const actions = await getOwnerNextActions();

    expect(actions).toEqual([
      expect.objectContaining({
        id: "property-incomplete-property_draft",
        type: "PROPERTY_INCOMPLETE",
        href: "/owner/properties/property_draft/edit?focus=missing-fields",
        status: "TODO",
        priority: 40,
        tone: "warning",
        relatedEntityType: "Property",
        relatedEntityId: "property_draft",
      }),
    ]);
  });

  it("returns PROPERTY_INCOMPLETE PARTIAL when only secondary property data is missing", async () => {
    mocks.propertyFindMany.mockResolvedValue([
      draftProperty({
        surfaceAreaSqm: null,
      }),
    ]);

    const actions = await getOwnerNextActions();

    expect(actions).toEqual([
      expect.objectContaining({
        title: "Caracteristiques a verifier",
        href: "/owner/properties/property_draft/edit?focus=characteristics",
        status: "PARTIAL",
      }),
    ]);
  });

  it("does not return CONTRACT_DRAFT when a draft contract has all required MVP fields", async () => {
    mocks.rentalContractFindMany
      .mockReset()
      .mockResolvedValueOnce([draftContract()])
      .mockResolvedValueOnce([]);

    await expect(getOwnerNextActions()).resolves.toEqual([]);
  });

  it("returns CONTRACT_DRAFT for an incomplete draft contract with a precise href", async () => {
    mocks.rentalContractFindMany
      .mockReset()
      .mockResolvedValueOnce([
        draftContract({
          totalRentAmountInCents: 0,
        }),
      ])
      .mockResolvedValueOnce([]);

    const actions = await getOwnerNextActions();

    expect(actions).toEqual([
      expect.objectContaining({
        id: "contract-draft-contract_draft",
        type: "CONTRACT_DRAFT",
        href: "/owner/properties/property_1/contracts/contract_draft/edit?focus=required-fields",
        status: "PARTIAL",
        priority: 50,
        tone: "warning",
        relatedEntityType: "RentalContract",
        relatedEntityId: "contract_draft",
      }),
    ]);
  });

  it("returns TENANT_TO_INVITE for a contract without active tenant or active invitation", async () => {
    mocks.rentalContractFindMany
      .mockReset()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: "contract_without_tenant",
          propertyId: "property_1",
          invitations: [],
          updatedAt: new Date("2026-05-03T10:00:00.000Z"),
        },
      ]);

    const actions = await getOwnerNextActions();

    expect(actions).toEqual([
      expect.objectContaining({
        id: "tenant-to-invite-contract_without_tenant",
        type: "TENANT_TO_INVITE",
        href: "/owner/properties/property_1/contracts/contract_without_tenant/invitations/new",
        status: "TODO",
        priority: 60,
        tone: "info",
      }),
    ]);
    expect(mocks.rentalContractFindMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: {
          ownerProfileId: "owner_profile_1",
          status: {
            in: ["DRAFT"],
          },
          contractTenants: {
            none: {
              status: "ACTIVE",
            },
          },
        },
      }),
    );
  });

  it("returns a PARTIAL invitation action when an active invitation is already sent", async () => {
    mocks.rentalContractFindMany
      .mockReset()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: "contract_pending_invitation",
          propertyId: "property_1",
          invitations: [
            {
              id: "invitation_sent",
              createdAt: new Date("2026-05-03T10:00:00.000Z"),
            },
          ],
          updatedAt: new Date("2026-05-03T10:00:00.000Z"),
        },
      ]);

    const actions = await getOwnerNextActions();

    expect(actions).toEqual([
      expect.objectContaining({
        id: "tenant-invitation-pending-contract_pending_invitation",
        title: "Invitation en attente",
        status: "PARTIAL",
        href: "/owner/properties/property_1/contracts/contract_pending_invitation",
      }),
    ]);
  });

  it("returns CONTRACT_TERMINATION_REQUESTED for a tenant termination request", async () => {
    mocks.contractTenantFindMany.mockResolvedValue([
      {
        id: "contract_tenant_termination",
        updatedAt: new Date("2026-05-04T10:00:00.000Z"),
        rentalContract: {
          id: "contract_1",
          propertyId: "property_1",
        },
      },
    ]);

    const actions = await getOwnerNextActions();

    expect(actions).toEqual([
      expect.objectContaining({
        id: "contract-termination-requested-contract_tenant_termination",
        type: "CONTRACT_TERMINATION_REQUESTED",
        title: "Demande de fin de contrat",
        href: "/owner/properties/property_1/contracts/contract_1?focus=tenant-contract_tenant_termination",
        status: "TODO",
        priority: 95,
        tone: "warning",
        relatedEntityType: "ContractTenant",
        relatedEntityId: "contract_tenant_termination",
      }),
    ]);
    expect(mocks.contractTenantFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: "TERMINATION_REQUESTED",
          rentalContract: {
            ownerProfileId: "owner_profile_1",
          },
        },
      }),
    );
  });

  it("returns TENANT_REQUEST_OPEN for an open tenant request", async () => {
    mocks.tenantRequestFindMany.mockResolvedValue([
      {
        id: "tenant_request_1",
        title: "Robinet a reparer",
        createdAt: new Date("2026-05-04T09:00:00.000Z"),
      },
    ]);

    const actions = await getOwnerNextActions();

    expect(actions).toEqual([
      expect.objectContaining({
        id: "tenant-request-open-tenant_request_1",
        type: "TENANT_REQUEST_OPEN",
        title: "Nouvelle demande de votre locataire !",
        description: "Robinet a reparer",
        href: "/owner/tenants?focus=request-tenant_request_1",
        status: "TODO",
        priority: 110,
        tone: "warning",
        relatedEntityType: "TenantRequest",
        relatedEntityId: "tenant_request_1",
      }),
    ]);
    expect(mocks.tenantRequestFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          ownerProfileId: "owner_profile_1",
          status: "OPEN",
        },
      }),
    );
  });

  it("returns PAYMENT_DECLARED_PAID only when the latest declaration is PAID_EXTERNALLY", async () => {
    mocks.paymentFindMany
      .mockReset()
      .mockResolvedValueOnce([
        {
          id: "payment_declared_paid",
          propertyId: "property_1",
          rentalContractId: "contract_1",
          updatedAt: new Date("2026-05-05T10:00:00.000Z"),
          declarations: [
            {
              declarationType: "PAID_EXTERNALLY",
              declaredAt: new Date("2026-05-05T09:00:00.000Z"),
            },
          ],
        },
      ])
      .mockResolvedValueOnce([]);

    const actions = await getOwnerNextActions();

    expect(actions).toEqual([
      expect.objectContaining({
        id: "payment-declared-paid-payment_declared_paid",
        type: "PAYMENT_DECLARED_PAID",
        href: "/owner/properties/property_1/contracts/contract_1?focus=payment-payment_declared_paid",
        status: "PARTIAL",
        priority: 100,
        tone: "warning",
      }),
    ]);
  });

  it("does not return PAYMENT_DECLARED_PAID when the latest declaration is NOT_PAID_YET", async () => {
    mocks.paymentFindMany
      .mockReset()
      .mockResolvedValueOnce([
        {
          id: "payment_not_paid",
          propertyId: "property_1",
          rentalContractId: "contract_1",
          updatedAt: new Date("2026-05-05T10:00:00.000Z"),
          declarations: [
            {
              declarationType: "NOT_PAID_YET",
              declaredAt: new Date("2026-05-06T09:00:00.000Z"),
            },
          ],
        },
      ])
      .mockResolvedValueOnce([]);

    await expect(getOwnerNextActions()).resolves.toEqual([]);
  });

  it("does not return PAYMENT_DECLARED_PAID for succeeded payments", async () => {
    await getOwnerNextActions();

    expect(mocks.paymentFindMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.objectContaining({
          status: {
            notIn: ["SUCCEEDED", "CANCELED", "REFUNDED"],
          },
        }),
      }),
    );
  });

  it("returns PAYMENT_OVERDUE for overdue external rent payments not received", async () => {
    mocks.paymentFindMany
      .mockReset()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: "payment_overdue",
          dueDate: new Date("2026-05-05T00:00:00.000Z"),
          declarations: [],
        },
      ]);

    const actions = await getOwnerNextActions();

    expect(actions).toEqual([
      expect.objectContaining({
        id: "payment-overdue-payment_overdue",
        type: "PAYMENT_OVERDUE",
        href: "/owner/payments?focus=payment-payment_overdue",
        status: "TODO",
        priority: 80,
        tone: "danger",
      }),
    ]);
  });

  it("does not duplicate PAYMENT_OVERDUE when the latest declaration is PAID_EXTERNALLY", async () => {
    mocks.paymentFindMany
      .mockReset()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: "payment_overdue_declared_paid",
          dueDate: new Date("2026-05-05T00:00:00.000Z"),
          declarations: [
            {
              declarationType: "PAID_EXTERNALLY",
            },
          ],
        },
      ]);

    await expect(getOwnerNextActions()).resolves.toEqual([]);
  });

  it("does not query PAYMENT_OVERDUE for SUCCEEDED or CANCELED payments", async () => {
    await getOwnerNextActions();

    expect(mocks.paymentFindMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: {
            in: ["PLANNED", "PENDING", "PROCESSING", "FAILED", "DISPUTED"],
          },
        }),
      }),
    );
  });

  it("returns RECEIPT_REQUESTED for requested receipts", async () => {
    mocks.receiptFindMany.mockResolvedValue([
      {
        id: "receipt_requested",
        propertyId: "property_1",
        rentalContractId: "contract_1",
        requestedAt: new Date("2026-05-04T10:00:00.000Z"),
      },
    ]);

    const actions = await getOwnerNextActions();

    expect(actions).toEqual([
      expect.objectContaining({
        id: "receipt-requested-receipt_requested",
        type: "RECEIPT_REQUESTED",
        href: "/owner/properties/property_1/contracts/contract_1?focus=receipt-receipt_requested",
        status: "TODO",
        priority: 90,
        tone: "info",
      }),
    ]);
  });

  it("queries only REQUESTED receipts, not generated receipts", async () => {
    await getOwnerNextActions();

    expect(mocks.receiptFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          ownerProfileId: "owner_profile_1",
          status: "REQUESTED",
        },
      }),
    );
  });

  it("filters all next action queries by the connected owner profile", async () => {
    await getOwnerNextActions();

    expect(mocks.propertyFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          ownerProfileId: "owner_profile_1",
        }),
      }),
    );
    expect(mocks.rentalContractFindMany).toHaveBeenCalledTimes(2);
    for (const call of mocks.rentalContractFindMany.mock.calls) {
      expect(call[0].where).toEqual(
        expect.objectContaining({
          ownerProfileId: "owner_profile_1",
        }),
      );
    }
    expect(mocks.paymentFindMany).toHaveBeenCalledTimes(2);
    for (const call of mocks.paymentFindMany.mock.calls) {
      expect(call[0].where).toEqual(
        expect.objectContaining({
          ownerProfileId: "owner_profile_1",
        }),
      );
    }
    expect(mocks.contractTenantFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: "TERMINATION_REQUESTED",
          rentalContract: {
            ownerProfileId: "owner_profile_1",
          },
        },
      }),
    );
    expect(mocks.tenantRequestFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          ownerProfileId: "owner_profile_1",
          status: "OPEN",
        },
      }),
    );
    expect(mocks.receiptFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          ownerProfileId: "owner_profile_1",
        }),
      }),
    );
  });

  it("sorts actions by descending priority", async () => {
    mocks.propertyFindMany.mockResolvedValue([
      draftProperty({
        addressLine1: "",
      }),
    ]);
    mocks.rentalContractFindMany
      .mockReset()
      .mockResolvedValueOnce([
        draftContract({
          totalRentAmountInCents: 0,
        }),
      ])
      .mockResolvedValueOnce([
        {
          id: "contract_without_tenant",
          propertyId: "property_1",
          invitations: [],
          updatedAt: new Date("2026-05-03T10:00:00.000Z"),
        },
      ]);
    mocks.paymentFindMany
      .mockReset()
      .mockResolvedValueOnce([
        {
          id: "payment_declared_paid",
          propertyId: "property_1",
          rentalContractId: "contract_1",
          updatedAt: new Date("2026-05-05T10:00:00.000Z"),
          declarations: [
            {
              declarationType: "PAID_EXTERNALLY",
              declaredAt: new Date("2026-05-05T09:00:00.000Z"),
            },
          ],
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "payment_overdue",
          dueDate: new Date("2026-05-05T00:00:00.000Z"),
          declarations: [],
        },
      ]);
    mocks.receiptFindMany.mockResolvedValue([
      {
        id: "receipt_requested",
        propertyId: "property_1",
        rentalContractId: "contract_1",
        requestedAt: new Date("2026-05-04T10:00:00.000Z"),
      },
    ]);

    const actions = await getOwnerNextActions();

    expect(actions.map((action) => action.type)).toEqual([
      "PAYMENT_DECLARED_PAID",
      "RECEIPT_REQUESTED",
      "PAYMENT_OVERDUE",
      "TENANT_TO_INVITE",
      "CONTRACT_DRAFT",
      "PROPERTY_INCOMPLETE",
    ]);
  });
});
