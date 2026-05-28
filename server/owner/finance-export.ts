import ExcelJS from "exceljs";

import { requireOwnerAccess } from "@/server/auth/access";
import { DEFAULT_LOCALE } from "@/server/config/app";
import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/errors";

const CSV_WARNING =
  "Cet export est prepare a partir des donnees connues de RentFlow. Il doit etre verifie avant tout usage comptable ou fiscal officiel.";

const CSV_HEADERS = [
  "Date",
  "Type",
  "Categorie",
  "Logement",
  "Contrat",
  "Locataire",
  "Description",
  "Statut",
  "Entree (EUR)",
  "Sortie (EUR)",
  "Montant net (EUR)",
  "Devise",
  "Source RentFlow",
  "Identifiant interne",
] as const;

export const FINANCE_EXPORT_COLUMNS = CSV_HEADERS;

const XLSX_WARNING =
  "Cet export est préparé à partir des données connues de RentFlow. Il doit être vérifié avant tout usage comptable ou fiscal officiel.";

const XLSX_MONEY_FORMAT = "#,##0.00 €;[Red]-#,##0.00 €";
const XLSX_DATE_FORMAT = "dd/mm/yyyy";

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PLANNED: "Planifie",
  PENDING: "En attente",
  PROCESSING: "En traitement",
  SUCCEEDED: "Recu confirme",
  FAILED: "Echoue",
  CANCELED: "Annule",
  REFUNDED: "Rembourse",
  DISPUTED: "Conteste",
};

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  RENT: "Loyer",
  CHARGES: "Charges",
  DEPOSIT: "Depot de garantie",
  ONE_OFF_EXPENSE: "Paiement ponctuel",
};

const EXPENSE_STATUS_LABELS: Record<string, string> = {
  PLANNED: "Planifiee",
  PENDING: "En attente",
  PAID: "Payee",
  CANCELED: "Annulee",
};

const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  LOAN_REPAYMENT: "Remboursement d'emprunt",
  INSURANCE: "Assurance",
  CONDO_FEES: "Charges de copropriete",
  PROPERTY_TAX: "Taxe fonciere",
  WORKS: "Travaux",
  OTHER: "Autre",
};

export type OwnerFinanceExportPeriod =
  | {
      periodType: "month";
      month: string;
      start: Date;
      end: Date;
      label: string;
      filenameToken: string;
    }
  | {
      periodType: "year";
      year: string;
      start: Date;
      end: Date;
      label: string;
      filenameToken: string;
    };

export type OwnerFinanceExportRow = {
  date: Date;
  type: string;
  category: string;
  propertyId?: string | null;
  propertyName: string;
  contractLabel: string;
  tenantName: string;
  description: string;
  status: string;
  entryInCents: number | null;
  outgoingInCents: number | null;
  netInCents: number;
  currency: string;
  source: string;
  internalId: string;
};

export type OwnerFinanceExportData = {
  generatedAt: Date;
  period: OwnerFinanceExportPeriod;
  rows: OwnerFinanceExportRow[];
  summary: {
    confirmedRentInCents: number;
    outgoingAmountInCents: number;
    estimatedCashFlowInCents: number;
    propertiesCount: number;
    rowsCount: number;
  };
};

function getSingleSearchParam(
  searchParams: URLSearchParams,
  key: string,
): string | null {
  const value = searchParams.get(key);

  return value && value.trim().length > 0 ? value.trim() : null;
}

function assertValidMonth(month: string | null): asserts month is string {
  if (!month || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    throw new AppError(
      "BAD_REQUEST",
      "Le mois d'export doit utiliser le format YYYY-MM.",
    );
  }
}

function assertValidYear(year: string | null): asserts year is string {
  if (!year || !/^\d{4}$/.test(year)) {
    throw new AppError(
      "BAD_REQUEST",
      "L'annee d'export doit utiliser le format YYYY.",
    );
  }

  const yearNumber = Number(year);
  if (!Number.isInteger(yearNumber) || yearNumber < 2000 || yearNumber > 2100) {
    throw new AppError("BAD_REQUEST", "L'annee d'export est invalide.");
  }
}

export function getDefaultOwnerFinanceExportPeriod(
  now = new Date(),
): OwnerFinanceExportPeriod {
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0",
  )}`;
  const searchParams = new URLSearchParams({
    periodType: "month",
    month,
  });

  return parseOwnerFinanceExportPeriodFromSearchParams(searchParams);
}

export function parseOwnerFinanceExportPeriodFromSearchParams(
  searchParams: URLSearchParams,
): OwnerFinanceExportPeriod {
  const periodType =
    getSingleSearchParam(searchParams, "periodType") ?? "month";

  if (periodType === "month") {
    const month = getSingleSearchParam(searchParams, "month");
    assertValidMonth(month);

    const [yearValue, monthValue] = month.split("-");
    const year = Number(yearValue);
    const monthIndex = Number(monthValue) - 1;
    const start = new Date(year, monthIndex, 1);
    const end = new Date(year, monthIndex + 1, 1);

    return {
      periodType,
      month,
      start,
      end,
      label: new Intl.DateTimeFormat(DEFAULT_LOCALE, {
        month: "long",
        year: "numeric",
      }).format(start),
      filenameToken: month,
    };
  }

  if (periodType === "year") {
    const year = getSingleSearchParam(searchParams, "year");
    assertValidYear(year);

    const yearNumber = Number(year);

    return {
      periodType,
      year,
      start: new Date(yearNumber, 0, 1),
      end: new Date(yearNumber + 1, 0, 1),
      label: year,
      filenameToken: year,
    };
  }

  throw new AppError(
    "BAD_REQUEST",
    "Le type de periode doit etre month ou year.",
  );
}

function isWithinPeriod(date: Date | null, period: OwnerFinanceExportPeriod) {
  return !!date && date >= period.start && date < period.end;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatCsvEuroAmount(amountInCents: number | null) {
  if (amountInCents === null) {
    return "";
  }

  return (amountInCents / 100).toFixed(2).replace(".", ",");
}

export function escapeCsvValue(value: string | number | null | undefined) {
  let normalized = value === null || value === undefined ? "" : String(value);

  if (/^[=+\-@]/.test(normalized)) {
    normalized = `'${normalized}`;
  }

  if (/[;"\r\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }

  return normalized;
}

function getTenantName(payment: {
  tenantProfile?: {
    user: {
      firstName: string | null;
      lastName: string | null;
      email: string;
    };
  } | null;
}) {
  const user = payment.tenantProfile?.user;
  const fullName = [user?.firstName, user?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || user?.email || "Non renseigne";
}

function getContractLabel(contract: {
  id: string;
  contractType: string;
  startDate: Date;
}) {
  return `${contract.contractType} - ${formatDate(contract.startDate)} (${contract.id})`;
}

function buildPaymentRows(
  payments: Array<{
    id: string;
    propertyId: string;
    type: string;
    status: string;
    amountInCents: number;
    currency: string;
    dueDate: Date;
    paidAt: Date | null;
    property: { name: string; city: string };
    rentalContract: {
      id: string;
      contractType: string;
      startDate: Date;
    };
    tenantProfile: {
      user: {
        firstName: string | null;
        lastName: string | null;
        email: string;
      };
    };
    declarations: Array<{
      declarationType: string;
      declaredAt: Date;
    }>;
  }>,
  period: OwnerFinanceExportPeriod,
) {
  return payments.flatMap((payment): OwnerFinanceExportRow[] => {
    const latestDeclaration = payment.declarations[0];
    const propertyName = `${payment.property.name} - ${payment.property.city}`;
    const contractLabel = getContractLabel(payment.rentalContract);
    const tenantName = getTenantName(payment);
    const paymentTypeLabel = PAYMENT_TYPE_LABELS[payment.type] ?? payment.type;
    const paymentStatusLabel =
      PAYMENT_STATUS_LABELS[payment.status] ?? payment.status;

    if (
      payment.status === "SUCCEEDED" &&
      isWithinPeriod(payment.paidAt, period)
    ) {
      return [
        {
          date: payment.paidAt ?? payment.dueDate,
          type: "Encaissement",
          category: `${paymentTypeLabel} confirme`,
          propertyId: payment.propertyId,
          propertyName,
          contractLabel,
          tenantName,
          description: "Loyer confirme comme recu par le proprietaire.",
          status: paymentStatusLabel,
          entryInCents: payment.amountInCents,
          outgoingInCents: null,
          netInCents: payment.amountInCents,
          currency: payment.currency,
          source: "Payment",
          internalId: payment.id,
        },
      ];
    }

    if (!isWithinPeriod(payment.dueDate, period)) {
      return [];
    }

    const isDeclaredPaid =
      latestDeclaration?.declarationType === "PAID_EXTERNALLY";

    return [
      {
        date: payment.dueDate,
        type: "Paiement suivi",
        category: isDeclaredPaid
          ? `${paymentTypeLabel} declare par le locataire`
          : `${paymentTypeLabel} attendu`,
        propertyId: payment.propertyId,
        propertyName,
        contractLabel,
        tenantName,
        description: isDeclaredPaid
          ? "Le locataire indique avoir paye hors RentFlow. Reception non confirmee par le proprietaire."
          : "Paiement suivi par RentFlow, non confirme comme encaisse.",
        status: isDeclaredPaid
          ? "Declare paye - reception non confirmee"
          : paymentStatusLabel,
        entryInCents: null,
        outgoingInCents: null,
        netInCents: 0,
        currency: payment.currency,
        source: isDeclaredPaid ? "PaymentDeclaration" : "Payment",
        internalId: isDeclaredPaid
          ? `${payment.id}:${latestDeclaration.declaredAt.toISOString()}`
          : payment.id,
      },
    ];
  });
}

function buildExpenseRows(
  expenses: Array<{
    id: string;
    propertyId: string;
    rentalContract: {
      id: string;
      contractType: string;
      startDate: Date;
    } | null;
    tenantProfile: {
      user: {
        firstName: string | null;
        lastName: string | null;
        email: string;
      };
    } | null;
    property: { name: string; city: string };
    label: string;
    status: string;
    category: string;
    amountInCents: number;
    currency: string;
    dueDate: Date;
  }>,
) {
  return expenses.map(
    (expense): OwnerFinanceExportRow => ({
      date: expense.dueDate,
      type: "Sortie",
      category: EXPENSE_CATEGORY_LABELS[expense.category] ?? expense.category,
      propertyId: expense.propertyId,
      propertyName: `${expense.property.name} - ${expense.property.city}`,
      contractLabel: expense.rentalContract
        ? getContractLabel(expense.rentalContract)
        : "Non rattache",
      tenantName: getTenantName(expense),
      description: expense.label,
      status: EXPENSE_STATUS_LABELS[expense.status] ?? expense.status,
      entryInCents: null,
      outgoingInCents: expense.amountInCents,
      netInCents: -expense.amountInCents,
      currency: expense.currency,
      source: "Expense",
      internalId: expense.id,
    }),
  );
}

async function getOwnerFinanceExportRows(period: OwnerFinanceExportPeriod) {
  const { ownerProfile } = await requireOwnerAccess();

  const [payments, expenses] = await Promise.all([
    prisma.payment.findMany({
      where: {
        ownerProfileId: ownerProfile.id,
        OR: [
          {
            dueDate: {
              gte: period.start,
              lt: period.end,
            },
          },
          {
            status: "SUCCEEDED",
            paidAt: {
              gte: period.start,
              lt: period.end,
            },
          },
        ],
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        propertyId: true,
        type: true,
        status: true,
        amountInCents: true,
        currency: true,
        dueDate: true,
        paidAt: true,
        property: {
          select: {
            name: true,
            city: true,
          },
        },
        rentalContract: {
          select: {
            id: true,
            contractType: true,
            startDate: true,
          },
        },
        tenantProfile: {
          select: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        declarations: {
          orderBy: [
            {
              declaredAt: "desc",
            },
            {
              createdAt: "desc",
            },
          ],
          take: 1,
          select: {
            declarationType: true,
            declaredAt: true,
          },
        },
      },
    }),
    prisma.expense.findMany({
      where: {
        dueDate: {
          gte: period.start,
          lt: period.end,
        },
        status: {
          not: "CANCELED",
        },
        property: {
          ownerProfileId: ownerProfile.id,
        },
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        propertyId: true,
        label: true,
        status: true,
        category: true,
        amountInCents: true,
        currency: true,
        dueDate: true,
        property: {
          select: {
            name: true,
            city: true,
          },
        },
        rentalContract: {
          select: {
            id: true,
            contractType: true,
            startDate: true,
          },
        },
        tenantProfile: {
          select: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    }),
  ]);

  return [
    ...buildPaymentRows(payments, period),
    ...buildExpenseRows(expenses),
  ].sort((first, second) => first.date.getTime() - second.date.getTime());
}

export async function getOwnerFinanceExportData(
  period: OwnerFinanceExportPeriod,
): Promise<OwnerFinanceExportData> {
  const rows = await getOwnerFinanceExportRows(period);
  const confirmedRentInCents = rows
    .filter((row) => row.type === "Encaissement")
    .reduce((total, row) => total + (row.entryInCents ?? 0), 0);
  const outgoingAmountInCents = rows.reduce(
    (total, row) => total + (row.outgoingInCents ?? 0),
    0,
  );
  const propertyIds = new Set(
    rows.flatMap((row) => (row.propertyId ? [row.propertyId] : [])),
  );

  return {
    generatedAt: new Date(),
    period,
    rows,
    summary: {
      confirmedRentInCents,
      outgoingAmountInCents,
      estimatedCashFlowInCents: confirmedRentInCents - outgoingAmountInCents,
      propertiesCount: propertyIds.size,
      rowsCount: rows.length,
    },
  };
}

export function buildOwnerFinanceExportCsv(data: OwnerFinanceExportData) {
  const lines = [
    ["RentFlow export finances"],
    ["Periode", data.period.label],
    ["Genere le", formatDate(data.generatedAt)],
    ["Avertissement", CSV_WARNING],
    [],
    ["Mouvements detailles"],
    CSV_HEADERS,
    ...data.rows.map((row) => [
      formatDate(row.date),
      row.type,
      row.category,
      row.propertyName,
      row.contractLabel,
      row.tenantName,
      row.description,
      row.status,
      formatCsvEuroAmount(row.entryInCents),
      formatCsvEuroAmount(row.outgoingInCents),
      formatCsvEuroAmount(row.netInCents),
      row.currency,
      row.source,
      row.internalId,
    ]),
  ];

  return lines
    .map((line) => line.map((value) => escapeCsvValue(value)).join(";"))
    .join("\r\n");
}

export async function getOwnerFinanceExportCsv(
  period: OwnerFinanceExportPeriod,
) {
  const data = await getOwnerFinanceExportData(period);

  return {
    data,
    csv: buildOwnerFinanceExportCsv(data),
    filename: `rentflow-finances-${period.filenameToken}.csv`,
  };
}

function centsToEuros(amountInCents: number | null) {
  return amountInCents === null ? null : amountInCents / 100;
}

function styleHeaderRow(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF111827" },
    };
    cell.font = {
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
    cell.border = {
      bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
    };
  });
}

function styleSummaryWorksheet(
  worksheet: ExcelJS.Worksheet,
  data: OwnerFinanceExportData,
) {
  worksheet.columns = [
    { key: "label", width: 30 },
    { key: "value", width: 24 },
    { width: 5 },
    { width: 24 },
    { width: 24 },
    { width: 24 },
  ];
  worksheet.mergeCells("A1:F1");
  worksheet.getCell("A1").value = "Export finances RentFlow";
  worksheet.getCell("A1").font = {
    bold: true,
    color: { argb: "FFFFFFFF" },
    size: 20,
  };
  worksheet.getCell("A1").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0F172A" },
  };
  worksheet.getCell("A1").alignment = { vertical: "middle" };
  worksheet.getRow(1).height = 32;

  worksheet.getCell("A3").value = "Période exportée";
  worksheet.getCell("B3").value = data.period.label;
  worksheet.getCell("A4").value = "Date de génération";
  worksheet.getCell("B4").value = data.generatedAt;
  worksheet.getCell("B4").numFmt = XLSX_DATE_FORMAT;

  worksheet.mergeCells("A6:F6");
  worksheet.getCell("A6").value = XLSX_WARNING;
  worksheet.getCell("A6").alignment = { wrapText: true, vertical: "middle" };
  worksheet.getCell("A6").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFFF7ED" },
  };
  worksheet.getRow(6).height = 42;

  const indicatorHeader = worksheet.getRow(8);
  indicatorHeader.values = ["Indicateur", "Valeur"];
  styleHeaderRow(indicatorHeader);

  const indicators = [
    ["Loyers confirmés", centsToEuros(data.summary.confirmedRentInCents)],
    ["Sorties connues", centsToEuros(data.summary.outgoingAmountInCents)],
    ["Cash-flow estimé", centsToEuros(data.summary.estimatedCashFlowInCents)],
    ["Biens inclus", data.summary.propertiesCount],
    ["Lignes exportées", data.summary.rowsCount],
  ];

  indicators.forEach(([label, value], index) => {
    const row = worksheet.getRow(9 + index);
    row.getCell(1).value = label;
    row.getCell(2).value = value;
    row.getCell(1).font = { bold: true };
    row.getCell(2).alignment = { horizontal: "right" };

    if (index <= 2) {
      row.getCell(2).numFmt = XLSX_MONEY_FORMAT;
    }
  });

  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
      };
      cell.alignment = {
        ...cell.alignment,
        vertical: "middle",
      };
    });
  });
}

function styleMovementsWorksheet(
  worksheet: ExcelJS.Worksheet,
  data: OwnerFinanceExportData,
) {
  worksheet.views = [{ state: "frozen", ySplit: 1 }];
  worksheet.columns = [
    { header: "Date", key: "date", width: 13 },
    { header: "Type", key: "type", width: 18 },
    { header: "Catégorie", key: "category", width: 26 },
    { header: "Logement", key: "propertyName", width: 32 },
    { header: "Contrat", key: "contractLabel", width: 30 },
    { header: "Locataire", key: "tenantName", width: 24 },
    { header: "Description", key: "description", width: 56 },
    { header: "Statut", key: "status", width: 28 },
    { header: "Entrée (€)", key: "entry", width: 14 },
    { header: "Sortie (€)", key: "outgoing", width: 14 },
    { header: "Montant net (€)", key: "net", width: 16 },
    { header: "Devise", key: "currency", width: 10 },
    { header: "Source RentFlow", key: "source", width: 20 },
    { header: "Identifiant interne", key: "internalId", width: 32 },
  ];

  styleHeaderRow(worksheet.getRow(1));
  worksheet.autoFilter = {
    from: "A1",
    to: "N1",
  };

  data.rows.forEach((row) => {
    const excelRow = worksheet.addRow({
      date: row.date,
      type: row.type,
      category: row.category,
      propertyName: row.propertyName,
      contractLabel: row.contractLabel,
      tenantName: row.tenantName,
      description: row.description,
      status: row.status,
      entry: centsToEuros(row.entryInCents),
      outgoing: centsToEuros(row.outgoingInCents),
      net: centsToEuros(row.netInCents),
      currency: row.currency,
      source: row.source,
      internalId: row.internalId,
    });

    excelRow.getCell("date").numFmt = XLSX_DATE_FORMAT;
    ["entry", "outgoing", "net"].forEach((key) => {
      excelRow.getCell(key).numFmt = XLSX_MONEY_FORMAT;
      excelRow.getCell(key).alignment = { horizontal: "right" };
    });

    if (row.netInCents < 0) {
      excelRow.getCell("net").font = { color: { argb: "FFB91C1C" } };
    } else if (row.netInCents > 0) {
      excelRow.getCell("net").font = { color: { argb: "FF047857" } };
    }
  });

  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.alignment = {
        ...cell.alignment,
        vertical: "middle",
        wrapText: rowNumber > 1,
      };
      cell.border = {
        bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
      };
    });
  });
}

export function buildOwnerFinanceExportWorkbook(data: OwnerFinanceExportData) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "RentFlow";
  workbook.created = data.generatedAt;
  workbook.modified = data.generatedAt;
  workbook.views = [
    {
      x: 0,
      y: 0,
      width: 16000,
      height: 9000,
      firstSheet: 0,
      activeTab: 0,
      visibility: "visible",
    },
  ];

  const summaryWorksheet = workbook.addWorksheet("Résumé", {
    properties: {
      defaultRowHeight: 22,
    },
  });
  const movementsWorksheet = workbook.addWorksheet("Mouvements", {
    properties: {
      defaultRowHeight: 22,
    },
  });

  styleSummaryWorksheet(summaryWorksheet, data);
  styleMovementsWorksheet(movementsWorksheet, data);

  return workbook;
}

export async function buildOwnerFinanceExportXlsxBuffer(
  data: OwnerFinanceExportData,
) {
  const workbook = buildOwnerFinanceExportWorkbook(data);
  const buffer = await workbook.xlsx.writeBuffer();

  return Buffer.from(buffer);
}

export async function getOwnerFinanceExportXlsx(
  period: OwnerFinanceExportPeriod,
) {
  const data = await getOwnerFinanceExportData(period);

  return {
    data,
    buffer: await buildOwnerFinanceExportXlsxBuffer(data),
    filename: `rentflow-finances-${period.filenameToken}.xlsx`,
  };
}
