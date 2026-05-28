import { readFileSync } from "node:fs";
import { join } from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  ownerProfileFindUnique: vi.fn(),
  requireOwnerAccess: vi.fn(),
  tenantProfileFindUnique: vi.fn(),
}));

vi.mock("@/server/auth/access", () => ({
  requireOwnerAccess: mocks.requireOwnerAccess,
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
    tenantProfile: {
      findUnique: mocks.tenantProfileFindUnique,
    },
  },
}));

import OwnerAccountPage from "@/app/(owner)/owner/account/page";

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

describe("owner account space switcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireOwnerAccess.mockResolvedValue({
      user: {
        id: "user_multi",
        email: "multi@example.com",
        firstName: "Arthur",
        lastName: "Martin",
        profileImageUrl: null,
        profileImageStorageKey: null,
        role: "OWNER",
      },
      ownerProfile: {
        id: "owner_profile_1",
        userId: "user_multi",
        plan: "FREE",
      },
    });
    mocks.ownerProfileFindUnique.mockResolvedValue({
      billingName: "Arthur Martin",
      plan: "FREE",
    });
  });

  it("shows owner and tenant spaces when a TenantProfile exists", async () => {
    mocks.tenantProfileFindUnique.mockResolvedValue({
      id: "tenant_profile_1",
    });

    const page = await OwnerAccountPage();
    const text = collectText(page);
    const hrefs = collectHrefs(page);

    expect(text).toContain("Changer d'espace");
    expect(text).toContain("Plan");
    expect(text).toContain("FREE");
    expect(text).toContain("Informations personnelles");
    expect(text).toContain("Espace proprietaire");
    expect(text).toContain("Espace locataire");
    expect(text).toContain("Disponible");
    expect(text).toContain("Ouvrir l'espace locataire");
    expect(text).toContain("Ajouter une photo");
    expect(text).toContain("Gérer mes identifiants");
    expect(text).toContain(
      "Vos identifiants sont sécurisés par l'espace d'authentification",
    );
    expect(text).not.toContain(
      "RentFlow ne propose pas de mutation email ou mot de passe custom depuis cette page",
    );
    expect(text).not.toContain("Creer mon espace locataire gratuit");
    expect(hrefs).toContain("/owner");
    expect(hrefs).toContain("/tenant");
    expect(hrefs).toContain("/account/security");
  });

  it("shows tenant space creation when TenantProfile is missing", async () => {
    mocks.tenantProfileFindUnique.mockResolvedValue(null);

    const page = await OwnerAccountPage();
    const text = collectText(page);
    const hrefs = collectHrefs(page);

    expect(text).toContain("Changer d'espace");
    expect(text).toContain("Non active");
    expect(text).toContain("Creer mon espace locataire gratuit");
    expect(text).toContain("Photo de profil");
    expect(text).not.toContain("Non requises aujourd'hui");
    expect(text).toContain("Votre espace proprietaire restera inchange");
    expect(text).toContain("meme email et le meme mot de passe");
    expect(hrefs).toContain("/owner");
    expect(hrefs).not.toContain("/tenant");
  });

  it("shows profile image replacement and removal controls when a photo exists", async () => {
    mocks.requireOwnerAccess.mockResolvedValue({
      user: {
        id: "user_multi",
        email: "multi@example.com",
        firstName: "Arthur",
        lastName: "Martin",
        profileImageUrl: "/uploads/profiles/user_multi.jpg",
        profileImageStorageKey: "user_multi.jpg",
        role: "OWNER",
      },
      ownerProfile: {
        id: "owner_profile_1",
        userId: "user_multi",
        plan: "FREE",
      },
    });
    mocks.tenantProfileFindUnique.mockResolvedValue(null);

    const page = await OwnerAccountPage();
    const text = collectText(page);

    expect(text).toContain("Remplacer la photo");
    expect(text).toContain("Configuree");
  });

  it("keeps account summary compact and supports personal-info focus", () => {
    const ownerSource = readFileSync(
      join(process.cwd(), "app/(owner)/owner/account/page.tsx"),
      "utf8",
    );
    const formSource = readFileSync(
      join(process.cwd(), "components/account/personal-info-form.tsx"),
      "utf8",
    );

    expect(ownerSource).toContain("lg:grid-cols-2");
    expect(ownerSource).toContain('=== "personal-info"');
    expect(formSource).toContain("Enregistrer les informations");
    expect(formSource).toContain("Action ciblee");
  });

  it("provides a Clerk account security page instead of custom password handling", () => {
    const source = readFileSync(
      join(process.cwd(), "app/account/security/[[...user-profile]]/page.tsx"),
      "utf8",
    );

    expect(source).toContain("UserProfile");
    expect(source).toContain('path="/account/security"');
    expect(source).toContain('routing="path"');
  });
});
