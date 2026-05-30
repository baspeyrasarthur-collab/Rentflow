import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function readWorkspaceFile(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("focused owner guidance scrolling", () => {
  it("provides a reusable focus scroller with reduced-motion support", () => {
    const source = readWorkspaceFile(
      "components/ui/rentflow/scroll-to-focus.tsx",
    );

    expect(source).toContain("useSearchParams");
    expect(source).toContain('searchParams.get("focus")');
    expect(source).toContain("document.getElementById(focus)");
    expect(source).toContain("scrollIntoView");
    expect(source).toContain("prefers-reduced-motion: reduce");
    expect(source).toContain(
      'behavior: prefersReducedMotion ? "auto" : "smooth"',
    );
  });

  it("mounts the focus scroller on owner pages that expose focus targets", () => {
    const pages = [
      "app/(owner)/owner/properties/[id]/page.tsx",
      "app/(owner)/owner/properties/[id]/edit/page.tsx",
      "app/(owner)/owner/properties/[id]/contracts/[contractId]/page.tsx",
      "app/(owner)/owner/properties/[id]/contracts/[contractId]/edit/page.tsx",
      "app/(owner)/owner/tenants/page.tsx",
      "app/(owner)/owner/payments/page.tsx",
      "app/(owner)/owner/receipts/page.tsx",
      "app/(owner)/owner/account/page.tsx",
      "app/(owner)/owner/declarations/page.tsx",
    ];

    for (const page of pages) {
      const source = readWorkspaceFile(page);

      expect(source).toContain("ScrollToFocus");
      expect(source).toContain("<ScrollToFocus />");
    }
  });

  it("keeps the main focus target ids present on the owner pages", () => {
    const propertyDetailSource = readWorkspaceFile(
      "app/(owner)/owner/properties/[id]/page.tsx",
    );
    const propertyEditSource = readWorkspaceFile(
      "app/(owner)/owner/properties/[id]/edit/page.tsx",
    );
    const contractDetailSource = readWorkspaceFile(
      "app/(owner)/owner/properties/[id]/contracts/[contractId]/page.tsx",
    );
    const tenantsSource = readWorkspaceFile(
      "app/(owner)/owner/tenants/page.tsx",
    );
    const paymentsSource = readWorkspaceFile(
      "app/(owner)/owner/payments/page.tsx",
    );
    const receiptsSource = readWorkspaceFile(
      "app/(owner)/owner/receipts/page.tsx",
    );
    const personalInfoSource = readWorkspaceFile(
      "components/account/personal-info-form.tsx",
    );
    const declarationsSource = readWorkspaceFile(
      "app/(owner)/owner/declarations/page.tsx",
    );

    expect(propertyDetailSource).toContain('id="missing-fields"');
    expect(propertyDetailSource).toContain('id="characteristics"');
    expect(propertyEditSource).toContain('"fiscal-type"');
    expect(contractDetailSource).toContain("id={`payment-${payment.id}`}");
    expect(contractDetailSource).toContain("id={`receipt-${receipt.id}`}");
    expect(tenantsSource).toContain("id={`request-${tenantRequest.id}`}");
    expect(paymentsSource).toContain("id={`payment-${payment.id}`}");
    expect(receiptsSource).toContain("id={`receipt-${receipt.id}`}");
    expect(personalInfoSource).toContain('id="personal-info"');
    expect(declarationsSource).toContain('id="missing-data"');
  });
});
