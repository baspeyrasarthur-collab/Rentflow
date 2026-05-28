import { describe, expect, it } from "vitest";

import { getOwnerPropertyCompletionState } from "@/server/owner/property-completeness";

function property(overrides: Record<string, unknown> = {}) {
  return {
    name: "Appartement Republique",
    addressLine1: "10 rue de Paris",
    postalCode: "75010",
    city: "Paris",
    country: "FR",
    propertyType: "APARTMENT",
    surfaceAreaSqm: 42,
    ...overrides,
  };
}

describe("owner property completeness", () => {
  it("marks a property complete when required fields and secondary data are present", () => {
    expect(getOwnerPropertyCompletionState(property())).toEqual({
      missingRequiredFields: [],
      missingSecondaryFields: [],
      isComplete: true,
    });
  });

  it("reports required missing fields before any completed action is shown", () => {
    expect(
      getOwnerPropertyCompletionState(
        property({
          addressLine1: "",
          city: "   ",
        }),
      ),
    ).toEqual({
      missingRequiredFields: ["addressLine1", "city"],
      missingSecondaryFields: [],
      isComplete: false,
    });
  });

  it("reports only secondary property data as partial guidance", () => {
    expect(
      getOwnerPropertyCompletionState(
        property({
          surfaceAreaSqm: null,
        }),
      ),
    ).toEqual({
      missingRequiredFields: [],
      missingSecondaryFields: ["surfaceAreaSqm"],
      isComplete: false,
    });
  });
});
