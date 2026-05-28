import { readFileSync } from "node:fs";
import { join } from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  ownerProfileFindUnique: vi.fn(),
  requireTenantAccess: vi.fn(),
}));

vi.mock("@/server/auth/access", () => ({
  requireTenantAccess: mocks.requireTenantAccess,
}));

vi.mock("@/server/auth/current-user", () => ({
  redirectAfterRoleAccessError: vi.fn((error) => {
    throw error;
  }),
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    ownerProfile: {
      findUnique: mocks.ownerProfileFindUnique,
    },
  },
}));

import TenantAccountPage from "@/app/(tenant)/tenant/account/page";

function collectText(node: unknown): string {
  if (node === null || node === undefined || typeof node === "boolean") {
    return "";
  }

  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(collectText).join(" ");
  }

  if (typeof node === "object") {
    const props = (node as { props?: Record<string, unknown> }).props;

    return [
      props?.eyebrow,
      props?.title,
      props?.description,
      props?.label,
      props?.value,
      props?.hint,
      props?.children,
    ]
      .map(collectText)
      .join(" ");
  }

  return "";
}

function collectHrefs(node: unknown): string[] {
  if (node === null || node === undefined || typeof node === "boolean") {
    return [];
  }

  if (Array.isArray(node)) {
    return node.flatMap(collectHrefs);
  }

  if (typeof node === "object") {
    const props = (node as { props?: Record<string, unknown> }).props;
    const href = typeof props?.href === "string" ? [props.href] : [];

    return [...href, ...collectHrefs(props?.children)];
  }

  return [];
}

describe("tenant account page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireTenantAccess.mockResolvedValue({
      user: {
        id: "user_multi",
        email: "multi@example.com",
        firstName: "Arthur",
        lastName: "Martin",
        profileImageUrl: null,
        profileImageStorageKey: null,
        role: "TENANT",
      },
      tenantProfile: {
        id: "tenant_profile_1",
        userId: "user_multi",
      },
    });
  });

  it("shows tenant space and owner switch when OwnerProfile exists", async () => {
    mocks.ownerProfileFindUnique.mockResolvedValue({
      id: "owner_profile_1",
    });

    const page = await TenantAccountPage();
    const text = collectText(page);
    const hrefs = collectHrefs(page);

    expect(text).toContain("Mon compte");
    expect(text).toContain("Compte locataire");
    expect(text).toContain("Espace locataire disponible");
    expect(text).toContain("Changer d'espace");
    expect(text).toContain("Informations personnelles");
    expect(text).toContain("Espace proprietaire");
    expect(text).toContain("Disponible");
    expect(text).toContain("Ouvrir l'espace proprietaire");
    expect(text).toContain("Ajouter une photo");
    expect(text).toContain("Gérer mes identifiants");
    expect(text).toContain(
      "Vos identifiants sont sécurisés par l'espace d'authentification",
    );
    expect(text).not.toContain(
      "RentFlow ne propose pas de modification email ou mot de passe depuis cette page",
    );
    expect(hrefs).toContain("/tenant");
    expect(hrefs).toContain("/owner");
    expect(hrefs).toContain("/account/security");
  });

  it("shows owner space as inactive without a creation button", async () => {
    mocks.ownerProfileFindUnique.mockResolvedValue(null);

    const page = await TenantAccountPage();
    const text = collectText(page);
    const hrefs = collectHrefs(page);

    expect(text).toContain("Espace proprietaire");
    expect(text).toContain("Non active");
    expect(text).toContain(
      "Vous pourrez creer un espace proprietaire depuis le parcours proprietaire.",
    );
    expect(text).not.toContain("Creer mon espace proprietaire");
    expect(hrefs).toContain("/tenant");
    expect(hrefs).not.toContain("/owner");
  });

  it("shows profile image replacement and removal controls when a photo exists", async () => {
    mocks.requireTenantAccess.mockResolvedValue({
      user: {
        id: "user_multi",
        email: "multi@example.com",
        firstName: "Arthur",
        lastName: "Martin",
        profileImageUrl: "/uploads/profiles/user_multi.jpg",
        profileImageStorageKey: "user_multi.jpg",
        role: "TENANT",
      },
      tenantProfile: {
        id: "tenant_profile_1",
        userId: "user_multi",
      },
    });
    mocks.ownerProfileFindUnique.mockResolvedValue(null);

    const page = await TenantAccountPage();
    const text = collectText(page);

    expect(text).toContain("Remplacer la photo");
    expect(text).toContain("Configuree");
  });

  it("loads only the owner profile for the connected tenant user", async () => {
    mocks.ownerProfileFindUnique.mockResolvedValue(null);

    await TenantAccountPage();

    expect(mocks.ownerProfileFindUnique).toHaveBeenCalledWith({
      where: {
        userId: "user_multi",
      },
      select: {
        id: true,
      },
    });
  });
});

describe("tenant navigation", () => {
  it("contains the tenant account link", () => {
    const source = readFileSync(
      join(process.cwd(), "components/layout/app-shell.tsx"),
      "utf8",
    );

    expect(source).toContain('href: "/tenant/account"');
    expect(source).toContain('label: "Mon compte"');
    expect(source).toContain("avatarUrl");
  });

  it("uses the shared optional personal information form", () => {
    const source = readFileSync(
      join(process.cwd(), "components/account/personal-info-form.tsx"),
      "utf8",
    );

    expect(source).toContain("Enregistrer les informations");
    expect(source).toContain("Facultatif");
    expect(source).toContain("taxResidenceCountry");
  });
});
