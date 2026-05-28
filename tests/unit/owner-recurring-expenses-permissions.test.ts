import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppError } from "@/server/errors";
import {
  buildOwnerRecurringExpenseRuleCreateData,
  buildOwnerRecurringExpenseRuleDisableData,
  buildRecurringExpenseOccurrenceDueDate,
  generateOwnerRecurringExpensesForMonth,
  getOwnerPropertyForRecurringExpenseRuleCreation,
  getOwnerRecurringExpenseRuleForDisable,
  listOwnerRecurringExpenseRules,
  listOwnerPropertiesForRecurringExpenseRuleCreation,
} from "@/server/owner/recurring-expenses";

const mocks = vi.hoisted(() => ({
  auditLogCreate: vi.fn(),
  expenseCreateMany: vi.fn(),
  expenseFindMany: vi.fn(),
  ownerProfileFindUnique: vi.fn(),
  propertyFindFirst: vi.fn(),
  propertyFindMany: vi.fn(),
  recurringExpenseRuleFindFirst: vi.fn(),
  recurringExpenseRuleFindMany: vi.fn(),
  requireOwnerAccess: vi.fn(),
  requireRole: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/server/auth/access", () => ({
  requireOwnerAccess: mocks.requireOwnerAccess,
}));

vi.mock("@/server/auth/current-user", () => ({
  requireRole: mocks.requireRole,
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
    auditLog: {
      create: mocks.auditLogCreate,
    },
    expense: {
      createMany: mocks.expenseCreateMany,
      findMany: mocks.expenseFindMany,
    },
    ownerProfile: {
      findUnique: mocks.ownerProfileFindUnique,
    },
    property: {
      findFirst: mocks.propertyFindFirst,
      findMany: mocks.propertyFindMany,
    },
    recurringExpenseRule: {
      findFirst: mocks.recurringExpenseRuleFindFirst,
      findMany: mocks.recurringExpenseRuleFindMany,
    },
  },
}));

describe("owner recurring expense rule permissions", () => {
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
    mocks.expenseCreateMany.mockResolvedValue({
      count: 0,
    });
    mocks.expenseFindMany.mockResolvedValue([]);
    mocks.recurringExpenseRuleFindMany.mockResolvedValue([]);
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        auditLog: {
          create: mocks.auditLogCreate,
        },
        expense: {
          createMany: mocks.expenseCreateMany,
          findMany: mocks.expenseFindMany,
        },
        recurringExpenseRule: {
          findMany: mocks.recurringExpenseRuleFindMany,
        },
      }),
    );
  });

  it("calculates occurrence due dates with the last day fallback", () => {
    expect(
      buildRecurringExpenseOccurrenceDueDate(new Date(2026, 4, 1), 15),
    ).toEqual(new Date(2026, 4, 15));
    expect(
      buildRecurringExpenseOccurrenceDueDate(new Date(2026, 1, 1), 31),
    ).toEqual(new Date(2026, 1, 28));
    expect(
      buildRecurringExpenseOccurrenceDueDate(new Date(2028, 1, 1), 31),
    ).toEqual(new Date(2028, 1, 29));
    expect(
      buildRecurringExpenseOccurrenceDueDate(new Date(2026, 3, 1), 31),
    ).toEqual(new Date(2026, 3, 30));
  });

  it("lists only properties owned by the connected owner", async () => {
    mocks.propertyFindMany.mockResolvedValue([]);

    await expect(
      listOwnerPropertiesForRecurringExpenseRuleCreation(),
    ).resolves.toEqual([]);

    expect(mocks.requireOwnerAccess).toHaveBeenCalledTimes(1);
    expect(mocks.propertyFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          ownerProfileId: "owner_profile_1",
        },
      }),
    );
  });

  it("lists recurring expense rules through properties owned by the connected owner", async () => {
    mocks.recurringExpenseRuleFindMany.mockResolvedValue([
      {
        id: "rule_1",
        propertyId: "property_1",
        label: "Assurance PNO",
        amountInCents: 4275,
        currency: "EUR",
        category: "INSURANCE",
        dayOfMonth: 15,
        startMonth: new Date("2026-05-01"),
        endMonth: null,
        status: "ACTIVE",
        createdAt: new Date("2026-05-10"),
        updatedAt: new Date("2026-05-10"),
        property: {
          name: "Appartement Canal",
          city: "Nantes",
        },
      },
    ]);

    await expect(listOwnerRecurringExpenseRules()).resolves.toEqual([
      expect.objectContaining({
        id: "rule_1",
        propertyId: "property_1",
      }),
    ]);

    expect(mocks.requireOwnerAccess).toHaveBeenCalledTimes(1);
    expect(mocks.recurringExpenseRuleFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          property: {
            ownerProfileId: "owner_profile_1",
          },
        },
      }),
    );
  });

  it("generates planned expenses only from active eligible owner rules", async () => {
    mocks.recurringExpenseRuleFindMany.mockResolvedValue([
      {
        id: "rule_1",
        propertyId: "property_1",
        createdByUserId: "user_rule_creator",
        label: "Assurance PNO",
        amountInCents: 4275,
        currency: "EUR",
        category: "INSURANCE",
        dayOfMonth: 31,
      },
    ]);
    mocks.expenseCreateMany.mockResolvedValue({
      count: 1,
    });

    await expect(
      generateOwnerRecurringExpensesForMonth(new Date(2026, 1, 1)),
    ).resolves.toEqual({
      createdCount: 1,
      skippedCount: 0,
      totalEligibleRules: 1,
      month: new Date(2026, 1, 1),
    });

    expect(mocks.recurringExpenseRuleFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: "ACTIVE",
          startMonth: {
            lte: new Date(2026, 1, 1),
          },
          OR: [
            {
              endMonth: null,
            },
            {
              endMonth: {
                gte: new Date(2026, 1, 1),
              },
            },
          ],
          property: {
            ownerProfileId: "owner_profile_1",
          },
        },
      }),
    );
    expect(mocks.expenseCreateMany).toHaveBeenCalledWith({
      data: [
        {
          propertyId: "property_1",
          recurringRuleId: "rule_1",
          occurrenceMonth: new Date(2026, 1, 1),
          createdByUserId: "user_owner",
          label: "Assurance PNO",
          amountInCents: 4275,
          currency: "EUR",
          category: "INSURANCE",
          dueDate: new Date(2026, 1, 28),
          status: "PLANNED",
        },
      ],
      skipDuplicates: true,
    });
    expect(mocks.auditLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "recurring_expense_occurrences.generated",
          entityType: "RecurringExpenseRule",
          entityId: null,
          userId: "user_owner",
          metadata: expect.objectContaining({
            source: "owner_generate_recurring_expense_occurrences",
            createdCount: 1,
            skippedCount: 0,
            totalEligibleRules: 1,
          }),
        }),
      }),
    );
  });

  it("skips existing recurring expense occurrences when generation is retried", async () => {
    mocks.recurringExpenseRuleFindMany.mockResolvedValue([
      {
        id: "rule_existing",
        propertyId: "property_1",
        createdByUserId: "user_owner",
        label: "Assurance PNO",
        amountInCents: 4275,
        currency: "EUR",
        category: "INSURANCE",
        dayOfMonth: 15,
      },
      {
        id: "rule_new",
        propertyId: "property_1",
        createdByUserId: "user_owner",
        label: "Charges",
        amountInCents: 9000,
        currency: "EUR",
        category: "CONDO_FEES",
        dayOfMonth: 20,
      },
    ]);
    mocks.expenseFindMany.mockResolvedValue([
      {
        recurringRuleId: "rule_existing",
      },
    ]);
    mocks.expenseCreateMany.mockResolvedValue({
      count: 1,
    });

    await expect(
      generateOwnerRecurringExpensesForMonth(new Date(2026, 4, 1)),
    ).resolves.toMatchObject({
      createdCount: 1,
      skippedCount: 1,
      totalEligibleRules: 2,
    });

    expect(mocks.expenseFindMany).toHaveBeenCalledWith({
      where: {
        recurringRuleId: {
          in: ["rule_existing", "rule_new"],
        },
        occurrenceMonth: new Date(2026, 4, 1),
      },
      select: {
        recurringRuleId: true,
      },
    });
    expect(mocks.expenseCreateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [
          expect.objectContaining({
            recurringRuleId: "rule_new",
          }),
        ],
        skipDuplicates: true,
      }),
    );
  });

  it("loads an owned property before recurring expense rule creation", async () => {
    mocks.propertyFindFirst.mockResolvedValue({
      id: "property_1",
      ownerProfileId: "owner_profile_1",
      name: "Appartement Canal",
      city: "Nantes",
    });

    await expect(
      getOwnerPropertyForRecurringExpenseRuleCreation("property_1"),
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
      getOwnerPropertyForRecurringExpenseRuleCreation("property_other"),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("loads an owned recurring expense rule before disable", async () => {
    mocks.recurringExpenseRuleFindFirst.mockResolvedValue({
      id: "rule_1",
      propertyId: "property_1",
      status: "ACTIVE",
      property: {
        id: "property_1",
        ownerProfileId: "owner_profile_1",
        name: "Appartement Canal",
        city: "Nantes",
      },
    });

    await expect(
      getOwnerRecurringExpenseRuleForDisable("rule_1"),
    ).resolves.toMatchObject({
      user: {
        id: "user_owner",
      },
      ownerProfile: {
        id: "owner_profile_1",
      },
      rule: {
        id: "rule_1",
        propertyId: "property_1",
      },
    });

    expect(mocks.recurringExpenseRuleFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "rule_1",
          property: {
            ownerProfileId: "owner_profile_1",
          },
        },
      }),
    );
  });

  it("rejects disable for a recurring expense rule outside the connected owner scope", async () => {
    mocks.recurringExpenseRuleFindFirst.mockResolvedValue(null);

    await expect(
      getOwnerRecurringExpenseRuleForDisable("rule_other"),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("builds recurring expense rule creation data with server-owned fields", () => {
    const data = buildOwnerRecurringExpenseRuleCreateData(
      {
        propertyId: "property_from_form",
        label: "Assurance PNO",
        amountInCents: 4275,
        category: "INSURANCE",
        dayOfMonth: 15,
        startMonth: new Date(2026, 4, 1),
        endMonth: undefined,
      },
      "property_verified_server",
      "user_owner",
    );

    expect(data).toEqual({
      propertyId: "property_verified_server",
      createdByUserId: "user_owner",
      label: "Assurance PNO",
      amountInCents: 4275,
      currency: "EUR",
      category: "INSURANCE",
      dayOfMonth: 15,
      startMonth: new Date(2026, 4, 1),
      endMonth: null,
      status: "ACTIVE",
    });
  });

  it("builds recurring expense rule disable data", () => {
    expect(buildOwnerRecurringExpenseRuleDisableData()).toEqual({
      status: "DISABLED",
    });
  });
});
