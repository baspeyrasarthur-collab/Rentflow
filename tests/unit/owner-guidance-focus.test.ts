import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const contractDetailSource = readFileSync(
  join(
    process.cwd(),
    "app/(owner)/owner/properties/[id]/contracts/[contractId]/page.tsx",
  ),
  "utf8",
);
const receiptsPageSource = readFileSync(
  join(process.cwd(), "app/(owner)/owner/receipts/page.tsx"),
  "utf8",
);
const tenantsPageSource = readFileSync(
  join(process.cwd(), "app/(owner)/owner/tenants/page.tsx"),
  "utf8",
);

describe("owner guidance focus targets", () => {
  it("targets requested receipts on the contract detail where generation is available", () => {
    expect(contractDetailSource).toContain(
      "const isFocusedReceipt = focus === `receipt-${receipt.id}`;",
    );
    expect(contractDetailSource).toContain("id={`receipt-${receipt.id}`}");
    expect(contractDetailSource).toContain(
      "Action ciblee : cette demande de quittance attend",
    );
    expect(contractDetailSource).toContain(
      "generateOwnerRequestedRentReceiptAction",
    );
    expect(contractDetailSource).toContain("Generer la quittance");
  });

  it("sends requested receipt cards to the exact focused contract detail", () => {
    expect(receiptsPageSource).toContain("?focus=receipt-${receipt.id}");
    expect(receiptsPageSource).toContain("Traiter la demande");
  });

  it("targets tenant requests on the owner tenants page with direct actions", () => {
    expect(tenantsPageSource).toContain(
      "const isFocusedRequest = focus === `request-${tenantRequest.id}`;",
    );
    expect(tenantsPageSource).toContain("id={`request-${tenantRequest.id}`}");
    expect(tenantsPageSource).toContain(
      "Action ciblee : repondez a cette demande locataire.",
    );
    expect(tenantsPageSource).toContain("resolveOwnerTenantRequestAction");
    expect(tenantsPageSource).toContain("refuseOwnerTenantRequestAction");
    expect(tenantsPageSource).toContain('name="confirmResolved"');
    expect(tenantsPageSource).toContain('name="confirmRefused"');
    expect(tenantsPageSource).toContain("Ouvrir la page concernee");
  });
});
