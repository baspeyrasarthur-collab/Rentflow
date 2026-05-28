import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireTenantAccess: vi.fn(),
}));

vi.mock("@/server/auth/access", () => ({
  requireTenantAccess: mocks.requireTenantAccess,
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {},
}));

import {
  buildAcceptedMockMandateData,
  hasActiveMandate,
  isContractTenantEligibleForMockMandate,
} from "@/server/tenant/mandates";

describe("tenant mandate helpers", () => {
  it("allows mock mandate acceptance only for the connected active tenant attachment", () => {
    expect(
      isContractTenantEligibleForMockMandate(
        { tenantProfileId: "tenant_profile_1", status: "ACTIVE" },
        "tenant_profile_1",
      ),
    ).toBe(true);

    expect(
      isContractTenantEligibleForMockMandate(
        { tenantProfileId: "tenant_profile_2", status: "ACTIVE" },
        "tenant_profile_1",
      ),
    ).toBe(false);

    expect(
      isContractTenantEligibleForMockMandate(
        { tenantProfileId: "tenant_profile_1", status: "INVITED" },
        "tenant_profile_1",
      ),
    ).toBe(false);
  });

  it("detects existing active mandates to avoid duplicates", () => {
    expect(hasActiveMandate([{ status: "ACCEPTED" }])).toBe(true);
    expect(hasActiveMandate([{ status: "CREATED" }])).toBe(true);
    expect(hasActiveMandate([{ status: "REVOKED" }])).toBe(false);
    expect(hasActiveMandate([{ status: "FAILED" }])).toBe(false);
  });

  it("builds accepted mock mandate data without sensitive banking fields", () => {
    const acceptedAt = new Date("2026-06-01T00:00:00.000Z");
    const data = buildAcceptedMockMandateData({
      tenantProfileId: "tenant_profile_1",
      rentalContractId: "contract_1",
      contractTenantId: "contract_tenant_1",
      providerMandateId: "mandate_mock_1",
      acceptedAt,
    });

    expect(data).toEqual({
      tenantProfileId: "tenant_profile_1",
      rentalContractId: "contract_1",
      contractTenantId: "contract_tenant_1",
      provider: "MOCK",
      providerMandateId: "mandate_mock_1",
      status: "ACCEPTED",
      ibanLast4: "0000",
      acceptedAt,
    });
    expect(data).not.toHaveProperty("iban");
    expect(data).not.toHaveProperty("fullIban");
    expect(data).not.toHaveProperty("bankAccount");
  });
});
