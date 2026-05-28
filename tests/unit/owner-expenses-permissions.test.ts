import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppError } from "@/server/errors";
import {
  buildOwnerExpenseCreateData,
  buildOwnerExpenseCancelData,
  buildOwnerExpenseUpdateData,
  getOwnerExpenseAndPropertyForUpdate,
  getOwnerExpenseForCancellation,
  getOwnerExpenseForEdition,
  getOwnerPropertyForExpenseCreation,
  listOwnerPropertiesForExpenseCreation,
} from "@/server/owner/expenses";

const mocks = vi.hoisted(() => ({
  ownerProfileFindUnique: vi.fn(),
  expenseFindFirst: vi.fn(),
  propertyFindFirst: vi.fn(),
  propertyFindMany: vi.fn(),
  requireOwnerAccess: vi.fn(),
  requireRole: vi.fn(),
}));

vi.mock("@/server/auth/access", () => ({
  requireOwnerAccess: mocks.requireOwnerAccess,
}));

vi.mock("@/server/auth/current-user", () => ({
  requireRole: mocks.requireRole,
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    ownerProfile: {
      findUnique: mocks.ownerProfileFindUnique,
    },
    property: {
      findFirst: mocks.propertyFindFirst,
      findMany: mocks.propertyFindMany,
    },
    expense: {
      findFirst: mocks.expenseFindFirst,
    },
  },
}));

describe("owner expense permissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireRole.mockResolvedValue({
      id: "user_owner",
      role: "OWNER",
    });
    mocks.ownerProfileFindUnique.mockResolvedValue({
      id: "owner_profile_1",
      userId: "user_owner",
    });
    mocks.requireOwnerAccess.mockResolvedValue({
      user: {
        id: "user_owner",
        role: "TENANT",
      },
      ownerProfile: {
        id: "owner_profile_1",
        userId: "user_owner",
      },
    });
  });

  it("lists only properties owned by the connected owner", async () => {
    mocks.propertyFindMany.mockResolvedValue([]);

    await expect(listOwnerPropertiesForExpenseCreation()).resolves.toEqual([]);

    expect(mocks.requireOwnerAccess).toHaveBeenCalledTimes(1);
    expect(mocks.propertyFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          ownerProfileId: "owner_profile_1",
        },
      }),
    );
  });

  it("loads an owned property before expense creation", async () => {
    mocks.propertyFindFirst.mockResolvedValue({
      id: "property_1",
      ownerProfileId: "owner_profile_1",
      name: "Appartement Canal",
      city: "Nantes",
    });

    await expect(
      getOwnerPropertyForExpenseCreation("property_1"),
    ).resolves.toMatchObject({
      user: {
        id: "user_owner",
      },
      ownerProfile: {
        id: "owner_profile_1",
      },
      property: {
        id: "property_1",
      },
    });

    expect(mocks.propertyFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "property_1",
          ownerProfileId: "owner_profile_1",
        },
      }),
    );
  });

  it("rejects a property that does not belong to the connected owner", async () => {
    mocks.propertyFindFirst.mockResolvedValue(null);

    await expect(
      getOwnerPropertyForExpenseCreation("property_other"),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("builds expense creation data with server-owned fields", () => {
    const data = buildOwnerExpenseCreateData(
      {
        propertyId: "property_from_form",
        label: "Travaux",
        amountInCents: 25000,
        dueDate: new Date("2026-05-20"),
        status: "PENDING",
        category: "WORKS",
      },
      "property_verified_server",
      "user_owner",
    );

    expect(data).toEqual({
      propertyId: "property_verified_server",
      createdByUserId: "user_owner",
      label: "Travaux",
      amountInCents: 25000,
      currency: "EUR",
      dueDate: new Date("2026-05-20"),
      status: "PENDING",
      category: "WORKS",
    });
  });

  it("builds default labels when expense labels are missing or blank", () => {
    expect(
      buildOwnerExpenseCreateData(
        {
          propertyId: "property_from_form",
          amountInCents: 25000,
          dueDate: new Date("2026-05-20"),
          status: "PENDING",
          category: "INSURANCE",
        },
        "property_verified_server",
        "user_owner",
      ).label,
    ).toBe("Depense - Assurance");

    expect(
      buildOwnerExpenseUpdateData(
        {
          expenseId: "expense_from_form",
          propertyId: "property_from_form",
          label: "   ",
          amountInCents: 4300,
          dueDate: new Date("2026-05-21"),
          status: "PAID",
          category: "OTHER",
        },
        "property_verified_server",
      ).label,
    ).toBe("Depense enregistree");
  });

  it("loads an owned expense before edition", async () => {
    mocks.expenseFindFirst.mockResolvedValue({
      id: "expense_1",
      propertyId: "property_1",
      label: "Assurance",
      amountInCents: 4200,
      currency: "EUR",
      dueDate: new Date("2026-05-12"),
      status: "PENDING",
      category: "INSURANCE",
      property: {
        id: "property_1",
        ownerProfileId: "owner_profile_1",
        name: "Appartement Canal",
        city: "Nantes",
      },
    });

    await expect(getOwnerExpenseForEdition("expense_1")).resolves.toMatchObject(
      {
        user: {
          id: "user_owner",
        },
        ownerProfile: {
          id: "owner_profile_1",
        },
        expense: {
          id: "expense_1",
          propertyId: "property_1",
        },
      },
    );

    expect(mocks.expenseFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "expense_1",
          property: {
            ownerProfileId: "owner_profile_1",
          },
        },
      }),
    );
  });

  it("rejects edition for an expense outside the connected owner scope", async () => {
    mocks.expenseFindFirst.mockResolvedValue(null);

    await expect(
      getOwnerExpenseForEdition("expense_other"),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("loads an owned expense and owned target property before update", async () => {
    mocks.expenseFindFirst.mockResolvedValue({
      id: "expense_1",
      propertyId: "property_1",
      label: "Assurance",
      amountInCents: 4200,
      currency: "EUR",
      dueDate: new Date("2026-05-12"),
      status: "PENDING",
      category: "INSURANCE",
      property: {
        id: "property_1",
        ownerProfileId: "owner_profile_1",
        name: "Appartement Canal",
        city: "Nantes",
      },
    });
    mocks.propertyFindFirst.mockResolvedValue({
      id: "property_2",
      ownerProfileId: "owner_profile_1",
      name: "Maison Loire",
      city: "Tours",
    });

    await expect(
      getOwnerExpenseAndPropertyForUpdate("expense_1", "property_2"),
    ).resolves.toMatchObject({
      user: {
        id: "user_owner",
      },
      ownerProfile: {
        id: "owner_profile_1",
      },
      expense: {
        id: "expense_1",
      },
      property: {
        id: "property_2",
      },
    });

    expect(mocks.requireOwnerAccess).toHaveBeenCalledTimes(1);
    expect(mocks.expenseFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "expense_1",
          property: {
            ownerProfileId: "owner_profile_1",
          },
        },
      }),
    );
    expect(mocks.propertyFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "property_2",
          ownerProfileId: "owner_profile_1",
        },
      }),
    );
  });

  it("rejects update for a canceled expense", async () => {
    mocks.expenseFindFirst.mockResolvedValue({
      id: "expense_canceled",
      propertyId: "property_1",
      label: "Assurance",
      amountInCents: 4200,
      currency: "EUR",
      dueDate: new Date("2026-05-12"),
      status: "CANCELED",
      category: "INSURANCE",
      property: {
        id: "property_1",
        ownerProfileId: "owner_profile_1",
        name: "Appartement Canal",
        city: "Nantes",
      },
    });
    mocks.propertyFindFirst.mockResolvedValue({
      id: "property_1",
      ownerProfileId: "owner_profile_1",
      name: "Appartement Canal",
      city: "Nantes",
    });

    await expect(
      getOwnerExpenseAndPropertyForUpdate("expense_canceled", "property_1"),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("rejects moving an expense to a property outside the connected owner scope", async () => {
    mocks.expenseFindFirst.mockResolvedValue({
      id: "expense_1",
      propertyId: "property_1",
      label: "Assurance",
      amountInCents: 4200,
      currency: "EUR",
      dueDate: new Date("2026-05-12"),
      status: "PENDING",
      category: "INSURANCE",
      property: {
        id: "property_1",
        ownerProfileId: "owner_profile_1",
        name: "Appartement Canal",
        city: "Nantes",
      },
    });
    mocks.propertyFindFirst.mockResolvedValue(null);

    await expect(
      getOwnerExpenseAndPropertyForUpdate("expense_1", "property_other"),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("loads an owned expense before cancellation", async () => {
    mocks.expenseFindFirst.mockResolvedValue({
      id: "expense_1",
      propertyId: "property_1",
      label: "Assurance",
      amountInCents: 4200,
      currency: "EUR",
      dueDate: new Date("2026-05-12"),
      status: "PENDING",
      category: "INSURANCE",
      property: {
        id: "property_1",
        ownerProfileId: "owner_profile_1",
        name: "Appartement Canal",
        city: "Nantes",
      },
    });

    await expect(
      getOwnerExpenseForCancellation("expense_1"),
    ).resolves.toMatchObject({
      expense: {
        id: "expense_1",
      },
    });
  });

  it("rejects cancellation for an expense outside the connected owner scope", async () => {
    mocks.expenseFindFirst.mockResolvedValue(null);

    await expect(
      getOwnerExpenseForCancellation("expense_other"),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("builds expense update data without server-owned fields", () => {
    const data = buildOwnerExpenseUpdateData(
      {
        expenseId: "expense_from_form",
        propertyId: "property_from_form",
        label: "Assurance mise a jour",
        amountInCents: 4300,
        dueDate: new Date("2026-05-21"),
        status: "PAID",
        category: "INSURANCE",
      },
      "property_verified_server",
    );

    expect(data).toEqual({
      propertyId: "property_verified_server",
      label: "Assurance mise a jour",
      amountInCents: 4300,
      dueDate: new Date("2026-05-21"),
      status: "PAID",
      category: "INSURANCE",
    });
  });

  it("builds expense cancellation data", () => {
    expect(buildOwnerExpenseCancelData()).toEqual({
      status: "CANCELED",
    });
  });
});
