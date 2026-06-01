import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function readWorkspaceFile(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("RentFlow brand logo assets", () => {
  it("keeps the light and dark brand assets available", () => {
    const assets = [
      "public/brand/logo-rentflow.png",
      "public/brand/logo-rentflow-claire.png",
      "public/brand/rentflow-wordmark.png",
      "public/brand/rentflow-wordmark-claire.png",
    ];

    for (const asset of assets) {
      expect(existsSync(join(process.cwd(), asset))).toBe(true);
    }
  });

  it("renders theme-aware logo and wordmark variants from one component", () => {
    const brandLogoSource = readWorkspaceFile(
      "components/brand/brand-logo.tsx",
    );

    expect(brandLogoSource).toContain("/brand/logo-rentflow.png");
    expect(brandLogoSource).toContain("/brand/logo-rentflow-claire.png");
    expect(brandLogoSource).toContain("/brand/rentflow-wordmark.png");
    expect(brandLogoSource).toContain("/brand/rentflow-wordmark-claire.png");
    expect(brandLogoSource).toContain("dark:hidden");
    expect(brandLogoSource).toContain("hidden h-full");
    expect(brandLogoSource).toContain('alt="RentFlow"');
  });

  it("uses BrandLogo in the app shell, landing and public demo layout", () => {
    const appShellSource = readWorkspaceFile("components/layout/app-shell.tsx");
    const landingSource = readWorkspaceFile("app/page.tsx");
    const demoLayoutSource = readWorkspaceFile("app/demo/layout.tsx");

    expect(appShellSource).toContain("BrandLogo");
    expect(landingSource).toContain("BrandLogo");
    expect(demoLayoutSource).toContain("BrandLogo");
    expect(appShellSource).not.toContain("<span>RentFlow</span>");
    expect(demoLayoutSource).not.toContain("<span>RentFlow</span>");
    expect(landingSource).toContain("LandingThemeToggle");
  });
});
