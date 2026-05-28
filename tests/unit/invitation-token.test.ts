import { describe, expect, it } from "vitest";

import {
  generateInvitationToken,
  getDefaultInvitationExpiresAt,
  hashInvitationToken,
  INVITATION_EXPIRATION_DAYS,
} from "@/server/owner/invitation-token";

describe("invitation token helpers", () => {
  it("generates distinct raw tokens", () => {
    expect(generateInvitationToken()).not.toBe(generateInvitationToken());
  });

  it("hashes the same token consistently", () => {
    const token = "stable-test-token";

    expect(hashInvitationToken(token)).toBe(hashInvitationToken(token));
  });

  it("does not include the raw token in the hash", () => {
    const token = "raw-token-that-must-not-be-stored";
    const hash = hashInvitationToken(token);

    expect(hash).not.toContain(token);
    expect(hash).toHaveLength(64);
  });

  it("computes the default expiration around fourteen days later", () => {
    const referenceDate = new Date("2026-06-01T10:00:00.000Z");
    const expiresAt = getDefaultInvitationExpiresAt(referenceDate);
    const diffInDays =
      (expiresAt.getTime() - referenceDate.getTime()) / (24 * 60 * 60 * 1000);

    expect(diffInDays).toBe(INVITATION_EXPIRATION_DAYS);
  });
});
