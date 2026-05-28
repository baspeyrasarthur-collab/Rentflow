import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  redirect: vi.fn(),
  redirectToSignIn: vi.fn(),
  userFindUnique: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    user: {
      findUnique: mocks.userFindUnique,
    },
  },
}));

import DashboardPage from "@/app/dashboard/page";

function mockRedirects() {
  mocks.redirect.mockImplementation((href: string) => {
    throw new Error(`REDIRECT:${href}`);
  });
  mocks.redirectToSignIn.mockImplementation(() => {
    throw new Error("REDIRECT:SIGN_IN");
  });
}

describe("dashboard profile redirects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRedirects();
    mocks.auth.mockResolvedValue({
      userId: "clerk_user_1",
      redirectToSignIn: mocks.redirectToSignIn,
    });
  });

  it("redirects ADMIN users to admin space", async () => {
    mocks.userFindUnique.mockResolvedValue({
      role: "ADMIN",
      disabledAt: null,
      ownerProfile: null,
      tenantProfile: null,
    });

    await expect(DashboardPage()).rejects.toThrow("REDIRECT:/admin");
  });

  it("redirects users with only OwnerProfile to owner space", async () => {
    mocks.userFindUnique.mockResolvedValue({
      role: "OWNER",
      disabledAt: null,
      ownerProfile: { id: "owner_profile_1" },
      tenantProfile: null,
    });

    await expect(DashboardPage()).rejects.toThrow("REDIRECT:/owner");
  });

  it("redirects users with only TenantProfile to tenant space", async () => {
    mocks.userFindUnique.mockResolvedValue({
      role: "TENANT",
      disabledAt: null,
      ownerProfile: null,
      tenantProfile: { id: "tenant_profile_1" },
    });

    await expect(DashboardPage()).rejects.toThrow("REDIRECT:/tenant");
  });

  it("defaults multi-profile users to owner space for V1", async () => {
    mocks.userFindUnique.mockResolvedValue({
      role: "OWNER",
      disabledAt: null,
      ownerProfile: { id: "owner_profile_1" },
      tenantProfile: { id: "tenant_profile_1" },
    });

    await expect(DashboardPage()).rejects.toThrow("REDIRECT:/owner");
  });

  it("redirects users without profiles to onboarding", async () => {
    mocks.userFindUnique.mockResolvedValue({
      role: "OWNER",
      disabledAt: null,
      ownerProfile: null,
      tenantProfile: null,
    });

    await expect(DashboardPage()).rejects.toThrow("REDIRECT:/onboarding");
  });
});
