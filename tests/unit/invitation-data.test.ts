import { describe, expect, it } from "vitest";

import {
  buildInvitedContractTenantData,
  buildSentInvitationData,
  buildTenantInvitationEmail,
  isActiveTenantInvitation,
} from "@/server/owner/invitation-data";
import type { OwnerTenantInvitationCreateInput } from "@/server/validation";

const invitationInput: OwnerTenantInvitationCreateInput = {
  tenantEmail: "locataire@example.com",
  tenantFirstName: "Camille",
  tenantLastName: "Martin",
};

const contract = {
  id: "contract_1",
  startDate: new Date("2026-06-01T00:00:00.000Z"),
  endDate: null,
  totalRentAmountInCents: 95000,
  totalChargesAmountInCents: 12000,
  depositAmountInCents: 95000,
  currency: "EUR",
};

describe("owner invitation data builders", () => {
  it("builds invited contract tenant data from server contract values", () => {
    const data = buildInvitedContractTenantData(invitationInput, contract);

    expect(data).toEqual({
      rentalContractId: "contract_1",
      tenantProfileId: null,
      invitedEmail: "locataire@example.com",
      invitedFirstName: "Camille",
      invitedLastName: "Martin",
      rentShareAmountInCents: 95000,
      chargesShareAmountInCents: 12000,
      depositShareAmountInCents: 95000,
      currency: "EUR",
      startDate: contract.startDate,
      endDate: null,
      status: "INVITED",
    });
  });

  it("builds sent invitation data without storing the raw token", () => {
    const data = buildSentInvitationData(invitationInput, {
      ownerProfileId: "owner_profile_1",
      propertyId: "property_1",
      rentalContractId: "contract_1",
      contractTenantId: "contract_tenant_1",
      tokenHash: "hashed-token",
      expiresAt: new Date("2026-06-15T00:00:00.000Z"),
    });

    expect(data).toMatchObject({
      ownerProfileId: "owner_profile_1",
      propertyId: "property_1",
      rentalContractId: "contract_1",
      contractTenantId: "contract_tenant_1",
      tokenHash: "hashed-token",
      status: "SENT",
    });
    expect(data).not.toHaveProperty("token");
    expect(data).not.toHaveProperty("rawToken");
  });

  it("detects active invitations", () => {
    const now = new Date("2026-06-01T00:00:00.000Z");

    expect(
      isActiveTenantInvitation(
        { status: "SENT", expiresAt: new Date("2026-06-02T00:00:00.000Z") },
        now,
      ),
    ).toBe(true);
    expect(
      isActiveTenantInvitation(
        { status: "SENT", expiresAt: new Date("2026-05-31T00:00:00.000Z") },
        now,
      ),
    ).toBe(false);
    expect(
      isActiveTenantInvitation(
        { status: "ACCEPTED", expiresAt: new Date("2026-06-02T00:00:00.000Z") },
        now,
      ),
    ).toBe(false);
  });

  it("builds a mock email payload with the raw token only inside the accept url", () => {
    const email = buildTenantInvitationEmail({
      tenantEmail: "locataire@example.com",
      tenantFirstName: "Camille",
      acceptUrl: "https://app.example.com/invitations/accept?token=raw-token",
    });

    expect(email.to).toBe("locataire@example.com");
    expect(email.text).toContain("raw-token");
    expect(email.html).toContain("raw-token");
  });
});
