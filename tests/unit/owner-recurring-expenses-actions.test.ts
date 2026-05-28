import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createOwnerRecurringExpenseRuleAction,
  disableOwnerRecurringExpenseRuleAction,
  generateOwnerRecurringExpenseOccurrencesAction,
} from "@/app/(owner)/owner/finances/recurring-expenses/actions";

const mocks = vi.hoisted(() => ({
  auditLogCreate: vi.fn(),
  expenseCreateMany: vi.fn(),
  expenseCreate: vi.fn(),
  expenseFindMany: vi.fn(),
  ownerProfileFindUnique: vi.fn(),
  propertyFindFirst: vi.fn(),
  recurringExpenseRuleCreate: vi.fn(),
  recurringExpenseRuleFindFirst: vi.fn(),
  recurringExpenseRuleFindMany: vi.fn(),
  recurringExpenseRuleUpdate: vi.fn(),
  redirect: vi.fn(),
  requireOwnerAccess: vi.fn(),
  requireRole: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
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
    ownerProfile: {
      findUnique: mocks.ownerProfileFindUnique,
    },
    property: {
      findFirst: mocks.propertyFindFirst,
    },
    recurringExpenseRule: {
      findFirst: mocks.recurringExpenseRuleFindFirst,
    },
  },
}));

function createValidRecurringExpenseRuleFormData() {
  const formData = new FormData();

  formData.set("propertyId", "property_1");
  formData.set("label", "Assurance PNO");
  formData.set("amountInEuros", "42.75");
  formData.set("category", "INSURANCE");
  formData.set("dayOfMonth", "15");
  formData.set("startMonth", "2026-05");
  formData.set("endMonth", "2026-12");

  return formData;
}

function createValidRecurringExpenseRuleDisableFormData() {
  const formData = new FormData();

  formData.set("recurringExpenseRuleId", "rule_1");

  return formData;
}

function createRecurringExpenseOccurrencesFormData(month: string) {
  const formData = new FormData();

  formData.set("month", month);

  return formData;
}

describe("owner recurring expense rule actions", () => {
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
    mocks.propertyFindFirst.mockResolvedValue({
      id: "property_1",
      ownerProfileId: "owner_profile_1",
      name: "Appartement Canal",
      city: "Nantes",
    });
    mocks.recurringExpenseRuleCreate.mockResolvedValue({
      id: "rule_1",
    });
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
    mocks.recurringExpenseRuleUpdate.mockResolvedValue({
      id: "rule_1",
    });
    mocks.recurringExpenseRuleFindMany.mockResolvedValue([]);
    mocks.expenseCreateMany.mockResolvedValue({
      count: 0,
    });
    mocks.expenseFindMany.mockResolvedValue([]);
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        auditLog: {
          create: mocks.auditLogCreate,
        },
        expense: {
          create: mocks.expenseCreate,
          createMany: mocks.expenseCreateMany,
          findMany: mocks.expenseFindMany,
        },
        recurringExpenseRule: {
          create: mocks.recurringExpenseRuleCreate,
          findMany: mocks.recurringExpenseRuleFindMany,
          update: mocks.recurringExpenseRuleUpdate,
        },
      }),
    );
    mocks.redirect.mockImplementation((url: string) => {
      throw Object.assign(new Error("NEXT_REDIRECT"), { url });
    });
  });

  it("creates a recurring expense rule for an owned property and audits it", async () => {
    await expect(
      createOwnerRecurringExpenseRuleAction(
        createValidRecurringExpenseRuleFormData(),
      ),
    ).rejects.toMatchObject({
      message: "NEXT_REDIRECT",
      url: "/owner/finances",
    });

    expect(mocks.propertyFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "property_1",
          ownerProfileId: "owner_profile_1",
        },
      }),
    );
    expect(mocks.recurringExpenseRuleCreate).toHaveBeenCalledWith({
      data: {
        propertyId: "property_1",
        createdByUserId: "user_owner",
        label: "Assurance PNO",
        amountInCents: 4275,
        currency: "EUR",
        category: "INSURANCE",
        dayOfMonth: 15,
        startMonth: new Date(2026, 4, 1),
        endMonth: new Date(2026, 11, 1),
        status: "ACTIVE",
      },
      select: {
        id: true,
      },
    });
    expect(mocks.auditLogCreate).toHaveBeenCalledWith({
      data: {
        userId: "user_owner",
        action: "recurring_expense_rule.created",
        entityType: "RecurringExpenseRule",
        entityId: "rule_1",
        metadata: {
          source: "owner_create_recurring_expense_rule",
          propertyId: "property_1",
        },
      },
    });
    expect(mocks.expenseCreate).not.toHaveBeenCalled();
    expect(mocks.redirect).toHaveBeenCalledWith("/owner/finances");
  });

  it("disables a recurring expense rule for an owned property and audits it", async () => {
    await expect(
      disableOwnerRecurringExpenseRuleAction(
        createValidRecurringExpenseRuleDisableFormData(),
      ),
    ).rejects.toMatchObject({
      message: "NEXT_REDIRECT",
      url: "/owner/finances/recurring-expenses",
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
    expect(mocks.recurringExpenseRuleUpdate).toHaveBeenCalledWith({
      where: {
        id: "rule_1",
      },
      data: {
        status: "DISABLED",
      },
      select: {
        id: true,
      },
    });
    expect(mocks.auditLogCreate).toHaveBeenCalledWith({
      data: {
        userId: "user_owner",
        action: "recurring_expense_rule.disabled",
        entityType: "RecurringExpenseRule",
        entityId: "rule_1",
        metadata: {
          source: "owner_disable_recurring_expense_rule",
          propertyId: "property_1",
        },
      },
    });
    expect(mocks.expenseCreate).not.toHaveBeenCalled();
    expect(mocks.redirect).toHaveBeenCalledWith(
      "/owner/finances/recurring-expenses",
    );
  });

  it("rejects disable for a recurring expense rule outside the connected owner scope", async () => {
    mocks.recurringExpenseRuleFindFirst.mockResolvedValue(null);

    await expect(
      disableOwnerRecurringExpenseRuleAction(
        createValidRecurringExpenseRuleDisableFormData(),
      ),
    ).rejects.toBeInstanceOf(Error);

    expect(mocks.recurringExpenseRuleUpdate).not.toHaveBeenCalled();
    expect(mocks.auditLogCreate).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("generates recurring expense occurrences for a valid month and redirects back to finances", async () => {
    await expect(
      generateOwnerRecurringExpenseOccurrencesAction(
        createRecurringExpenseOccurrencesFormData("2026-05"),
      ),
    ).rejects.toMatchObject({
      message: "NEXT_REDIRECT",
      url: "/owner/finances?month=2026-05&recurringCreated=0&recurringSkipped=0&recurringEligible=0",
    });

    expect(mocks.recurringExpenseRuleFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "ACTIVE",
          property: {
            ownerProfileId: "owner_profile_1",
          },
        }),
      }),
    );
    expect(mocks.auditLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "recurring_expense_occurrences.generated",
          metadata: expect.objectContaining({
            source: "owner_generate_recurring_expense_occurrences",
            createdCount: 0,
            skippedCount: 0,
          }),
        }),
      }),
    );
    expect(mocks.redirect).toHaveBeenCalledWith(
      "/owner/finances?month=2026-05&recurringCreated=0&recurringSkipped=0&recurringEligible=0",
    );
  });

  it("rejects recurring expense occurrence generation for an invalid month", async () => {
    await expect(
      generateOwnerRecurringExpenseOccurrencesAction(
        createRecurringExpenseOccurrencesFormData("invalid"),
      ),
    ).rejects.toBeInstanceOf(Error);

    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.auditLogCreate).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
