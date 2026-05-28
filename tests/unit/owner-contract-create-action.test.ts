import { beforeEach, describe, expect, it, vi } from "vitest";

import { createOwnerIndividualContractAction } from "@/app/(owner)/owner/properties/[id]/contracts/new/actions";
import { AppError } from "@/server/errors";

const mocks = vi.hoisted(() => ({
  auditLogCreate: vi.fn(),
  getCurrentOwnerProfileForProperties: vi.fn(),
  propertyFindFirst: vi.fn(),
  redirect: vi.fn(),
  rentalContractCreate: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/server/owner/properties", () => ({
  getCurrentOwnerProfileForProperties:
    mocks.getCurrentOwnerProfileForProperties,
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
    property: {
      findFirst: mocks.propertyFindFirst,
    },
  },
}));

function createValidContractFormData() {
  const formData = new FormData();

  formData.set("startDate", "2026-06-01");
  formData.set("endDate", "");
  formData.set("totalRentAmountInEuros", "950");
  formData.set("totalChargesAmountInEuros", "120");
  formData.set("depositAmountInEuros", "950");
  formData.set("currency", "EUR");
  formData.set("paymentDayOfMonth", "5");

  return formData;
}

describe("owner contract creation action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentOwnerProfileForProperties.mockResolvedValue({
      user: {
        id: "user_owner",
        role: "OWNER",
      },
      ownerProfile: {
        id: "owner_profile_1",
        userId: "user_owner",
      },
    });
    mocks.propertyFindFirst.mockResolvedValue({
      id: "property_1",
      status: "ACTIVE",
    });
    mocks.rentalContractCreate.mockResolvedValue({
      id: "contract_1",
    });
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        auditLog: {
          create: mocks.auditLogCreate,
        },
        rentalContract: {
          create: mocks.rentalContractCreate,
        },
      }),
    );
    mocks.redirect.mockImplementation((url: string) => {
      throw Object.assign(new Error("NEXT_REDIRECT"), { url });
    });
  });

  it("creates an individual draft contract for the connected owner property", async () => {
    await expect(
      createOwnerIndividualContractAction(
        "property_1",
        createValidContractFormData(),
      ),
    ).rejects.toMatchObject({
      message: "NEXT_REDIRECT",
      url: "/owner/properties/property_1",
    });

    expect(mocks.propertyFindFirst).toHaveBeenCalledWith({
      where: {
        id: "property_1",
        ownerProfileId: "owner_profile_1",
      },
      select: {
        id: true,
        status: true,
      },
    });
    expect(mocks.rentalContractCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        propertyId: "property_1",
        ownerProfileId: "owner_profile_1",
        contractType: "INDIVIDUAL",
        colocationMode: "NONE",
        status: "DRAFT",
        totalRentAmountInCents: 95000,
        totalChargesAmountInCents: 12000,
        depositAmountInCents: 95000,
        currency: "EUR",
        paymentDayOfMonth: 5,
      }),
      select: {
        id: true,
      },
    });
    expect(mocks.auditLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user_owner",
        action: "rental_contract.created",
        entityType: "RentalContract",
        entityId: "contract_1",
      }),
    });
  });

  it("rejects a property that does not belong to the connected owner", async () => {
    mocks.propertyFindFirst.mockResolvedValue(null);

    await expect(
      createOwnerIndividualContractAction(
        "property_other",
        createValidContractFormData(),
      ),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });

    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.rentalContractCreate).not.toHaveBeenCalled();
  });

  it("rejects invalid contract data before creating a contract", async () => {
    const formData = createValidContractFormData();
    formData.set("paymentDayOfMonth", "29");

    await expect(
      createOwnerIndividualContractAction("property_1", formData),
    ).rejects.toThrow();

    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.rentalContractCreate).not.toHaveBeenCalled();
  });

  it("does not allow ADMIN to create an owner contract", async () => {
    const error = new AppError(
      "FORBIDDEN",
      "This role cannot access this resource.",
    );
    mocks.getCurrentOwnerProfileForProperties.mockRejectedValue(error);

    await expect(
      createOwnerIndividualContractAction(
        "property_1",
        createValidContractFormData(),
      ),
    ).rejects.toBe(error);

    expect(mocks.propertyFindFirst).not.toHaveBeenCalled();
    expect(mocks.rentalContractCreate).not.toHaveBeenCalled();
  });
});
