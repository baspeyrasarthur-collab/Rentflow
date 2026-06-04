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
    expect(pageSource).toContain("Prêt à gérer vos locations sans pression ?");
    expect(pageSource).not.toContain(
      "Prêt à gérer vos locations sans stress ?",
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
    expect(pageSource).toContain("LandingThemeToggle");
    expect(pageSource).toContain("Fonctionnalités incluses");
    expect(pageSource).toContain("landing-plan-details");
    expect(pageSource).toContain("ChevronDown");
    expect(pageSource).toContain("Free");
    expect(pageSource).toContain("Pro");
    expect(pageSource).toContain("Scale");
    expect(pageSource).toContain("Le plus adapté");
    expect(pageSource).toContain("Multi-biens");
    expect(pageSource).toContain("Premières actions à faire");
    expect(pageSource).toContain("Gestion de plusieurs biens");
    expect(pageSource).toContain("Support renforcé");
    expect(pageSource).toContain("Organisation avancée multi-biens");
    expect(pageSource).toContain("Vue consolidée du portefeuille");
    expect(pageSource).toContain("tracking-[-0.06em]");
    expect(pageSource).toContain("BrandLogo");
    expect(pageSource).not.toContain("Contacter mon propriétaire");
    expect(pageSource).not.toContain(
      "Une demande claire, sans chat ni pièces jointes en V1.",
    );
  });

  it("keeps the public landing theme toggle available", () => {
    const themeToggleSource = readWorkspaceFile(
      "components/landing/theme-toggle.tsx",
    );

    expect(themeToggleSource).toContain("Activer le mode clair");
    expect(themeToggleSource).toContain("Activer le mode sombre");
    expect(themeToggleSource).toContain("rentflow-theme");
    expect(themeToggleSource).toContain("var(--landing-text)");
  });

  it("defines a readable light and dark landing palette", () => {
    const pageSource = readWorkspaceFile("app/page.tsx");
    const globalCssSource = readWorkspaceFile("app/globals.css");

    expect(pageSource).toContain("landing-page");
    expect(pageSource).toContain("bg-[var(--landing-bg)]");
    expect(pageSource).toContain("text-[var(--landing-text)]");
    expect(pageSource).toContain("bg-[var(--landing-nav-bg)]");
    expect(globalCssSource).toContain("--landing-bg: #eef7f5");
    expect(globalCssSource).toContain("--landing-text: #0b1f26");
    expect(globalCssSource).toContain(".dark .landing-page");
    expect(globalCssSource).toContain("--landing-bg: #071a20");
    expect(globalCssSource).toContain(".landing-plan-details[open]");
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
    const demoHeaderSource = demoSource.slice(
      demoSource.indexOf("function DemoHeader"),
      demoSource.indexOf("function DemoNotice"),
    );
    const desktopTopbarSource = demoLayoutSource.slice(
      demoLayoutSource.indexOf('className="sticky top-4'),
      demoLayoutSource.indexOf('<div className="mx-auto'),
    );

    expect(demoSource).toContain("DÃ©mo â€” donnÃ©es fictives");
    expect(demoHeaderSource).toContain("CrÃ©er un compte");
    expect(demoHeaderSource).toContain("Se connecter");
    expect(demoHeaderSource).not.toContain("Retour prÃ©sentation");
    expect(demoHeaderSource).not.toContain("RÃ©initialiser la dÃ©mo");
    expect(demoHeaderSource).not.toContain("Voir la dÃ©mo locataire");
    expect(demoHeaderSource).not.toContain("Voir la dÃ©mo propriÃ©taire");
    expect(readWorkspaceFile("app/demo/demo-interactions.tsx")).toContain(
      "Réinitialiser la démo",
    );
    expect(demoLayoutSource).toContain("/demo?mode=owner&page=properties");
    expect(demoLayoutSource).toContain("/demo?mode=tenant&page=requests");
    expect(demoLayoutSource).toContain("/demo?mode=tenant&page=dashboard");
    expect(demoLayoutSource).toContain("/demo?mode=owner&page=dashboard");
    expect(demoLayoutSource).toContain("Démo — données fictives");
    expect(demoLayoutSource).toContain("Voir la démo locataire");
    expect(demoLayoutSource).toContain("Voir la démo propriétaire");
    expect(demoLayoutSource).toContain("DemoResetButton");
    expect(demoLayoutSource).toContain("Essayez avec vos données");
    expect(demoLayoutSource).toContain("min-h-0 flex-1 overflow-y-auto");
    expect(demoLayoutSource).toContain("mt-auto shrink-0");
    expect(desktopTopbarSource).toContain('href="/sign-in"');
    expect(desktopTopbarSource).toContain('href="/sign-up"');
    expect(desktopTopbarSource).not.toContain("DemoResetButton");
    expect(desktopTopbarSource).not.toContain("Retour prÃ©sentation");
    expect(desktopTopbarSource).not.toContain("switchHref");
  });

  it("keeps demo actions local and resettable", () => {
    const demoSource = readWorkspaceFile("app/demo/page.tsx");
    const interactionsSource = readWorkspaceFile(
      "app/demo/demo-interactions.tsx",
    );

    expect(interactionsSource).toContain('"use client"');
    expect(interactionsSource).toContain("useState");
    expect(interactionsSource).toContain("rentflow-demo-reset");
    expect(interactionsSource).toContain("DemoSimulatedAction");
    expect(interactionsSource).toContain("DemoTenantRequestComposer");
    expect(interactionsSource).toContain("Aucune donnée réelle");
    expect(demoSource).toContain("Confirmer un loyer dÃ©clarÃ© payÃ©");
    expect(demoSource).toContain("Confirmer la rÃ©ception");
    expect(demoSource).toContain("GÃ©nÃ©rer la quittance");
    expect(demoSource).toContain("Fait");
    expect(demoSource).toContain("RefusÃ©");
    expect(demoSource).toContain("Demander la fin du contrat");
    expect(interactionsSource).toContain("Envoyer la demande (simulation)");
    expect(demoSource).toContain("Informations enregistrÃ©es dans la dÃ©mo");
  });

  it("shares the owner dashboard presentation between real app and demo", () => {
    const ownerPageSource = readWorkspaceFile("app/(owner)/owner/page.tsx");
    const demoSource = readWorkspaceFile("app/demo/page.tsx");
    const ownerDashboardViewSource = readWorkspaceFile(
      "components/owner/owner-dashboard-view.tsx",
    );

    expect(ownerPageSource).toContain("OwnerDashboardView");
    expect(ownerPageSource).toContain("getOwnerDashboardData");
    expect(ownerPageSource).toContain("getOwnerNextActions");
    expect(ownerPageSource).toContain(
      'addPropertyHref="/owner/properties/new"',
    );
    expect(ownerPageSource).toContain('financeHref="/owner/finances"');
    expect(demoSource).toContain("OwnerDashboardView");
    expect(demoSource).toContain("usesSharedOwnerDashboard");
    expect(demoSource).toContain('addPropertyHref="/sign-up"');
    expect(demoSource).toContain(
      'financeHref="/demo?mode=owner&page=finances"',
    );
    expect(demoSource).toContain("DemoSimulatedAction");
    expect(ownerDashboardViewSource).toContain("PageHeader");
    expect(ownerDashboardViewSource).toContain("A faire maintenant");
    expect(ownerDashboardViewSource).toContain("Recapitulatif du mois");
    expect(ownerDashboardViewSource).toContain("Mes biens");
    expect(ownerDashboardViewSource).toContain("Activite recente");
    expect(ownerDashboardViewSource).toContain("Actions rapides");
    expect(ownerDashboardViewSource).toContain("OwnerQuickActions");
    expect(ownerDashboardViewSource).not.toContain("requireOwnerAccess");
    expect(ownerDashboardViewSource).not.toContain("getOwnerDashboardData");
    expect(ownerDashboardViewSource).not.toContain("getOwnerNextActions");
    expect(ownerDashboardViewSource).not.toContain("prisma");
  });

  it("simulates the owner pages with fictive app data", () => {
    const demoSource = readWorkspaceFile("app/demo/page.tsx");
    const demoDataSource = readWorkspaceFile("app/demo/demo-data.ts");
    const ownerDashboardViewSource = readWorkspaceFile(
      "components/owner/owner-dashboard-view.tsx",
    );

    expect(ownerDashboardViewSource).toContain("A faire maintenant");
    expect(demoSource).toContain("Ajouter un logement");
    expect(demoSource).toContain("Mettre Ã  jour les loyers");
    expect(demoSource).toContain("GÃ©nÃ©rer une quittance");
    expect(demoSource).toContain("Modifier les contrats");
    expect(demoSource).toContain("Inviter un locataire");
    expect(demoSource).toContain("Exporter mes finances");
    expect(demoSource).toContain("Liste des biens");
    expect(demoSource).toContain("DÃ©tail logement");
    expect(demoSource).toContain("Photo du logement");
    expect(demoSource).toContain("Adresse");
    expect(demoSource).toContain("CaractÃ©ristiques");
    expect(demoSource).toContain("Contrats");
    expect(demoSource).toContain("Paiements");
    expect(demoSource).toContain("Quittances");
    expect(demoSource).toContain("RÃ©sumÃ© financier");
    expect(demoSource).toContain("DÃ©clarations");
    expect(demoSource).toContain("Locataires actifs et demandes");
    expect(demoDataSource).toContain("Appartement Canal");
    expect(demoDataSource).toContain("Studio République");
    expect(demoDataSource).toContain("Maison des Pins");
    expect(demoDataSource).toContain("Léa Martin");
    expect(demoDataSource).toContain("Hugo Bernard");
    expect(demoDataSource).toContain("Camille Moreau");
  });

  it("shows fictive tenant dashboard and account pages in the public demo", () => {
    const demoSource = readWorkspaceFile("app/demo/page.tsx");
    const demoDataSource = readWorkspaceFile("app/demo/demo-data.ts");
    const tenantDashboardViewSource = readWorkspaceFile(
      "components/tenant/tenant-dashboard-view.tsx",
    );

    expect(demoSource).toContain("TenantDashboardView");
    expect(demoSource).toContain("renderActions={{");
    expect(demoSource).toContain(
      'requestsHref="/demo?mode=tenant&page=requests"',
    );
    expect(tenantDashboardViewSource).toContain('label="Details contrat"');
    expect(tenantDashboardViewSource).toContain(
      'label="Mettre fin a un contrat"',
    );
    expect(tenantDashboardViewSource).toContain(
      'label="Declarer un loyer paye"',
    );
    expect(tenantDashboardViewSource).toContain('label="Demande proprietaire"');
    expect(tenantDashboardViewSource).toContain("Mon logement");
    expect(demoSource).toContain("DÃ©tail du contrat");
    expect(demoSource).toContain("Demandes au propriÃ©taire");
    expect(tenantDashboardViewSource).toContain("Marquer comme vue");
    expect(demoSource).toContain("Marquer comme vue");
    expect(demoSource).toContain("Mon compte");
    expect(demoSource).toContain("Changer d&apos;espace");
    expect(demoSource).not.toContain("Accepter le mandat mock");
    expect(demoSource).not.toContain("Mandat mock");
    expect(demoDataSource).toContain("Appartement Canal");
    expect(demoDataSource).toContain("Arthur B.");
  });

  it("keeps demo actions simulated and away from protected app routes", () => {
    const demoSource = readWorkspaceFile("app/demo/page.tsx");
    const demoLayoutSource = readWorkspaceFile("app/demo/layout.tsx");
    const interactionsSource = readWorkspaceFile(
      "app/demo/demo-interactions.tsx",
    );

    expect(demoSource).toContain("Action simulÃ©e");
    expect(demoSource).toContain('href="/sign-up"');
    expect(demoSource).not.toContain('"use server"');
    expect(demoSource).not.toContain("requireOwnerAccess");
    expect(demoSource).not.toContain("requireTenantAccess");
    expect(demoSource).not.toContain("prisma");
    expect(interactionsSource).not.toContain('"use server"');
    expect(interactionsSource).not.toContain("requireOwnerAccess");
    expect(interactionsSource).not.toContain("requireTenantAccess");
    expect(interactionsSource).not.toContain("prisma");
    expect(demoLayoutSource).not.toContain('href="/owner');
    expect(demoLayoutSource).not.toContain('href="/tenant');
  });

  it("documents the updated public entry path", () => {
    const currentStateSource = readWorkspaceFile("docs/current-state.md");
    const plansSource = readWorkspaceFile("PLANS.md");

    expect(currentStateSource).toContain("Landing publique V1");
    expect(currentStateSource).toContain("Demo publique V3");
    expect(currentStateSource).toContain("actions simulees localement");
    expect(currentStateSource).toContain("landing -> demo");
    expect(currentStateSource).toContain(
      "basculer entre un mode proprietaire et un mode locataire",
    );
    expect(plansSource).toContain("Landing publique V1 sous `/`");
    expect(plansSource).toContain("choix du plan avant dashboard");
  });
});
