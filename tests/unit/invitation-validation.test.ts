import { describe, expect, it } from "vitest";

import { ownerTenantInvitationCreateSchema } from "@/server/validation";

const validInvitationInput = {
  tenantEmail: "LOCATAIRE@example.COM",
  tenantFirstName: "Camille",
  tenantLastName: "Martin",
};

describe("owner tenant invitation validation", () => {
  it("accepts a valid invitation payload", () => {
    const parsed =
      ownerTenantInvitationCreateSchema.parse(validInvitationInput);

    expect(parsed).toEqual({
      tenantEmail: "locataire@example.com",
      tenantFirstName: "Camille",
      tenantLastName: "Martin",
    });
  });

  it("normalizes tenant email", () => {
    const parsed = ownerTenantInvitationCreateSchema.parse({
      ...validInvitationInput,
      tenantEmail: "  NewTenant@Example.Fr  ",
    });

    expect(parsed.tenantEmail).toBe("newtenant@example.fr");
  });

  it("rejects empty tenant first and last names", () => {
    expect(() =>
      ownerTenantInvitationCreateSchema.parse({
        ...validInvitationInput,
        tenantFirstName: "",
      }),
    ).toThrow();

    expect(() =>
      ownerTenantInvitationCreateSchema.parse({
        ...validInvitationInput,
        tenantLastName: "   ",
      }),
    ).toThrow();
  });

  it("rejects server-owned invitation fields", () => {
    for (const field of [
      "ownerProfileId",
      "propertyId",
      "rentalContractId",
      "contractTenantId",
      "tokenHash",
      "status",
      "expiresAt",
    ]) {
      expect(() =>
        ownerTenantInvitationCreateSchema.parse({
          ...validInvitationInput,
          [field]: "client_value",
        }),
      ).toThrow();
    }
  });
});
