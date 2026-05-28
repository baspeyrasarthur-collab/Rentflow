import { formatMoney } from "@/lib/money";
import type { UserRole } from "@/features/auth/types";
import { DEFAULT_LOCALE } from "@/server/config/app";

type ReceiptPdfPrincipal = {
  userId: string;
  role: UserRole;
};

type ReceiptPdfAccessResource = {
  ownerUserId: string;
  tenantUserId: string;
};

export type ReceiptPdfDocumentInput = {
  propertyName: string;
  propertyAddress: string;
  tenantName: string;
  ownerName: string;
  periodStart: Date;
  periodEnd: Date;
  rentAmountInCents: number;
  chargesAmountInCents: number;
  totalAmountInCents: number;
  currency: string;
  generatedAt: Date | null;
};

const asciiMonthNames = [
  "Janvier",
  "Fevrier",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Aout",
  "Septembre",
  "Octobre",
  "Novembre",
  "Decembre",
];

function normalizeForPdfText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "")
    .trim();
}

function sanitizeFilenamePart(value: string) {
  const normalized = normalizeForPdfText(value)
    .replace(/[\\/:*?"<>|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return normalized || "Quittance";
}

function escapePdfString(value: string) {
  return normalizeForPdfText(value)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function formatPeriodLabel(periodStart: Date, periodEnd: Date) {
  return `${formatDate(periodStart)} - ${formatDate(periodEnd)}`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatMonthYear(date: Date) {
  return `${asciiMonthNames[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

function formatAmountForFilename(amountInCents: number, currency: string) {
  const euros = Math.trunc(amountInCents / 100);
  const cents = amountInCents % 100;
  const amount =
    cents === 0 ? `${euros}` : `${euros}-${String(cents).padStart(2, "0")}`;

  return `${amount} ${currency}`;
}

export function buildReceiptPdfFilename(receipt: {
  propertyName: string;
  periodStart: Date;
  totalAmountInCents: number;
  currency: string;
}) {
  return sanitizeFilenamePart(
    `Quittance - ${receipt.propertyName} - ${formatMonthYear(
      receipt.periodStart,
    )} - ${formatAmountForFilename(
      receipt.totalAmountInCents,
      receipt.currency,
    )}.pdf`,
  );
}

export function canAccessReceiptPdf(
  principal: ReceiptPdfPrincipal,
  resource: ReceiptPdfAccessResource,
) {
  return (
    principal.role === "ADMIN" ||
    principal.userId === resource.ownerUserId ||
    principal.userId === resource.tenantUserId
  );
}

function buildPdfBuffer(lines: string[]) {
  const lineCommands = lines
    .map((line, index) => {
      const command = index === 0 ? "50 790 Td" : "0 -24 Td";

      return `${command} (${escapePdfString(line)}) Tj`;
    })
    .join("\n");
  const content = `BT\n/F1 12 Tf\n${lineCommands}\nET`;
  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n",
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
    `5 0 obj\n<< /Length ${Buffer.byteLength(
      content,
      "utf8",
    )} >>\nstream\n${content}\nendstream\nendobj\n`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += object;
  }

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (const offset of offsets.slice(1)) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${
    objects.length + 1
  } /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf, "utf8");
}

export function buildRentReceiptPdfDocument(input: ReceiptPdfDocumentInput) {
  const generatedAt = input.generatedAt ?? new Date();

  return buildPdfBuffer([
    "Quittance de loyer",
    `Locataire : ${input.tenantName}`,
    `Proprietaire : ${input.ownerName}`,
    `Logement : ${input.propertyName}`,
    `Adresse : ${input.propertyAddress}`,
    `Periode : ${formatPeriodLabel(input.periodStart, input.periodEnd)}`,
    `Loyer : ${formatMoney(input.rentAmountInCents, input.currency)}`,
    `Charges : ${formatMoney(input.chargesAmountInCents, input.currency)}`,
    `Total recu : ${formatMoney(input.totalAmountInCents, input.currency)}`,
    `Date de generation : ${formatDate(generatedAt)}`,
    "Mention : le paiement complet du loyer et des charges a ete recu.",
    "Document MVP genere sans stockage reel ni signature electronique.",
  ]);
}
