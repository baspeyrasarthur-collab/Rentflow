import { NextResponse } from "next/server";

import { isAppError } from "@/server/errors";
import {
  buildReceiptPdfFilename,
  buildRentReceiptPdfDocument,
} from "@/server/receipts/pdf-data";
import {
  getPersonDisplayName,
  getPropertyAddressLabel,
  getReceiptForPdf,
} from "@/server/receipts/pdf";

function escapeContentDispositionFilename(filename: string) {
  return filename.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { receipt } = await getReceiptForPdf(id);
    const filename = buildReceiptPdfFilename({
      propertyName: receipt.property.name,
      periodStart: receipt.periodStart,
      totalAmountInCents: receipt.totalAmountInCents,
      currency: receipt.currency,
    });
    const pdf = buildRentReceiptPdfDocument({
      propertyName: receipt.property.name,
      propertyAddress: getPropertyAddressLabel(receipt.property),
      tenantName: getPersonDisplayName(receipt.tenantProfile.user),
      ownerName: getPersonDisplayName(receipt.ownerProfile.user),
      periodStart: receipt.periodStart,
      periodEnd: receipt.periodEnd,
      rentAmountInCents: receipt.rentAmountInCents,
      chargesAmountInCents: receipt.chargesAmountInCents,
      totalAmountInCents: receipt.totalAmountInCents,
      currency: receipt.currency,
      generatedAt: receipt.generatedAt,
    });

    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${escapeContentDispositionFilename(
          filename,
        )}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        { message: error.message },
        { status: error.statusCode },
      );
    }

    throw error;
  }
}
