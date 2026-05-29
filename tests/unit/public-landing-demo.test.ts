import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function readWorkspaceFile(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("public landing and demo entry path", () => {
  it("presents RentFlow as a guided rental management product", () => {
    const pageSource = readWorkspaceFile("app/page.tsx");

    expect(pageSource).toContain(
      "Gérez vos locations dans le bon ordre, sans oubli.",
    );
    expect(pageSource).toContain('href="/demo"');
    expect(pageSource).toContain('href="#fonctionnalites"');
    expect(pageSource).toContain('href="#demo"');
    expect(pageSource).toContain('href="#plans"');
    expect(pageSource).toContain('href="#support"');
    expect(pageSource).toContain("Voir le site");
    expect(pageSource).toContain("Créer un compte");
    expect(pageSource).toContain("Se connecter");
    expect(pageSource).toContain("Le compte locataire est gratuit.");
    expect(pageSource).toContain("Un espace propriétaire");
    expect(pageSource).toContain("Un espace locataire");
    expect(pageSource).toContain(
      "RentFlow vous emmène directement au bon endroit.",
    );
    expect(pageSource).toContain("Prêt à gérer vos locations sans stress ?");
    expect(pageSource).not.toContain(
      "Prêt à gérer vos locations sans pression ?",
    );
    expect(pageSource).not.toContain(
      "Prêt à gérer vos locations en 5 min / semaine ?",
    );
    expect(pageSource).not.toContain(
      "Prêt à gérer vos locations dans le bon ordre ?",
    );
    expect(pageSource).toContain("fixed left-0 right-0 top-3");
    expect(pageSource).toContain("ScrollReveal");
    expect(pageSource).toContain("landing-final-glow");
    expect(pageSource).toContain("landing-cta-glow");
    expect(pageSource).toContain("landing-orb");
    expect(pageSource).toContain("landing-fade-up");
    expect(pageSource).toContain("landing-float");
    expect(pageSource).toContain("landing-line-flow");
  });

  it("uses an IntersectionObserver driven scroll reveal animation", () => {
    const scrollRevealSource = readWorkspaceFile(
      "components/landing/scroll-reveal.tsx",
    );
    const globalCssSource = readWorkspaceFile("app/globals.css");

    expect(scrollRevealSource).toContain("IntersectionObserver");
    expect(scrollRevealSource).toContain("prefers-reduced-motion: reduce");
    expect(scrollRevealSource).toContain("is-visible");
    expect(globalCssSource).toContain(".landing-scroll-reveal.is-visible");
    expect(globalCssSource).toContain(".landing-scroll-left");
    expect(globalCssSource).toContain(".landing-scroll-right");
    expect(globalCssSource).toContain("prefers-reduced-motion: reduce");
  });

  it("keeps the landing free of real seeded user data", () => {
    const pageSource = readWorkspaceFile("app/page.tsx");

    expect(pageSource).not.toContain("@rentflow.test");
    expect(pageSource).not.toContain("camille.martin@example.com");
    expect(pageSource).not.toContain("tenant.one");
  });

  it("lets the demo switch between owner and tenant modes", () => {
    const demoSource = readWorkspaceFile("app/demo/page.tsx");
    const demoLayoutSource = readWorkspaceFile("app/demo/layout.tsx");

    expect(demoSource).toContain("Demo - donnees fictives");
    expect(demoSource).toContain("Voir l'espace locataire");
    expect(demoSource).toContain("Voir l'espace proprietaire");
    expect(demoSource).toContain("/demo?mode=tenant");
    expect(demoSource).toContain("Creer un compte");
    expect(demoSource).toContain("Se connecter");
    expect(demoSource).toContain("Retour presentation");
    expect(demoLayoutSource).toContain("/demo?mode=owner&page=properties");
    expect(demoLayoutSource).toContain("/demo?mode=tenant&page=requests");
    expect(demoLayoutSource).toContain("Demo - donnees fictives");
  });

  it("simulates the owner pages with fictive app data", () => {
    const demoSource = readWorkspaceFile("app/demo/page.tsx");
    const demoDataSource = readWorkspaceFile("app/demo/demo-data.ts");

    expect(demoSource).toContain("A faire maintenant");
    expect(demoSource).toContain("Liste des biens");
    expect(demoSource).toContain("Detail logement");
    expect(demoSource).toContain("Contrats");
    expect(demoSource).toContain("Paiements");
    expect(demoSource).toContain("Quittances");
    expect(demoSource).toContain("Resume financier");
    expect(demoSource).toContain("Declarations");
    expect(demoSource).toContain("Locataires actifs et demandes");
    expect(demoDataSource).toContain("Appartement Canal");
    expect(demoDataSource).toContain("Studio Republique");
    expect(demoDataSource).toContain("Maison des Pins");
    expect(demoDataSource).toContain("Lea Martin");
    expect(demoDataSource).toContain("Hugo Bernard");
    expect(demoDataSource).toContain("Camille Moreau");
  });

  it("shows fictive tenant dashboard and account pages in the public demo", () => {
    const demoSource = readWorkspaceFile("app/demo/page.tsx");
    const demoDataSource = readWorkspaceFile("app/demo/demo-data.ts");

    expect(demoSource).toContain("Declarer un loyer paye");
    expect(demoSource).toContain("Mon logement");
    expect(demoSource).toContain("Detail du contrat");
    expect(demoSource).toContain("Demandes au proprietaire");
    expect(demoSource).toContain("Mon compte");
    expect(demoDataSource).toContain("Appartement Canal");
    expect(demoDataSource).toContain("Arthur B.");
  });

  it("keeps demo actions simulated and away from protected app routes", () => {
    const demoSource = readWorkspaceFile("app/demo/page.tsx");
    const demoLayoutSource = readWorkspaceFile("app/demo/layout.tsx");

    expect(demoSource).toContain("Action simulee");
    expect(demoSource).toContain('href="/sign-up"');
    expect(demoSource).not.toContain('"use server"');
    expect(demoSource).not.toContain("requireOwnerAccess");
    expect(demoSource).not.toContain("requireTenantAccess");
    expect(demoLayoutSource).not.toContain('href="/owner');
    expect(demoLayoutSource).not.toContain('href="/tenant');
  });

  it("documents the updated public entry path", () => {
    const currentStateSource = readWorkspaceFile("docs/current-state.md");
    const plansSource = readWorkspaceFile("PLANS.md");

    expect(currentStateSource).toContain("Landing publique V1");
    expect(currentStateSource).toContain("landing -> demo");
    expect(currentStateSource).toContain(
      "basculer entre un mode proprietaire et un mode locataire",
    );
    expect(plansSource).toContain("Landing publique V1 sous `/`");
    expect(plansSource).toContain("choix du plan avant dashboard");
  });
});
