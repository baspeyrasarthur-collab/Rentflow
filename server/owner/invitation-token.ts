import { createHash, randomBytes } from "node:crypto";

export const INVITATION_TOKEN_BYTES = 32;
export const INVITATION_EXPIRATION_DAYS = 14;

export function generateInvitationToken() {
  return randomBytes(INVITATION_TOKEN_BYTES).toString("base64url");
}

export function hashInvitationToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function getDefaultInvitationExpiresAt(referenceDate = new Date()) {
  return new Date(
    referenceDate.getTime() + INVITATION_EXPIRATION_DAYS * 24 * 60 * 60 * 1000,
  );
}
