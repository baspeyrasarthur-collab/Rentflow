import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  canAcceptContractTenant,
  canAcceptInvitation,
  canUserAcceptTenantInvitation,
  doesConnectedEmailMatchInvitationEmail,
  getInvitationByRawToken,
  prepareInvitationTokenLookup,
} from "@/server/invitations/acceptance";
import { hashInvitationToken } from "@/server/owner/invitation-token";

const mocks = vi.hoisted(() => ({
  invitationFindUnique: vi.fn(),
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    invitation: {
      findUnique: mocks.invitationFindUnique,
    },
  },
}));

describe("invitation acceptance foundations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects empty or invalid raw tokens before querying", async () => {
    expect(prepareInvitationTokenLookup("")).toBeNull();
    expect(prepareInvitationTokenLookup("short-token")).toBeNull();

    await expect(getInvitationByRawToken("")).resolves.toBeNull();
    await expect(getInvitationByRawToken(null)).resolves.toBeNull();

    expect(mocks.invitationFindUnique).not.toHaveBeenCalled();
  });

  it("uses the hashed token for lookup", async () => {
    const rawToken = "valid-token-value-that-is-long-enough-for-tests";
    const tokenHash = hashInvitationToken(rawToken);

    mocks.invitationFindUnique.mockResolvedValue({
      id: "invitation_1",
      tokenHash,
    });

    await getInvitationByRawToken(rawToken);

    expect(mocks.invitationFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tokenHash,
        },
      }),
    );
  });

  it("allows only sent and non-expired invitations", () => {
    const now = new Date("2026-06-15T10:00:00.000Z");

    expect(
      canAcceptInvitation(
        {
          status: "SENT",
          expiresAt: new Date("2026-06-15T10:00:00.000Z"),
        },
        now,
      ),
    ).toBe(true);
    expect(
      canAcceptInvitation(
        {
          status: "SENT",
          expiresAt: new Date("2026-06-15T09:59:59.999Z"),
        },
        now,
      ),
    ).toBe(false);
  });

  it("rejects invitations that are no longer sent", () => {
    const now = new Date("2026-06-15T10:00:00.000Z");
    const expiresAt = new Date("2026-06-16T10:00:00.000Z");

    expect(canAcceptInvitation({ status: "ACCEPTED", expiresAt }, now)).toBe(
      false,
    );
    expect(canAcceptInvitation({ status: "CANCELED", expiresAt }, now)).toBe(
      false,
    );
    expect(canAcceptInvitation({ status: "EXPIRED", expiresAt }, now)).toBe(
      false,
    );
  });

  it("allows owner or tenant users, but not admins, to accept tenant invitations", () => {
    expect(canUserAcceptTenantInvitation("TENANT")).toBe(true);
    expect(canUserAcceptTenantInvitation("OWNER")).toBe(true);
    expect(canUserAcceptTenantInvitation("ADMIN")).toBe(false);
  });

  it("allows invited slots and terminated historical tenants to be accepted", () => {
    expect(
      canAcceptContractTenant({
        status: "INVITED",
        tenantProfileId: null,
      }),
    ).toBe(true);
    expect(
      canAcceptContractTenant({
        status: "TERMINATED",
        tenantProfileId: "tenant_profile_1",
      }),
    ).toBe(true);
    expect(
      canAcceptContractTenant({
        status: "ACTIVE",
        tenantProfileId: null,
      }),
    ).toBe(false);
    expect(
      canAcceptContractTenant({
        status: "INVITED",
        tenantProfileId: "tenant_profile_1",
      }),
    ).toBe(false);
  });

  it("matches connected and invited emails after normalization", () => {
    expect(
      doesConnectedEmailMatchInvitationEmail(
        "  LOCATAIRE@Example.FR ",
        "locataire@example.fr",
      ),
    ).toBe(true);
    expect(
      doesConnectedEmailMatchInvitationEmail(
        "other@example.fr",
        "locataire@example.fr",
      ),
    ).toBe(false);
  });
});
