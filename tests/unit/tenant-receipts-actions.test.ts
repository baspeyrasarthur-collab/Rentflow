import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auditLogCreate: vi.fn(),
  auditLogFindFirst: vi.fn(),
  receiptFindFirst: vi.fn(),
  redirect: vi.fn(),
  requireTenantAccess: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/server/auth/access", () => ({
  requireTenantAccess: mocks.requireTenantAccess,
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    auditLog: {
      create: mocks.auditLogCreate,
      findFirst: mocks.auditLogFindFirst,
    },
    receipt: {
      findFirst: mocks.receiptFindFirst,
    },
  },
}));

import { markTenantReceiptAsSeenAction } from "@/app/(tenant)/tenant/receipts/actions";

function createFormData(receiptId = "receipt_1") {
  const formData = new FormData();
  formData.set("receiptId", receiptId);

  return formData;
}

function createAvailableReceipt() {
  return {
    id: "receipt_1",
    type: "RENT_RECEIPT",
    status: "GENERATED",
    propertyId: "property_1",
    rentalContractId: "contract_1",
    contractTenantId: "contract_tenant_1",
    tenantProfileId: "tenant_profile_1",
  };
}

describe("tenant receipt seen action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireTenantAccess.mockResolvedValue({
      user: {
        id: "user_tenant",
        role: "TENANT",
      },
      tenantProfile: {
        id: "tenant_profile_1",
        userId: "user_tenant",
      },
    });
    mocks.receiptFindFirst.mockResolvedValue(createAvailableReceipt());
    mocks.auditLogFindFirst.mockResolvedValue(null);
    mocks.redirect.mockImplementation((url: string) => {
      throw Object.assign(new Error("NEXT_REDIRECT"), { url });
    });
  });

  it("marks an available tenant receipt as seen with an audit log", async () => {
    await expect(
      markTenantReceiptAsSeenAction(createFormData()),
    ).rejects.toMatchObject({
      message: "NEXT_REDIRECT",
      url: "/tenant",
    });

    expect(mocks.receiptFindFirst).toHaveBeenCalledWith({
      where: {
        id: "receipt_1",
        tenantProfileId: "tenant_profile_1",
        status: {
          in: ["GENERATED", "SENT"],
        },
      },
      select: expect.objectContaining({
        id: true,
        tenantProfileId: true,
      }),
    });
    expect(mocks.auditLogCreate).toHaveBeenCalledWith({
      data: {
        userId: "user_tenant",
        action: "receipt.seen_by_tenant",
        entityType: "Receipt",
        entityId: "receipt_1",
        metadata: {
          source: "tenant_mark_receipt_seen",
          rentalContractId: "contract_1",
          contractTenantId: "contract_tenant_1",
          tenantProfileId: "tenant_profile_1",
        },
      },
    });
    expect(mocks.redirect).toHaveBeenCalledWith("/tenant");
  });

  it("is idempotent when the receipt was already marked as seen", async () => {
    mocks.auditLogFindFirst.mockResolvedValue({ id: "audit_log_1" });

    await expect(
      markTenantReceiptAsSeenAction(createFormData()),
    ).rejects.toMatchObject({
      message: "NEXT_REDIRECT",
      url: "/tenant",
    });

    expect(mocks.auditLogCreate).not.toHaveBeenCalled();
  });

  it("refuses a receipt outside the connected tenant scope", async () => {
    mocks.receiptFindFirst.mockResolvedValue(null);

    await expect(
      markTenantReceiptAsSeenAction(createFormData("receipt_other")),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });

    expect(mocks.auditLogCreate).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
