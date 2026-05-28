import { describe, expect, it } from "vitest";

import {
  buildOwnerIndividualContractCreateData,
  buildOwnerIndividualContractUpdateData,
  canEditOwnerIndividualContract,
} from "@/server/owner/contract-data";
import type {
  OwnerIndividualContractCreateInput,
  OwnerIndividualContractUpdateInput,
} from "@/server/validation";

const validContractInput: OwnerIndividualContractCreateInput = {
  startDate: new Date("2026-06-01T00:00:00.000Z"),
  endDate: undefined,
  totalRentAmountInCents: 95000,
  totalChargesAmountInCents: 12000,
  depositAmountInCents: 95000,
  currency: "EUR",
  paymentDayOfMonth: 5,
};

describe("owner individual contract data builder", () => {
  it("forces server-owned fields for contract creation", () => {
    const maliciousInput = {
      ...validContractInput,
      propertyId: "property_from_client",
      ownerProfileId: "owner_from_client",
      contractType: "COLOCATION",
      colocationMode: "LINKED_LEASES",
      status: "ACTIVE",
    } as unknown as OwnerIndividualContractCreateInput;

    expect(
      buildOwnerIndividualContractCreateData(
        maliciousInput,
        "property_server",
        "owner_server",
      ),
    ).toMatchObject({
      propertyId: "property_server",
      ownerProfileId: "owner_server",
      contractType: "INDIVIDUAL",
      colocationMode: "NONE",
      status: "DRAFT",
    });
  });

  it("keeps only editable fields for contract updates", () => {
    const maliciousInput = {
      totalRentAmountInCents: 99000,
      paymentDayOfMonth: 12,
      propertyId: "property_from_client",
      ownerProfileId: "owner_from_client",
      contractType: "COLOCATION",
      colocationMode: "LINKED_LEASES",
      status: "ACTIVE",
    } as unknown as OwnerIndividualContractUpdateInput;

    const data = buildOwnerIndividualContractUpdateData(maliciousInput);

    expect(data).toEqual({
      totalRentAmountInCents: 99000,
      paymentDayOfMonth: 12,
    });
    expect(data).not.toHaveProperty("propertyId");
    expect(data).not.toHaveProperty("ownerProfileId");
    expect(data).not.toHaveProperty("contractType");
    expect(data).not.toHaveProperty("colocationMode");
    expect(data).not.toHaveProperty("status");
  });

  it("allows editing only draft contracts", () => {
    expect(canEditOwnerIndividualContract("DRAFT")).toBe(true);
    expect(canEditOwnerIndividualContract("ACTIVE")).toBe(false);
    expect(canEditOwnerIndividualContract("SUSPENDED")).toBe(false);
    expect(canEditOwnerIndividualContract("ARCHIVED")).toBe(false);
  });
});
