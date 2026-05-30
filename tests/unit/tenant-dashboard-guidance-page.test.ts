import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const tenantPageSource = readFileSync(
  join(process.cwd(), "app/(tenant)/tenant/page.tsx"),
  "utf8",
);

describe("tenant dashboard guidance UI", () => {
  it("keeps the urgent actions section at the top of the tenant dashboard", () => {
    const todoIndex = tenantPageSource.indexOf('title="A faire maintenant"');
    const monthIndex = tenantPageSource.indexOf('title="Mon mois"');
    const rentalsIndex = tenantPageSource.indexOf('title="Mon logement"');

    expect(todoIndex).toBeGreaterThan(-1);
    expect(monthIndex).toBeGreaterThan(-1);
    expect(rentalsIndex).toBeGreaterThan(-1);
    expect(todoIndex).toBeLessThan(monthIndex);
    expect(todoIndex).toBeLessThan(rentalsIndex);
  });

  it("requires an explicit confirmation before declaring an external rent as paid", () => {
    expect(tenantPageSource).toContain('name="confirmPaid"');
    expect(tenantPageSource).toContain(
      "Je confirme avoir paye ce loyer hors RentFlow.",
    );
    expect(tenantPageSource).toContain(
      "Cette action apparait 1 jour avant l&apos;echeance prevue.",
    );
    expect(tenantPageSource).toContain(
      "Cette declaration ne confirme pas la reception.",
    );
  });

  it("does not present the mock mandate as an urgent tenant action", () => {
    const todoSection = tenantPageSource.slice(
      tenantPageSource.indexOf('title="A faire maintenant"'),
      tenantPageSource.indexOf('title="Mon mois"'),
    );

    expect(todoSection).not.toContain("mandate");
    expect(todoSection).not.toContain("mock-payment");
    expect(todoSection).not.toContain("Accepter le mandat mock");
    expect(todoSection).not.toContain("Mandat mock");
    expect(tenantPageSource).not.toContain("Accepter le mandat mock");
    expect(tenantPageSource).not.toContain("Mandat mock");
  });

  it("keeps the simulated automatic payment option clearly optional", () => {
    expect(tenantPageSource).toContain('title="Paiement automatique simule"');
    expect(tenantPageSource).toContain("Optionnel");
    expect(tenantPageSource).toContain(
      "Cette option ne concerne pas les virements",
    );
    expect(tenantPageSource).toContain(
      "Activer le paiement automatique simule",
    );
  });

  it("lets tenants mark an available receipt as seen from urgent actions", () => {
    expect(tenantPageSource).toContain("markTenantReceiptAsSeenAction");
    expect(tenantPageSource).toContain("unseenAvailableReceipts");
    expect(tenantPageSource).toContain("Marquer comme vue");
    expect(tenantPageSource).toContain('name="receiptId"');
  });

  it("keeps tenant actions short and shows a positive empty state", () => {
    expect(tenantPageSource).toContain(".slice(0, 4)");
    expect(tenantPageSource).toContain('title="Tout est a jour"');
    expect(tenantPageSource).toContain(
      "Aucune action urgente pour le moment. RentFlow vous signalera ici les prochaines informations importantes.",
    );
  });

  it("shows focused tenant quick actions without dashboard request duplication", () => {
    expect(tenantPageSource).toContain('label="Details contrat"');
    expect(tenantPageSource).toContain('label="Mettre fin a un contrat"');
    expect(tenantPageSource).toContain('label="Declarer un loyer paye"');
    expect(tenantPageSource).toContain('label="Demande proprietaire"');
    expect(tenantPageSource).toContain('href="/tenant/requests"');
    expect(tenantPageSource).toContain('href="#tenant-contract-termination"');
    expect(tenantPageSource).toContain('href="#declare-rent-paid"');
    expect(tenantPageSource).not.toContain('title="Demandes recentes"');
    expect(tenantPageSource).not.toContain(
      'description="Demandes en attente et PDFs disponibles."',
    );
  });

  it("keeps tenant dashboard cards visually aligned with the owner surface", () => {
    expect(tenantPageSource).toContain("transition-all duration-300");
    expect(tenantPageSource).toContain("hover:-translate-y-0.5");
    expect(tenantPageSource).toContain("hover:shadow-xl");
  });
});
