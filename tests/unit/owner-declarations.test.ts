import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  expenseFindMany: vi.fn(),
  getCurrentOwnerProfileForProperties: vi.fn(),
  paymentFindMany: vi.fn(),
  propertyFindMany: vi.fn(),
}));

vi.mock("@/server/owner/properties", () => ({
  getCurrentOwnerProfileForProperties:
    mocks.getCurrentOwnerProfileForProperties,
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    expense: {
      findMany: mocks.expenseFindMany,
    },
    payment: {
      findMany: mocks.paymentFindMany,
    },
    property: {
      findMany: mocks.propertyFindMany,
    },
  },
}));

import {
  buildOwnerDeclarationsOverview,
  getOwnerDeclarationsOverview,
  parseOwnerDeclarationsYearParam,
} from "@/server/owner/declarations";

describe("owner declarations overview", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-17T12:00:00.000Z"));
    vi.clearAllMocks();
    mocks.getCurrentOwnerProfileForProperties.mockResolvedValue({
      ownerProfile: {
        id: "owner_profile_1",
      },
      user: {
        id: "user_1",
      },
    });
  });

  it("falls back to the previous year when the year is invalid", () => {
    const now = new Date(2026, 4, 17);

    expect(parseOwnerDeclarationsYearParam("2025", now)).toBe(2025);
    expect(parseOwnerDeclarationsYearParam("invalid", now)).toBe(2025);
    expect(parseOwnerDeclarationsYearParam("1999", now)).toBe(2025);
  });

  it("prepares income only from confirmed rent payments paid in the selected year", () => {
    const overview = buildOwnerDeclarationsOverview({
      now: new Date(2026, 4, 17),
      year: 2025,
      properties: [
        {
          id: "property_1",
          name: "Appartement Canal",
          city: "Paris",
          furnished: true,
          status: "ACTIVE",
        },
        {
          id: "property_2",
          name: "Maison Ouest",
          city: "Nantes",
          furnished: false,
          status: "ACTIVE",
        },
      ],
      payments: [
        {
          id: "payment_included",
          propertyId: "property_1",
          status: "SUCCEEDED",
          amountInCents: 120000,
          dueDate: new Date(2025, 2, 5),
          paidAt: new Date(2025, 2, 6),
        },
        {
          id: "payment_due_but_unpaid",
          propertyId: "property_1",
          status: "PENDING",
          amountInCents: 90000,
          dueDate: new Date(2025, 3, 5),
          paidAt: null,
        },
        {
          id: "payment_wrong_year",
          propertyId: "property_2",
          status: "SUCCEEDED",
          amountInCents: 110000,
          dueDate: new Date(2024, 11, 5),
          paidAt: new Date(2024, 11, 8),
        },
        {
          id: "payment_not_rent_query_excludes_before_builder",
          propertyId: "property_2",
          status: "FAILED",
          amountInCents: 100000,
          dueDate: new Date(2025, 4, 5),
          paidAt: null,
        },
      ],
      expenses: [],
    });

    expect(overview.summary.preparedRentalIncomeInCents).toBe(120000);
    expect(overview.summary.paymentsIncludedCount).toBe(1);
    expect(overview.summary.paymentsNotConfirmedCount).toBe(2);
    expect(overview.summary.propertiesWithIncome).toBe(1);
    expect(overview.propertyBreakdown).toEqual([
      expect.objectContaining({
        propertyId: "property_1",
        incomeInCents: 120000,
        paymentsIncludedCount: 1,
        fiscalStatusMessage: "Meuble dans RentFlow - fiscalite a confirmer",
      }),
      expect.objectContaining({
        propertyId: "property_2",
        incomeInCents: 0,
        paymentsIncludedCount: 0,
        fiscalStatusMessage: "Non meuble dans RentFlow - fiscalite a confirmer",
      }),
    ]);
  });

  it("adds non-canceled expenses separately without deducting them from prepared income", () => {
    const overview = buildOwnerDeclarationsOverview({
      now: new Date(2026, 4, 17),
      year: 2025,
      properties: [
        {
          id: "property_1",
          name: "Appartement Canal",
          city: "Paris",
          furnished: false,
          status: "ACTIVE",
        },
      ],
      payments: [
        {
          id: "payment_included",
          propertyId: "property_1",
          status: "SUCCEEDED",
          amountInCents: 120000,
          dueDate: new Date(2025, 2, 5),
          paidAt: new Date(2025, 2, 6),
        },
      ],
      expenses: [
        {
          id: "expense_property_tax",
          propertyId: "property_1",
          status: "PAID",
          category: "PROPERTY_TAX",
          amountInCents: 80000,
          dueDate: new Date(2025, 9, 15),
        },
        {
          id: "expense_canceled",
          propertyId: "property_1",
          status: "CANCELED",
          category: "WORKS",
          amountInCents: 999999,
          dueDate: new Date(2025, 5, 10),
        },
      ],
    });

    expect(overview.summary.preparedRentalIncomeInCents).toBe(120000);
    expect(overview.summary.expensesToReviewInCents).toBe(80000);
    expect(overview.expenseCategories).toEqual([
      {
        category: "PROPERTY_TAX",
        label: "Taxe fonciere",
        amountInCents: 80000,
      },
    ]);
    expect(overview.propertyBreakdown[0]).toMatchObject({
      expensesInCents: 80000,
    });
  });

  it("loads declaration data with owner-scoped filters only", async () => {
    mocks.propertyFindMany.mockResolvedValue([]);
    mocks.paymentFindMany.mockResolvedValue([]);
    mocks.expenseFindMany.mockResolvedValue([]);

    const overview = await getOwnerDeclarationsOverview(2025);

    expect(overview.summary).toMatchObject({
      preparedRentalIncomeInCents: 0,
      expensesToReviewInCents: 0,
      propertiesCount: 0,
    });
    expect(
      overview.personalInfoMissingFields.map((field) => field.label),
    ).toEqual(["Residence fiscale"]);
    expect(mocks.propertyFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          ownerProfileId: "owner_profile_1",
        },
      }),
    );
    expect(mocks.paymentFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          ownerProfileId: "owner_profile_1",
          type: "RENT",
        }),
      }),
    );
    expect(mocks.expenseFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          property: {
            ownerProfileId: "owner_profile_1",
          },
          status: {
            not: "CANCELED",
          },
        }),
      }),
    );
  });

  it("does not report personal missing data when important fields are present", async () => {
    mocks.getCurrentOwnerProfileForProperties.mockResolvedValue({
      ownerProfile: {
        id: "owner_profile_1",
      },
      user: {
        id: "user_1",
        firstName: "Arthur",
        lastName: "Martin",
        addressLine1: "12 rue des Lilas",
        postalCode: "75010",
        city: "Paris",
        country: "France",
        taxResidenceCountry: "France",
      },
    });
    mocks.propertyFindMany.mockResolvedValue([]);
    mocks.paymentFindMany.mockResolvedValue([]);
    mocks.expenseFindMany.mockResolvedValue([]);

    const overview = await getOwnerDeclarationsOverview(2025);

    expect(overview.personalInfoMissingFields).toEqual([]);
  });

  it("does not report address, postal code, city or phone as fiscal personal gaps", async () => {
    mocks.getCurrentOwnerProfileForProperties.mockResolvedValue({
      ownerProfile: {
        id: "owner_profile_1",
      },
      user: {
        id: "user_1",
        addressLine1: null,
        city: null,
        phone: null,
        postalCode: null,
        taxResidenceCountry: "France",
      },
    });
    mocks.propertyFindMany.mockResolvedValue([]);
    mocks.paymentFindMany.mockResolvedValue([]);
    mocks.expenseFindMany.mockResolvedValue([]);

    const overview = await getOwnerDeclarationsOverview(2025);

    expect(overview.personalInfoMissingFields).toEqual([]);
  });
});
