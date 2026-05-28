import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function readWorkspaceFile(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("owner and tenant guidance UI", () => {
  it("renders ActionCard href cards as fully clickable links without nested Link buttons", () => {
    const source = readWorkspaceFile("components/ui/rentflow/action-card.tsx");

    expect(source).toContain("if (href)");
    expect(source).toContain("<Link className={sharedClassName} href={href}>");
    expect(source).toContain(
      '<span className={buttonVariants({ variant: "outline", size: "sm" })}>',
    );
    expect(source).not.toContain(
      '<Link\n            className={buttonVariants({ variant: "outline", size: "sm" })}',
    );
  });

  it("keeps uploaded image cards out of mouse spotlight wrappers while preserving zoom", () => {
    const ownerDashboardSource = readWorkspaceFile(
      "app/(owner)/owner/page.tsx",
    );
    const ownerListSource = readWorkspaceFile(
      "app/(owner)/owner/properties/page.tsx",
    );
    const tenantDashboardSource = readWorkspaceFile(
      "app/(tenant)/tenant/page.tsx",
    );
    const tenantContractSource = readWorkspaceFile(
      "app/(tenant)/tenant/contracts/[contractId]/page.tsx",
    );
    const ownerAccountSource = readWorkspaceFile(
      "app/(owner)/owner/account/page.tsx",
    );
    const tenantAccountSource = readWorkspaceFile(
      "app/(tenant)/tenant/account/page.tsx",
    );

    expect(ownerDashboardSource).not.toContain(
      '<SpotlightCard key={property.id} tone="info">',
    );
    expect(ownerListSource).not.toContain("SpotlightCard key={property.id}");
    expect(tenantDashboardSource).not.toContain(
      "SpotlightCard\n                    key={contractTenant.id}",
    );
    expect(tenantDashboardSource).not.toContain(
      '<SpotlightCard key={contractTenant.id} tone="default">',
    );
    expect(tenantContractSource).not.toContain(
      '<SpotlightCard tone="success">\n          <article className="h-full rounded-xl border border-primary/35 bg-card p-5',
    );
    expect(ownerAccountSource).not.toContain(
      '<SpotlightCard tone="success">\n            <article className="h-full rounded-xl border border-primary/45 bg-primary/10',
    );
    expect(tenantAccountSource).not.toContain(
      '<SpotlightCard tone="success">\n            <article className="h-full rounded-xl border border-primary/45 bg-primary/10',
    );

    expect(ownerDashboardSource).toContain("group-hover:scale-105");
    expect(ownerListSource).toContain("group-hover:scale-105");
    expect(tenantDashboardSource).toContain("group-hover:scale-105");
    expect(tenantContractSource).toContain("hover:scale-105");
  });

  it("keeps tenant property photos compact and framed on the dashboard", () => {
    const tenantDashboardSource = readWorkspaceFile(
      "app/(tenant)/tenant/page.tsx",
    );

    expect(tenantDashboardSource).toContain("function TenantPropertyImage");
    expect(tenantDashboardSource).toContain("sm:h-36 lg:h-40");
    expect(tenantDashboardSource).toContain("overflow-hidden rounded-xl");
    expect(tenantDashboardSource).toContain("h-full w-full object-cover");
    expect(tenantDashboardSource).toContain("Photo du logement");
    expect(tenantDashboardSource).toContain("imageUrl={property.imageUrl}");
    expect(tenantDashboardSource).not.toContain("min-h-40 w-full object-cover");
    expect(tenantDashboardSource).not.toContain(
      "updateOwnerPropertyImageAction",
    );
    expect(tenantDashboardSource).not.toContain(
      "removeOwnerPropertyImageAction",
    );
  });

  it("does not show a generic completed-property action on the property detail page", () => {
    const source = readWorkspaceFile(
      "app/(owner)/owner/properties/[id]/page.tsx",
    );

    expect(source).toContain("getOwnerPropertyCompletionState");
    expect(source).toContain("edit?focus=missing-fields");
    expect(source).toContain("edit?focus=characteristics");
    expect(source).toContain("Verifier les caracteristiques");
    expect(source).not.toContain("Mettre a jour le logement");
    expect(source).not.toContain(
      "Gardez les informations du bien propres avant de piloter contrats, paiements et quittances.",
    );
  });

  it("keeps property synthesis cards wide enough to avoid letter-by-letter wrapping", () => {
    const propertyDetailSource = readWorkspaceFile(
      "app/(owner)/owner/properties/[id]/page.tsx",
    );
    const statCardSource = readWorkspaceFile(
      "components/ui/rentflow/stat-card.tsx",
    );

    expect(propertyDetailSource).toContain(
      "grid gap-4 sm:grid-cols-2 xl:grid-cols-3",
    );
    expect(propertyDetailSource).not.toContain("lg:grid-cols-6");
    expect(statCardSource).toContain("break-words text-2xl");
    expect(statCardSource).not.toContain("[overflow-wrap:anywhere]");
  });
});
