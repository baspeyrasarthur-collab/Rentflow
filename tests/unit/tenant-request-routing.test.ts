import { describe, expect, it } from "vitest";

import {
  getOwnerTenantRequestPrimaryHref,
  getOwnerTenantRequestSecondaryHref,
} from "@/server/owner/tenant-request-routing";

describe("owner tenant request routing", () => {
  it("keeps the primary owner action on the central actionable tenant request page", () => {
    expect(getOwnerTenantRequestPrimaryHref("request_1")).toBe(
      "/owner/tenants?focus=request-request_1",
    );
  });

  it("returns deterministic secondary links by tenant request category", () => {
    expect(
      getOwnerTenantRequestSecondaryHref({
        category: "PAYMENT",
        propertyId: "property_1",
        rentalContractId: "contract_1",
      }),
    ).toBe("/owner/payments");
    expect(
      getOwnerTenantRequestSecondaryHref({
        category: "RECEIPT",
        propertyId: "property_1",
        rentalContractId: "contract_1",
      }),
    ).toBe("/owner/receipts");
    expect(
      getOwnerTenantRequestSecondaryHref({
        category: "DOCUMENT",
        propertyId: "property_1",
        rentalContractId: "contract_1",
      }),
    ).toBe("/owner/properties/property_1/contracts/contract_1");
    expect(
      getOwnerTenantRequestSecondaryHref({
        category: "REPAIR",
        propertyId: "property_1",
        rentalContractId: null,
      }),
    ).toBe("/owner/properties/property_1");
  });

  it("falls back to no secondary link when no destination can be inferred", () => {
    expect(
      getOwnerTenantRequestSecondaryHref({
        category: "GENERAL",
        propertyId: "property_1",
        rentalContractId: null,
      }),
    ).toBeNull();
  });
});
