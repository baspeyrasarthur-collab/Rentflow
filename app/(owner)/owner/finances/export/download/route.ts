import { NextRequest } from "next/server";

import {
  getOwnerFinanceExportCsv,
  parseOwnerFinanceExportPeriodFromSearchParams,
} from "@/server/owner/finance-export";
import { isAppError, toSafeErrorResponse } from "@/server/errors";

export async function GET(request: NextRequest) {
  try {
    const period = parseOwnerFinanceExportPeriodFromSearchParams(
      request.nextUrl.searchParams,
    );
    const { csv, filename } = await getOwnerFinanceExportCsv(period);

    return new Response(`\uFEFF${csv}`, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type": "text/csv; charset=utf-8",
      },
    });
  } catch (error) {
    if (isAppError(error)) {
      const safeError = toSafeErrorResponse(error);

      return Response.json(safeError, {
        status: safeError.statusCode,
      });
    }

    throw error;
  }
}
