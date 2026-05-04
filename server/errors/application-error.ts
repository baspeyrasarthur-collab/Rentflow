export type AppErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

const statusByCode: Record<AppErrorCode, number> = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
};

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly statusCode: number;
  readonly details?: Record<string, unknown>;

  constructor(
    code: AppErrorCode,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusByCode[code];
    this.details = details;
  }
}

export type SafeErrorResponse = {
  code: AppErrorCode;
  message: string;
  statusCode: number;
};

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function toSafeErrorResponse(error: unknown): SafeErrorResponse {
  if (isAppError(error)) {
    return {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
    };
  }

  return {
    code: "INTERNAL_ERROR",
    message: "An unexpected server error occurred.",
    statusCode: 500,
  };
}
