const INTERNAL_RETURN_ORIGIN = "https://rentflow.local";
const ALLOWED_RETURN_PATHS = ["/invitations/accept", "/dashboard"] as const;

export function isSafeInternalReturnTo(value: unknown) {
  if (typeof value !== "string") {
    return false;
  }

  const trimmed = value.trim();

  if (!trimmed || !trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return false;
  }

  if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(trimmed)) {
    return false;
  }

  try {
    const parsedUrl = new URL(trimmed, INTERNAL_RETURN_ORIGIN);

    if (parsedUrl.origin !== INTERNAL_RETURN_ORIGIN) {
      return false;
    }

    return ALLOWED_RETURN_PATHS.some((path) => parsedUrl.pathname === path);
  } catch {
    return false;
  }
}

export function getSafeReturnTo(value: unknown, fallback = "/dashboard") {
  return isSafeInternalReturnTo(value) ? (value as string).trim() : fallback;
}
