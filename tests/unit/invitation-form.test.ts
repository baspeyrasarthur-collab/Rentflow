import { describe, expect, it } from "vitest";

import { parseOwnerTenantInvitationCreateFormData } from "@/server/owner/invitation-form";

function createValidInvitationFormData() {
  const formData = new FormData();
  formData.set("tenantEmail", "LOCATAIRE@example.COM");
  formData.set("tenantFirstName", "Camille");
  formData.set("tenantLastName", "Martin");

  return formData;
}

describe("owner tenant invitation form parser", () => {
  it("parses valid invitation form data", () => {
    const parsed = parseOwnerTenantInvitationCreateFormData(
      createValidInvitationFormData(),
    );

    expect(parsed).toEqual({
      tenantEmail: "locataire@example.com",
      tenantFirstName: "Camille",
      tenantLastName: "Martin",
    });
  });

  it("normalizes email addresses", () => {
    const formData = createValidInvitationFormData();
    formData.set("tenantEmail", "  Invite@Example.Fr ");

    const parsed = parseOwnerTenantInvitationCreateFormData(formData);

    expect(parsed.tenantEmail).toBe("invite@example.fr");
  });

  it("does not read server-owned fields from form data", () => {
    const formData = createValidInvitationFormData();
    formData.set("ownerProfileId", "owner_from_client");
    formData.set("propertyId", "property_from_client");
    formData.set("rentalContractId", "contract_from_client");
    formData.set("contractTenantId", "contract_tenant_from_client");
    formData.set("tokenHash", "token_hash_from_client");
    formData.set("status", "ACCEPTED");
    formData.set("expiresAt", "2099-01-01T00:00:00.000Z");

    const parsed = parseOwnerTenantInvitationCreateFormData(formData);

    expect(parsed).not.toHaveProperty("ownerProfileId");
    expect(parsed).not.toHaveProperty("propertyId");
    expect(parsed).not.toHaveProperty("rentalContractId");
    expect(parsed).not.toHaveProperty("contractTenantId");
    expect(parsed).not.toHaveProperty("tokenHash");
    expect(parsed).not.toHaveProperty("status");
    expect(parsed).not.toHaveProperty("expiresAt");
  });
});
