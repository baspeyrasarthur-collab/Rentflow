import { describe, expect, it } from "vitest";

import {
  buildReceiptPdfFilename,
  buildRentReceiptPdfDocument,
  canAccessReceiptPdf,
} from "@/server/receipts/pdf-data";

describe("receipt PDF helpers", () => {
  it("builds a clear ASCII PDF filename", () => {
    expect(
      buildReceiptPdfFilename({
        propertyName: "Appartement Canal",
        periodStart: new Date("2026-05-01T00:00:00.000Z"),
        totalAmountInCents: 103000,
        currency: "EUR",
      }),
    ).toBe("Quittance - Appartement Canal - Mai 2026 - 1030 EUR.pdf");
  });

  it("keeps cents in the filename when needed", () => {
    expect(
      buildReceiptPdfFilename({
        propertyName: "Studio / Centre",
        periodStart: new Date("2026-08-01T00:00:00.000Z"),
        totalAmountInCents: 103050,
        currency: "EUR",
      }),
    ).toBe("Quittance - Studio Centre - Aout 2026 - 1030-50 EUR.pdf");
  });

  it("allows receipt PDF access to the tenant, owner, or admin only", () => {
    const resource = {
      ownerUserId: "owner_user",
      tenantUserId: "tenant_user",
    };

    expect(
      canAccessReceiptPdf(
        {
          userId: "tenant_user",
          role: "TENANT",
        },
        resource,
      ),
    ).toBe(true);
    expect(
      canAccessReceiptPdf(
        {
          userId: "owner_user",
          role: "OWNER",
        },
        resource,
      ),
    ).toBe(true);
    expect(
      canAccessReceiptPdf(
        {
          userId: "admin_user",
          role: "ADMIN",
        },
        resource,
      ),
    ).toBe(true);
    expect(
      canAccessReceiptPdf(
        {
          userId: "other_tenant",
          role: "TENANT",
        },
        resource,
      ),
    ).toBe(false);
  });

  it("builds a minimal PDF buffer", () => {
    const pdf = buildRentReceiptPdfDocument({
      propertyName: "Appartement Canal",
      propertyAddress: "1 rue du Canal, 75010 Paris, FR",
      tenantName: "Alice Martin",
      ownerName: "Bob Durand",
      periodStart: new Date("2026-05-01T00:00:00.000Z"),
      periodEnd: new Date("2026-05-31T00:00:00.000Z"),
      rentAmountInCents: 95000,
      chargesAmountInCents: 8000,
      totalAmountInCents: 103000,
      currency: "EUR",
      generatedAt: new Date("2026-06-01T00:00:00.000Z"),
    });

    expect(pdf.toString("utf8", 0, 8)).toBe("%PDF-1.4");
    expect(pdf.toString("utf8")).toContain("Quittance de loyer");
  });
});
