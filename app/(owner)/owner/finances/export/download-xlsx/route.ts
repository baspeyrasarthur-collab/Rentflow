import { NextRequest } from "next/server";

import { isAppError, toSafeErrorResponse } from "@/server/errors";
import {
  getOwnerFinanceExportXlsx,
  parseOwnerFinanceExportPeriodFromSearchParams,
} from "@/server/owner/finance-export";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const period = parseOwnerFinanceExportPeriodFromSearchParams(
      request.nextUrl.searchParams,
    );
    const { buffer, filename } = await getOwnerFinanceExportXlsx(period);

    return new Response(buffer, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
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
