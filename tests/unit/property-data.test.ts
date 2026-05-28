import { describe, expect, it } from "vitest";

import {
  buildOwnerPropertyArchiveData,
  buildOwnerPropertyCreateData,
  buildOwnerPropertyUpdateData,
} from "@/server/owner/property-data";
import type {
  PropertyCreateInput,
  PropertyUpdateInput,
} from "@/server/validation";

const validCreateInput: PropertyCreateInput = {
  name: "Appartement Test",
  addressLine1: "1 rue du Test",
  addressLine2: undefined,
  postalCode: "75001",
  city: "Paris",
  country: "FR",
  propertyType: "APARTMENT",
  surfaceAreaSqm: 42,
  furnished: true,
  isColocation: false,
};

describe("property mutation data builders", () => {
  it("forces create ownerProfileId and DRAFT status from server-side values", () => {
    const maliciousInput = {
      ...validCreateInput,
      ownerProfileId: "owner_profile_from_client",
      status: "ACTIVE",
    } as unknown as PropertyCreateInput;

    expect(
      buildOwnerPropertyCreateData(maliciousInput, "owner_profile_server"),
    ).toMatchObject({
      ownerProfileId: "owner_profile_server",
      status: "DRAFT",
    });
  });

  it("keeps update data limited to editable property fields", () => {
    const maliciousInput = {
      name: "Appartement Update",
      furnished: false,
      isColocation: false,
      ownerProfileId: "owner_profile_from_client",
      status: "ARCHIVED",
    } as unknown as PropertyUpdateInput;

    const data = buildOwnerPropertyUpdateData(maliciousInput);

    expect(data).toEqual({
      name: "Appartement Update",
      furnished: false,
      isColocation: false,
    });
    expect(data).not.toHaveProperty("ownerProfileId");
    expect(data).not.toHaveProperty("status");
  });

  it("builds logical archive data without delete intent", () => {
    expect(buildOwnerPropertyArchiveData()).toEqual({ status: "ARCHIVED" });
  });
});
