import { readFileSync } from "node:fs";
import { join } from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  rentalContractFindFirst: vi.fn(),
  requireTenantAccess: vi.fn(),
}));

vi.mock("@/server/auth/access", () => ({
  requireTenantAccess: mocks.requireTenantAccess,
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    rentalContract: {
      findFirst: mocks.rentalContractFindFirst,
    },
  },
}));

import { getTenantContractDetail } from "@/server/tenant/contracts";

describe("tenant contract detail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireTenantAccess.mockResolvedValue({
      user: {
        id: "user_tenant",
        email: "tenant@example.com",
      },
      tenantProfile: {
        id: "tenant_profile_1",
      },
    });
    mocks.rentalContractFindFirst.mockResolvedValue({
      id: "contract_1",
      totalRentAmountInCents: 98000,
      totalChargesAmountInCents: 12050,
      contractTenants: [
        {
          id: "contract_tenant_1",
          tenantProfileId: "tenant_profile_1",
        },
      ],
      payments: [],
      receipts: [],
    });
  });

  it("loads a contract only when it belongs to the connected tenant profile", async () => {
    await expect(getTenantContractDetail("contract_1")).resolves.toMatchObject({
      id: "contract_1",
      totalRentAmountInCents: 98000,
      totalChargesAmountInCents: 12050,
    });

    expect(mocks.rentalContractFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "contract_1",
          contractTenants: {
            some: {
              tenantProfileId: "tenant_profile_1",
            },
          },
        },
        select: expect.objectContaining({
          property: {
            select: expect.objectContaining({
              imageUrl: true,
            }),
          },
        }),
      }),
    );
  });

  it("refuses contracts from another tenant profile", async () => {
    mocks.rentalContractFindFirst.mockResolvedValue(null);

    await expect(
      getTenantContractDetail("contract_other"),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("keeps the tenant detail page read-only and links from the tenant dashboard", () => {
    const detailPageSource = readFileSync(
      join(
        process.cwd(),
        "app/(tenant)/tenant/contracts/[contractId]/page.tsx",
      ),
      "utf8",
    );
    const dashboardSource = readFileSync(
      join(process.cwd(), "app/(tenant)/tenant/page.tsx"),
      "utf8",
    );

    expect(detailPageSource).toContain("lecture seule");
    expect(detailPageSource).toContain("ContractPropertyImage");
    expect(detailPageSource).toContain("imageUrl={contract.property.imageUrl}");
    expect(detailPageSource).not.toContain("<form");
    expect(detailPageSource).not.toContain("Modifier");
    expect(dashboardSource).toContain("TenantPropertyImage");
    expect(dashboardSource).toContain("imageUrl={property.imageUrl}");
    expect(dashboardSource).not.toContain("updateOwnerPropertyImageAction");
    expect(dashboardSource).toContain("Voir le contrat");
    expect(dashboardSource).toContain("Voir l&apos;historique du contrat");
    expect(dashboardSource).toContain("/tenant/contracts/");
  });
});
