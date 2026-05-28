import { describe, expect, it, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireOwnerAccess: vi.fn(),
  prisma: {
    expense: {
      findMany: vi.fn(),
    },
    payment: {
      findMany: vi.fn(),
    },
    platformCommission: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/server/auth/access", () => ({
  requireOwnerAccess: mocks.requireOwnerAccess,
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: mocks.prisma,
}));

import {
  buildOwnerFinanceExportCsv,
  buildOwnerFinanceExportWorkbook,
  buildOwnerFinanceExportXlsxBuffer,
  escapeCsvValue,
  formatCsvEuroAmount,
  getOwnerFinanceExportData,
  parseOwnerFinanceExportPeriodFromSearchParams,
} from "@/server/owner/finance-export";
import { AppError } from "@/server/errors";
import { GET as downloadXlsxExport } from "@/app/(owner)/owner/finances/export/download-xlsx/route";

describe("owner finance export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireOwnerAccess.mockResolvedValue({
      ownerProfile: {
        id: "owner_1",
      },
      user: {
        id: "user_1",
      },
    });
    mocks.prisma.payment.findMany.mockResolvedValue([]);
    mocks.prisma.expense.findMany.mockResolvedValue([]);
    mocks.prisma.platformCommission.findMany.mockResolvedValue([]);
  });

  it("parses month and year export periods and rejects invalid params", () => {
    expect(
      parseOwnerFinanceExportPeriodFromSearchParams(
        new URLSearchParams({
          month: "2026-05",
          periodType: "month",
        }),
      ),
    ).toMatchObject({
      filenameToken: "2026-05",
      periodType: "month",
      start: new Date(2026, 4, 1),
      end: new Date(2026, 5, 1),
    });

    expect(
      parseOwnerFinanceExportPeriodFromSearchParams(
        new URLSearchParams({
          periodType: "year",
          year: "2026",
        }),
      ),
    ).toMatchObject({
      filenameToken: "2026",
      periodType: "year",
      start: new Date(2026, 0, 1),
      end: new Date(2027, 0, 1),
    });

    expect(() =>
      parseOwnerFinanceExportPeriodFromSearchParams(
        new URLSearchParams({
          month: "bad",
          periodType: "month",
        }),
      ),
    ).toThrow(AppError);
  });

  it("filters export data by owner profile and distinguishes confirmed rent from declared payments", async () => {
    const period = parseOwnerFinanceExportPeriodFromSearchParams(
      new URLSearchParams({
        month: "2026-05",
        periodType: "month",
      }),
    );

    mocks.prisma.payment.findMany.mockResolvedValue([
      {
        id: "payment_confirmed",
        propertyId: "property_1",
        type: "RENT",
        status: "SUCCEEDED",
        amountInCents: 98000,
        currency: "EUR",
        dueDate: new Date(2026, 4, 5),
        paidAt: new Date(2026, 4, 6),
        property: {
          name: "Appartement Canal",
          city: "Paris",
        },
        rentalContract: {
          id: "contract_1",
          contractType: "INDIVIDUAL",
          startDate: new Date(2026, 0, 1),
        },
        tenantProfile: {
          user: {
            firstName: "Lea",
            lastName: "Martin",
            email: "lea@example.com",
          },
        },
        declarations: [],
      },
      {
        id: "payment_declared",
        propertyId: "property_1",
        type: "RENT",
        status: "PLANNED",
        amountInCents: 98000,
        currency: "EUR",
        dueDate: new Date(2026, 4, 5),
        paidAt: null,
        property: {
          name: "Appartement Canal",
          city: "Paris",
        },
        rentalContract: {
          id: "contract_1",
          contractType: "INDIVIDUAL",
          startDate: new Date(2026, 0, 1),
        },
        tenantProfile: {
          user: {
            firstName: "Lea",
            lastName: "Martin",
            email: "lea@example.com",
          },
        },
        declarations: [
          {
            declarationType: "PAID_EXTERNALLY",
            declaredAt: new Date(2026, 4, 5, 12),
          },
        ],
      },
    ]);
    mocks.prisma.expense.findMany.mockResolvedValue([
      {
        id: "expense_1",
        propertyId: "property_1",
        rentalContract: null,
        tenantProfile: null,
        property: {
          name: "Appartement Canal",
          city: "Paris",
        },
        label: "Assurance PNO",
        status: "PAID",
        category: "INSURANCE",
        amountInCents: 12050,
        currency: "EUR",
        dueDate: new Date(2026, 4, 10),
      },
    ]);

    const exportData = await getOwnerFinanceExportData(period);

    expect(mocks.prisma.payment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          ownerProfileId: "owner_1",
        }),
      }),
    );
    expect(mocks.prisma.expense.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          property: {
            ownerProfileId: "owner_1",
          },
        }),
      }),
    );
    expect(exportData.summary).toMatchObject({
      confirmedRentInCents: 98000,
      estimatedCashFlowInCents: 85950,
      outgoingAmountInCents: 12050,
      propertiesCount: 1,
      rowsCount: 3,
    });
    expect(
      exportData.rows.find((row) =>
        row.internalId.startsWith("payment_declared"),
      ),
    ).toMatchObject({
      entryInCents: null,
      netInCents: 0,
      source: "PaymentDeclaration",
      status: "Declare paye - reception non confirmee",
    });
  });

  it("excludes RentFlow platform commissions from export rows and cash-flow", async () => {
    const period = parseOwnerFinanceExportPeriodFromSearchParams(
      new URLSearchParams({
        month: "2026-05",
        periodType: "month",
      }),
    );

    mocks.prisma.payment.findMany.mockResolvedValue([
      {
        id: "payment_confirmed",
        propertyId: "property_1",
        type: "RENT",
        status: "SUCCEEDED",
        amountInCents: 60000,
        currency: "EUR",
        dueDate: new Date(2026, 4, 5),
        paidAt: new Date(2026, 4, 6),
        property: {
          name: "Studio Centre",
          city: "Lyon",
        },
        rentalContract: {
          id: "contract_1",
          contractType: "INDIVIDUAL",
          startDate: new Date(2026, 0, 1),
        },
        tenantProfile: {
          user: {
            firstName: null,
            lastName: null,
            email: "tenant@example.com",
          },
        },
        declarations: [],
      },
    ]);
    mocks.prisma.platformCommission.findMany.mockResolvedValue([
      {
        id: "commission_1",
        amountInCents: 490,
        currency: "EUR",
        chargedAt: new Date(2026, 4, 6),
      },
    ]);

    const exportData = await getOwnerFinanceExportData(period);
    const csv = buildOwnerFinanceExportCsv(exportData);

    expect(mocks.prisma.platformCommission.findMany).not.toHaveBeenCalled();
    expect(exportData.summary).toMatchObject({
      confirmedRentInCents: 60000,
      estimatedCashFlowInCents: 60000,
      outgoingAmountInCents: 0,
      rowsCount: 1,
    });
    expect(exportData.rows).toHaveLength(1);
    expect(csv).not.toContain("Frais RentFlow");
    expect(csv).not.toContain("Commission RentFlow");
    expect(csv).not.toContain("PlatformCommission");
  });

  it("formats euro amounts and protects generated CSV values", () => {
    expect(formatCsvEuroAmount(12050)).toBe("120,50");
    expect(formatCsvEuroAmount(-12050)).toBe("-120,50");
    expect(escapeCsvValue("-120,50")).toBe("'-120,50");
    expect(escapeCsvValue("=IMPORTXML()")).toBe("'=IMPORTXML()");
    expect(escapeCsvValue("Appartement; Canal")).toBe('"Appartement; Canal"');
  });

  it("builds a semicolon CSV with escaped rows", () => {
    const csv = buildOwnerFinanceExportCsv({
      generatedAt: new Date(2026, 4, 12),
      period: parseOwnerFinanceExportPeriodFromSearchParams(
        new URLSearchParams({
          month: "2026-05",
          periodType: "month",
        }),
      ),
      rows: [
        {
          date: new Date(2026, 4, 6),
          type: "Encaissement",
          category: "Loyer confirme",
          propertyId: "property_1",
          propertyName: "Appartement; Canal",
          contractLabel: "INDIVIDUAL",
          tenantName: "Lea Martin",
          description: "=a verifier",
          status: "Recu confirme",
          entryInCents: 98000,
          outgoingInCents: null,
          netInCents: 98000,
          currency: "EUR",
          source: "Payment",
          internalId: "payment_1",
        },
      ],
      summary: {
        confirmedRentInCents: 98000,
        estimatedCashFlowInCents: 98000,
        outgoingAmountInCents: 0,
        propertiesCount: 1,
        rowsCount: 1,
      },
    });

    expect(csv).toContain("Date;Type;Categorie;Logement");
    expect(csv).toContain('"Appartement; Canal"');
    expect(csv).toContain("'=a verifier");
    expect(csv).toContain("980,00");
  });

  it("builds a readable Excel workbook with summary and movement sheets", async () => {
    const period = parseOwnerFinanceExportPeriodFromSearchParams(
      new URLSearchParams({
        month: "2026-05",
        periodType: "month",
      }),
    );
    const data = {
      generatedAt: new Date(2026, 4, 12),
      period,
      rows: [
        {
          date: new Date(2026, 4, 6),
          type: "Encaissement",
          category: "Loyer confirme",
          propertyId: "property_1",
          propertyName: "Appartement Canal - Paris",
          contractLabel: "INDIVIDUAL",
          tenantName: "Lea Martin",
          description: "Loyer confirme comme recu par le proprietaire.",
          status: "Recu confirme",
          entryInCents: 98000,
          outgoingInCents: null,
          netInCents: 98000,
          currency: "EUR",
          source: "Payment",
          internalId: "payment_1",
        },
        {
          date: new Date(2026, 4, 7),
          type: "Paiement suivi",
          category: "Loyer declare par le locataire",
          propertyId: "property_1",
          propertyName: "Appartement Canal - Paris",
          contractLabel: "INDIVIDUAL",
          tenantName: "Lea Martin",
          description: "Reception non confirmee par le proprietaire.",
          status: "Declare paye - reception non confirmee",
          entryInCents: null,
          outgoingInCents: null,
          netInCents: 0,
          currency: "EUR",
          source: "PaymentDeclaration",
          internalId: "payment_2:2026-05-07",
        },
      ],
      summary: {
        confirmedRentInCents: 98000,
        estimatedCashFlowInCents: 98000,
        outgoingAmountInCents: 0,
        propertiesCount: 1,
        rowsCount: 2,
      },
    };

    const workbook = buildOwnerFinanceExportWorkbook(data);
    const summarySheet = workbook.getWorksheet("Résumé");
    const movementsSheet = workbook.getWorksheet("Mouvements");
    const buffer = await buildOwnerFinanceExportXlsxBuffer(data);

    expect(summarySheet?.getCell("A1").value).toBe("Export finances RentFlow");
    expect(summarySheet?.getCell("A9").value).toBe("Loyers confirmés");
    expect(summarySheet?.getCell("B9").value).toBe(980);
    expect(movementsSheet?.getRow(1).values).toEqual([
      undefined,
      "Date",
      "Type",
      "Catégorie",
      "Logement",
      "Contrat",
      "Locataire",
      "Description",
      "Statut",
      "Entrée (€)",
      "Sortie (€)",
      "Montant net (€)",
      "Devise",
      "Source RentFlow",
      "Identifiant interne",
    ]);
    expect(movementsSheet?.views[0]).toMatchObject({
      state: "frozen",
      ySplit: 1,
    });
    expect(movementsSheet?.getCell("C2").value).toBe("Loyer confirme");
    expect(movementsSheet?.getCell("M3").value).toBe("PaymentDeclaration");
    expect(buffer.byteLength).toBeGreaterThan(1000);
  });

  it("returns a downloadable XLSX response with validated period params", async () => {
    mocks.prisma.payment.findMany.mockResolvedValue([
      {
        id: "payment_confirmed",
        propertyId: "property_1",
        type: "RENT",
        status: "SUCCEEDED",
        amountInCents: 60000,
        currency: "EUR",
        dueDate: new Date(2026, 4, 5),
        paidAt: new Date(2026, 4, 6),
        property: {
          name: "Studio Centre",
          city: "Lyon",
        },
        rentalContract: {
          id: "contract_1",
          contractType: "INDIVIDUAL",
          startDate: new Date(2026, 0, 1),
        },
        tenantProfile: {
          user: {
            firstName: null,
            lastName: null,
            email: "tenant@example.com",
          },
        },
        declarations: [],
      },
    ]);

    const response = await downloadXlsxExport(
      new NextRequest(
        "http://localhost/owner/finances/export/download-xlsx?periodType=month&month=2026-05",
      ),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="rentflow-finances-2026-05.xlsx"',
    );
    expect((await response.arrayBuffer()).byteLength).toBeGreaterThan(1000);
    expect(mocks.requireOwnerAccess).toHaveBeenCalled();
    expect(mocks.prisma.payment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          ownerProfileId: "owner_1",
        }),
      }),
    );
  });

  it("rejects invalid XLSX download params before building a workbook", async () => {
    const response = await downloadXlsxExport(
      new NextRequest(
        "http://localhost/owner/finances/export/download-xlsx?periodType=month&month=bad",
      ),
    );

    expect(response.status).toBe(400);
    expect(mocks.requireOwnerAccess).not.toHaveBeenCalled();
  });
});
