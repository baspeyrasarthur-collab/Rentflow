import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function readWorkspaceFile(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("page readability adjustments", () => {
  it("keeps owner finances details accessible without the redundant reading note", () => {
    const source = readWorkspaceFile("app/(owner)/owner/finances/page.tsx");

    expect(source).not.toContain("Lecture du mois");
    expect(source).toContain("<details");
    expect(source).toContain("<summary");
    expect(source).toContain("Sorties par categorie");
    expect(source).toContain("Depenses detaillees");
  });

  it("replaces the finance export placeholder with Excel first and CSV fallback", () => {
    const pageSource = readWorkspaceFile(
      "app/(owner)/owner/finances/export/page.tsx",
    );
    const csvRouteSource = readWorkspaceFile(
      "app/(owner)/owner/finances/export/download/route.ts",
    );
    const xlsxRouteSource = readWorkspaceFile(
      "app/(owner)/owner/finances/export/download-xlsx/route.ts",
    );

    expect(pageSource).not.toContain("Export bientot disponible");
    expect(pageSource).not.toContain("Apercu du futur export");
    expect(pageSource).not.toContain("Detail prevu");
    expect(pageSource).not.toContain("Export PDF mensuel");
    expect(pageSource).not.toContain("Export annuel plus tard");
    expect(pageSource).toContain("Télécharger l&apos;export Excel");
    expect(pageSource).toContain("Télécharger le CSV");
    expect(pageSource).toContain("Aperçu de l'export");
    expect(pageSource).toContain("Cet export est préparé");
    expect(csvRouteSource).toContain("text/csv; charset=utf-8");
    expect(xlsxRouteSource).toContain(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    expect(xlsxRouteSource).toContain("Content-Disposition");
    expect(xlsxRouteSource).toContain("attachment");
  });

  it("uses a collapsible personalized advice section on declarations", () => {
    const source = readWorkspaceFile("app/(owner)/owner/declarations/page.tsx");

    expect(source).not.toContain("Conseils personnalisés à vérifier");
    expect(source).toContain("Conseils personnalisés");
    expect(source).toContain("<details");
    expect(source).toContain("Voir les conseils personnalisés");
    expect(source).not.toContain(
      "Ce montant est calculé à partir des loyers confirmés comme reçus",
    );
  });

  it("keeps declarations missing data actionable without misleading fiscal-type tasks", () => {
    const declarationsSource = readWorkspaceFile(
      "app/(owner)/owner/declarations/page.tsx",
    );
    const propertyEditSource = readWorkspaceFile(
      "app/(owner)/owner/properties/[id]/edit/page.tsx",
    );

    expect(declarationsSource).not.toContain(
      'actionLabel: "Voir les logements"',
    );
    expect(declarationsSource).not.toContain("Type fiscal à vérifier");
    expect(declarationsSource).toContain(
      'href: "/owner/account?focus=personal-info"',
    );
    expect(propertyEditSource).toContain('focus === "fiscal-type"');
    expect(propertyEditSource).toContain('id="furnished"');
    expect(propertyEditSource).toContain(
      "Action ciblee : indiquez le type fiscal du logement",
    );
  });

  it("removes redundant account explanations while keeping personal information forms", () => {
    const ownerSource = readWorkspaceFile("app/(owner)/owner/account/page.tsx");
    const tenantSource = readWorkspaceFile(
      "app/(tenant)/tenant/account/page.tsx",
    );

    expect(ownerSource).not.toContain("Compte multi-profils");
    expect(ownerSource).not.toContain(
      "Des donnees facultatives rattachees a votre User",
    );
    expect(tenantSource).not.toContain(
      "Des donnees facultatives rattachees au meme User",
    );
    expect(ownerSource).toContain("PersonalInfoForm");
    expect(tenantSource).toContain("PersonalInfoForm");
  });
});
