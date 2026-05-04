import { describe, expect, it } from "vitest";

import { AppError, isAppError, toSafeErrorResponse } from "@/server/errors";

describe("application errors", () => {
  it("maps application error codes to safe HTTP responses", () => {
    const error = new AppError("FORBIDDEN", "Access denied.", {
      reason: "role",
    });

    expect(isAppError(error)).toBe(true);
    expect(toSafeErrorResponse(error)).toEqual({
      code: "FORBIDDEN",
      message: "Access denied.",
      statusCode: 403,
    });
  });

  it("hides unknown server errors behind a safe response", () => {
    expect(toSafeErrorResponse(new Error("database secret"))).toEqual({
      code: "INTERNAL_ERROR",
      message: "An unexpected server error occurred.",
      statusCode: 500,
    });
  });
});
