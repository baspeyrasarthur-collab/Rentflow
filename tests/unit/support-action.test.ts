import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auditLogCreate: vi.fn(),
  redirect: vi.fn(),
  requireCurrentUser: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/server/auth/current-user", () => ({
  requireCurrentUser: mocks.requireCurrentUser,
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    auditLog: {
      create: mocks.auditLogCreate,
    },
  },
}));

import { createSupportRequestAction } from "@/app/support/actions";

function buildSupportFormData(overrides: Record<string, string> = {}) {
  const formData = new FormData();

  formData.set("subject", overrides.subject ?? "Question sur mon espace");
  formData.set("category", overrides.category ?? "TECHNICAL_ISSUE");
  formData.set(
    "message",
    overrides.message ??
      "Je rencontre un blocage precis sur mon espace RentFlow.",
  );

  return formData;
}

describe("support request action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireCurrentUser.mockResolvedValue({
      id: "user_1",
      email: "user@example.com",
      role: "OWNER",
    });
    mocks.auditLogCreate.mockResolvedValue({ id: "audit_log_1" });
    mocks.redirect.mockImplementation((url: string) => {
      throw Object.assign(new Error("NEXT_REDIRECT"), { url });
    });
  });

  it("validates a support request, writes an AuditLog and redirects", async () => {
    await expect(
      createSupportRequestAction(buildSupportFormData()),
    ).rejects.toMatchObject({
      message: "NEXT_REDIRECT",
      url: "/support?sent=1",
    });

    expect(mocks.requireCurrentUser).toHaveBeenCalled();
    expect(mocks.auditLogCreate).toHaveBeenCalledWith({
      data: {
        userId: "user_1",
        action: "support.request_created",
        entityType: "User",
        entityId: "user_1",
        metadata: {
          source: "support_page",
          category: "TECHNICAL_ISSUE",
          subject: "Question sur mon espace",
          messagePreview:
            "Je rencontre un blocage precis sur mon espace RentFlow.",
        },
      },
    });
  });

  it("stores only a short message preview", async () => {
    const longMessage = "a".repeat(260);

    await expect(
      createSupportRequestAction(
        buildSupportFormData({
          message: longMessage,
        }),
      ),
    ).rejects.toMatchObject({
      message: "NEXT_REDIRECT",
      url: "/support?sent=1",
    });

    expect(mocks.auditLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          metadata: expect.objectContaining({
            messagePreview: `${"a".repeat(197)}...`,
          }),
        }),
      }),
    );
  });

  it("rejects invalid support request data before creating an AuditLog", async () => {
    await expect(
      createSupportRequestAction(
        buildSupportFormData({
          category: "EMAIL_PROVIDER",
          message: "Trop court",
          subject: "No",
        }),
      ),
    ).rejects.toThrow("Invalid support request.");

    expect(mocks.auditLogCreate).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
