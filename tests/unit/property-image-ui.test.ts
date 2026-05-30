import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function readWorkspaceFile(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("property image UI wiring", () => {
  it("renders upload, replacement and removal controls only on the owner property detail page", () => {
    const ownerDetailSource = readWorkspaceFile(
      "app/(owner)/owner/properties/[id]/page.tsx",
    );
    const tenantDashboardSource = readWorkspaceFile(
      "app/(tenant)/tenant/page.tsx",
    );
    const tenantContractSource = readWorkspaceFile(
      "app/(tenant)/tenant/contracts/[contractId]/page.tsx",
    );

    expect(ownerDetailSource).toContain("updateOwnerPropertyImageAction");
    expect(ownerDetailSource).toContain("removeOwnerPropertyImageAction");
    expect(ownerDetailSource).toContain('encType="multipart/form-data"');
    expect(ownerDetailSource).toContain('name="propertyId"');
    expect(ownerDetailSource).toContain('name="image"');
    expect(ownerDetailSource).toContain(
      'accept="image/png,image/jpeg,image/webp"',
    );
    expect(ownerDetailSource).toContain("Formats acceptes");
    expect(ownerDetailSource).toContain("Supprimer la photo");

    expect(tenantDashboardSource).not.toContain(
      "updateOwnerPropertyImageAction",
    );
    expect(tenantDashboardSource).not.toContain(
      "removeOwnerPropertyImageAction",
    );
    expect(tenantContractSource).not.toContain(
      "updateOwnerPropertyImageAction",
    );
    expect(tenantContractSource).not.toContain(
      "removeOwnerPropertyImageAction",
    );
  });

  it("shows configured property images in owner list cards and tenant views", () => {
    const ownerListSource = readWorkspaceFile(
      "app/(owner)/owner/properties/page.tsx",
    );
    const ownerDetailSource = readWorkspaceFile(
      "app/(owner)/owner/properties/[id]/page.tsx",
    );
    const ownerDashboardSource = readWorkspaceFile(
      "app/(owner)/owner/page.tsx",
    );
    const tenantDashboardSource = readWorkspaceFile(
      "app/(tenant)/tenant/page.tsx",
    );
    const tenantContractSource = readWorkspaceFile(
      "app/(tenant)/tenant/contracts/[contractId]/page.tsx",
    );

    expect(ownerDetailSource).toContain("PropertyHeroVisual");
    expect(ownerDetailSource).toContain("imageUrl={property.imageUrl}");
    expect(ownerDetailSource).toContain("group-hover/image:scale-105");
    expect(ownerDetailSource).not.toContain('import Image from "next/image"');
    expect(ownerListSource).toContain("PropertyVisual");
    expect(ownerListSource).toContain("imageUrl={property.imageUrl}");
    expect(ownerListSource).toContain("alt={`Photo du logement ${name}`}");
    expect(ownerListSource).not.toContain('import Image from "next/image"');
    expect(ownerDashboardSource).toContain("property.imageUrl");
    expect(ownerDashboardSource).toContain(
      "alt={`Photo du logement ${property.name}`}",
    );
    expect(tenantDashboardSource).toContain("TenantPropertyImage");
    expect(tenantDashboardSource).toContain("imageUrl={property.imageUrl}");
    expect(tenantDashboardSource).not.toContain(
      'import Image from "next/image"',
    );
    expect(tenantContractSource).toContain("ContractPropertyImage");
    expect(tenantContractSource).toContain(
      "imageUrl={contract.property.imageUrl}",
    );
    expect(tenantContractSource).not.toContain(
      'import Image from "next/image"',
    );
  });
});
