import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function readWorkspaceFile(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("profile image UI wiring", () => {
  it("passes the connected user profile image to the shared AppShell", () => {
    const ownerLayoutSource = readWorkspaceFile("app/(owner)/owner/layout.tsx");
    const tenantLayoutSource = readWorkspaceFile(
      "app/(tenant)/tenant/layout.tsx",
    );
    const appShellSource = readWorkspaceFile("components/layout/app-shell.tsx");

    expect(ownerLayoutSource).toContain(
      "avatarUrl={access.user.profileImageUrl}",
    );
    expect(tenantLayoutSource).toContain(
      "avatarUrl={access.user.profileImageUrl}",
    );
    expect(appShellSource).toContain("avatarUrl?: string | null");
    expect(appShellSource).toContain("src={avatarUrl}");
    expect(appShellSource).toContain("getInitials(displayName ?? roleLabel)");
  });

  it("keeps profile image upload controls on account pages only", () => {
    const ownerAccountSource = readWorkspaceFile(
      "app/(owner)/owner/account/page.tsx",
    );
    const tenantAccountSource = readWorkspaceFile(
      "app/(tenant)/tenant/account/page.tsx",
    );
    const appShellSource = readWorkspaceFile("components/layout/app-shell.tsx");

    expect(ownerAccountSource).toContain(
      "updateOwnerAccountProfileImageAction",
    );
    expect(ownerAccountSource).toContain(
      "removeOwnerAccountProfileImageAction",
    );
    expect(tenantAccountSource).toContain(
      "updateTenantAccountProfileImageAction",
    );
    expect(tenantAccountSource).toContain(
      "removeTenantAccountProfileImageAction",
    );
    expect(appShellSource).not.toContain("ProfileImageAction");
  });

  it("uses an inline confirmation instead of a visible removal checkbox", () => {
    const ownerAccountSource = readWorkspaceFile(
      "app/(owner)/owner/account/page.tsx",
    );
    const tenantAccountSource = readWorkspaceFile(
      "app/(tenant)/tenant/account/page.tsx",
    );
    const confirmSource = readWorkspaceFile(
      "components/account/profile-image-remove-confirm.tsx",
    );

    expect(ownerAccountSource).toContain("ProfileImageRemoveConfirm");
    expect(tenantAccountSource).toContain("ProfileImageRemoveConfirm");
    expect(ownerAccountSource).not.toContain(
      "Je confirme vouloir supprimer ma photo de profil.",
    );
    expect(tenantAccountSource).not.toContain(
      "Je confirme vouloir supprimer ma photo de profil.",
    );
    expect(confirmSource).toContain("Supprimer la photo de profil ?");
    expect(confirmSource).toContain("Oui");
    expect(confirmSource).toContain("Non");
    expect(confirmSource).toContain('name="confirmRemoveProfileImage"');
    expect(confirmSource).toContain('type="hidden"');
    expect(confirmSource).toContain('value="on"');
  });
});
