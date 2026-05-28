import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function readWorkspaceFile(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("support page UI wiring", () => {
  it("exposes the connected support page content and contact actions", () => {
    const pageSource = readWorkspaceFile("app/support/page.tsx");
    const copyButtonSource = readWorkspaceFile(
      "components/support/copy-support-email-button.tsx",
    );

    expect(pageSource).toContain("requireCurrentUser");
    expect(pageSource).toContain('title="Contacter RentFlow"');
    expect(pageSource).toContain(
      "mailto:contact@rentflow.fr?subject=Demande%20support%20RentFlow",
    );
    expect(pageSource).toContain("Envoyer une demande");
    expect(pageSource).toContain("Arthur Baspeyras");
    expect(pageSource).toContain("createSupportRequestAction");
    expect(copyButtonSource).toContain("navigator.clipboard");
    expect(copyButtonSource).toContain("Copier l'adresse");
    expect(copyButtonSource).toContain("Adresse copiee");
  });

  it("adds support access to owner and tenant navigation and account pages", () => {
    const appShellSource = readWorkspaceFile("components/layout/app-shell.tsx");
    const ownerAccountSource = readWorkspaceFile(
      "app/(owner)/owner/account/page.tsx",
    );
    const tenantAccountSource = readWorkspaceFile(
      "app/(tenant)/tenant/account/page.tsx",
    );

    expect(
      appShellSource.match(
        /\{ href: "\/support", label: "Support", icon: LifeBuoy \}/g,
      ),
    ).toHaveLength(2);
    expect(appShellSource).toMatch(
      /\/owner\/declarations[\s\S]+Déclarations[\s\S]+\/support[\s\S]+Support/,
    );
    expect(appShellSource).toMatch(
      /\/tenant\/account[\s\S]+Mon compte[\s\S]+\/support[\s\S]+Support/,
    );
    expect(ownerAccountSource).toContain('href="/support"');
    expect(ownerAccountSource).toContain("Contacter le support");
    expect(tenantAccountSource).toContain('href="/support"');
    expect(tenantAccountSource).toContain("Contacter le support");
  });

  it("keeps support inside the connected AppShell layout", () => {
    const layoutSource = readWorkspaceFile("app/support/layout.tsx");

    expect(layoutSource).toContain("AppShell");
    expect(layoutSource).toContain("requireCurrentUser");
    expect(layoutSource).toContain('requestHeaders.get("referer")');
    expect(layoutSource).toContain('referrer?.includes("/tenant")');
    expect(layoutSource).toContain('referrer?.includes("/owner")');
  });

  it("uses the updated support FAQ question", () => {
    const pageSource = readWorkspaceFile("app/support/page.tsx");

    expect(pageSource).not.toContain("Je n'arrive pas a acceder a mon espace");
    expect(pageSource).toContain(
      "Je ne vois pas une action attendue dans mon espace",
    );
    expect(pageSource).toContain(
      "Certaines actions apparaissent seulement quand elles sont necessaires",
    );
  });

  it("wires the spotlight effects toggle without disabling normal hovers", () => {
    const appShellSource = readWorkspaceFile("components/layout/app-shell.tsx");
    const spotlightCardSource = readWorkspaceFile(
      "components/ui/rentflow/spotlight-card.tsx",
    );
    const globalCssSource = readWorkspaceFile("app/globals.css");

    expect(appShellSource).toContain("SPOTLIGHT_EFFECTS_STORAGE_KEY");
    expect(appShellSource).toContain("toggleSpotlightEffects");
    expect(appShellSource).toContain("Desactiver les effets lumineux");
    expect(appShellSource).toContain("Activer les effets lumineux");
    expect(appShellSource).toContain("dataset.spotlightEffects");
    expect(spotlightCardSource).toContain("rentflow-spotlight-effect");
    expect(spotlightCardSource).toContain("hover:-translate-y-1");
    expect(globalCssSource).toContain(
      'html[data-spotlight-effects="off"] .rentflow-spotlight-effect',
    );
  });

  it("documents the future public demo support entry without creating it", () => {
    const currentStateSource = readWorkspaceFile("docs/current-state.md");

    expect(currentStateSource).toContain(
      "ajouter plus tard une entree Support dans la demo publique",
    );
    expect(readWorkspaceFile("app/support/page.tsx")).not.toContain(
      "demo publique",
    );
  });
});
