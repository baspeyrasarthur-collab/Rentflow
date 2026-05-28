import { describe, expect, it } from "vitest";

import {
  ownerIndividualContractCreateSchema,
  ownerIndividualContractUpdateSchema,
} from "@/server/validation";

const validContractInput = {
  startDate: new Date("2026-06-01T00:00:00.000Z"),
  endDate: new Date("2027-05-31T00:00:00.000Z"),
  totalRentAmountInCents: 85000,
  totalChargesAmountInCents: 12000,
  depositAmountInCents: 85000,
  currency: "EUR",
  paymentDayOfMonth: 5,
};

describe("owner individual contract validation schemas", () => {
  it("accepts a valid individual contract creation payload", () => {
    const parsed =
      ownerIndividualContractCreateSchema.parse(validContractInput);

    expect(parsed).toMatchObject({
      totalRentAmountInCents: 85000,
      totalChargesAmountInCents: 12000,
      depositAmountInCents: 85000,
      currency: "EUR",
      paymentDayOfMonth: 5,
    });
    expect(parsed.startDate).toBeInstanceOf(Date);
    expect(parsed.endDate).toBeInstanceOf(Date);
  });

  it("rejects invalid start dates", () => {
    expect(() =>
      ownerIndividualContractCreateSchema.parse({
        ...validContractInput,
        startDate: "not-a-date",
      }),
    ).toThrow();
  });

  it("rejects payment days outside 1 to 28", () => {
    expect(() =>
      ownerIndividualContractCreateSchema.parse({
        ...validContractInput,
        paymentDayOfMonth: 0,
      }),
    ).toThrow();

    expect(() =>
      ownerIndividualContractCreateSchema.parse({
        ...validContractInput,
        paymentDayOfMonth: 29,
      }),
    ).toThrow();
  });

  it("rejects negative or non-integer money amounts", () => {
    expect(() =>
      ownerIndividualContractCreateSchema.parse({
        ...validContractInput,
        totalRentAmountInCents: -1,
      }),
    ).toThrow();

    expect(() =>
      ownerIndividualContractCreateSchema.parse({
        ...validContractInput,
        totalChargesAmountInCents: 42.5,
      }),
    ).toThrow();
  });

  it("rejects server-owned fields in creation payloads", () => {
    for (const field of [
      "ownerProfileId",
      "propertyId",
      "status",
      "contractType",
      "colocationMode",
    ]) {
      expect(() =>
        ownerIndividualContractCreateSchema.parse({
          ...validContractInput,
          [field]: "client_value",
        }),
      ).toThrow();
    }
  });

  it("accepts a valid individual contract update payload", () => {
    const parsed = ownerIndividualContractUpdateSchema.parse({
      totalRentAmountInCents: 90000,
      paymentDayOfMonth: 10,
    });

    expect(parsed).toEqual({
      totalRentAmountInCents: 90000,
      paymentDayOfMonth: 10,
    });
  });

  it("rejects empty individual contract update payloads", () => {
    expect(() => ownerIndividualContractUpdateSchema.parse({})).toThrow();
  });

  it("rejects server-owned fields in update payloads", () => {
    for (const field of [
      "ownerProfileId",
      "propertyId",
      "status",
      "contractType",
      "colocationMode",
    ]) {
      expect(() =>
        ownerIndividualContractUpdateSchema.parse({
          [field]: "client_value",
        }),
      ).toThrow();
    }
  });
});
