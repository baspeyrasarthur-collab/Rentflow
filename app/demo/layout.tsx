"use client";

import {
  ArrowLeftRight,
  BarChart3,
  Building2,
  ClipboardList,
  Home,
  LifeBuoy,
  LogIn,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  ReceiptText,
  Sparkles,
  Sun,
  Users,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Suspense,
  useEffect,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";

import { BrandLogo } from "@/components/brand/brand-logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DemoLayoutProps = {
  children: ReactNode;
};

type DemoMode = "owner" | "tenant";
type ThemePreference = "dark" | "light";
type SpotlightEffectsPreference = "on" | "off";

type DemoNavLink = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

const THEME_STORAGE_KEY = "rentflow-theme";
const SPOTLIGHT_EFFECTS_STORAGE_KEY = "rentflow-spotlight-effects";

const ownerNavLinks: DemoNavLink[] = [
  {
    href: "/demo?mode=owner&page=dashboard",
    label: "Tableau de bord",
    icon: Home,
  },
  { href: "/demo?mode=owner&page=properties", label: "Biens", icon: Building2 },
  { href: "/demo?mode=owner&page=tenants", label: "Locataires", icon: Users },
  {
    href: "/demo?mode=owner&page=finances",
    label: "Finances",
    icon: BarChart3,
  },
  {
    href: "/demo?mode=owner&page=declarations",
    label: "Déclarations",
    icon: ClipboardList,
  },
  { href: "/support", label: "Support", icon: LifeBuoy },
];

const tenantNavLinks: DemoNavLink[] = [
  {
    href: "/demo?mode=tenant&page=dashboard",
    label: "Tableau de bord",
    icon: Home,
  },
  {
    href: "/demo?mode=tenant&page=requests",
    label: "Demandes",
    icon: ReceiptText,
  },
  { href: "/demo?mode=tenant&page=account", label: "Mon compte", icon: Users },
  { href: "/support", label: "Support", icon: LifeBuoy },
];

function getDemoMode(searchParams: URLSearchParams): DemoMode {
  return searchParams.get("mode") === "tenant" ? "tenant" : "owner";
}

function getDemoPage(searchParams: URLSearchParams) {
  return searchParams.get("page") ?? "dashboard";
}

function isActiveDemoLink(
  linkHref: string,
  mode: DemoMode,
  currentPage: string,
) {
  const [, query = ""] = linkHref.split("?");
  const params = new URLSearchParams(query);

  return (
    params.get("mode") === mode &&
    (params.get("page") ?? "dashboard") === currentPage
  );
}

function getStoredThemePreference(): ThemePreference {
  if (typeof window === "undefined") {
    return "dark";
  }

  return window.localStorage.getItem(THEME_STORAGE_KEY) === "light"
    ? "light"
    : "dark";
}

function applyThemePreference(theme: ThemePreference) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

function getStoredSpotlightEffectsPreference(): SpotlightEffectsPreference {
  if (typeof window === "undefined") {
    return "on";
  }

  return window.localStorage.getItem(SPOTLIGHT_EFFECTS_STORAGE_KEY) === "off"
    ? "off"
    : "on";
}

function applySpotlightEffectsPreference(
  preference: SpotlightEffectsPreference,
) {
  document.documentElement.dataset.spotlightEffects = preference;
}

function DemoLayoutContent({ children }: DemoLayoutProps) {
  const searchParams = useSearchParams();
  const mode = getDemoMode(searchParams);
  const currentPage = getDemoPage(searchParams);
  const navLinks = mode === "owner" ? ownerNavLinks : tenantNavLinks;
  const [theme, setTheme] = useState<ThemePreference>(getStoredThemePreference);
  const [spotlightEffects, setSpotlightEffects] =
    useState<SpotlightEffectsPreference>(getStoredSpotlightEffectsPreference);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const isDarkTheme = theme === "dark";
  const areSpotlightEffectsEnabled = spotlightEffects === "on";
  const switchHref =
    mode === "owner"
      ? "/demo?mode=tenant&page=dashboard"
      : "/demo?mode=owner&page=dashboard";
  const switchLabel =
    mode === "owner" ? "Voir la démo locataire" : "Voir la démo propriétaire";
  const topActionClassName =
    "group/top-action inline-flex h-10 w-10 items-center justify-start gap-2 overflow-hidden rounded-full border border-border/80 bg-card/85 px-2.5 text-sm font-medium text-muted-foreground shadow-sm shadow-black/10 backdrop-blur transition-all duration-300 hover:w-56 hover:border-primary/45 hover:bg-primary/12 hover:text-foreground focus-visible:w-56 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  useEffect(() => {
    applyThemePreference(theme);
  }, [theme]);

  useEffect(() => {
    applySpotlightEffectsPreference(spotlightEffects);
  }, [spotlightEffects]);

  function toggleTheme() {
    setTheme((currentTheme) => {
      const nextTheme = currentTheme === "dark" ? "light" : "dark";

      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      applyThemePreference(nextTheme);

      return nextTheme;
    });
  }

  function toggleSpotlightEffects() {
    setSpotlightEffects((currentPreference) => {
      const nextPreference = currentPreference === "on" ? "off" : "on";

      window.localStorage.setItem(
        SPOTLIGHT_EFFECTS_STORAGE_KEY,
        nextPreference,
      );
      applySpotlightEffectsPreference(nextPreference);

      return nextPreference;
    });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden border-r bg-sidebar text-sidebar-foreground shadow-2xl shadow-black/15 transition-[width,padding] duration-300 md:flex md:flex-col",
          isSidebarCollapsed ? "w-20 px-3 py-4" : "w-72 px-4 py-4",
        )}
      >
        <Link
          aria-label="RentFlow"
          className={cn(
            "flex items-center rounded-lg py-2 transition-opacity hover:opacity-90",
            isSidebarCollapsed ? "justify-center px-0" : "px-2",
          )}
          href="/demo"
          title="RentFlow"
        >
          <BrandLogo
            iconClassName="size-12"
            priority
            showWordmark={!isSidebarCollapsed}
            wordmarkClassName="h-8 w-32"
          />
        </Link>

        <div
          className={cn(
            "mt-3 rounded-xl border bg-background/45",
            isSidebarCollapsed ? "p-2" : "space-y-2 px-3 py-2.5",
          )}
        >
          <div
            className={cn(
              "flex items-center gap-2",
              isSidebarCollapsed && "justify-center",
            )}
          >
            <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
              Démo
            </span>
            <span
              className={cn(
                "text-xs text-muted-foreground",
                isSidebarCollapsed && "sr-only",
              )}
            >
              Données fictives
            </span>
          </div>
          <Link
            className={cn(
              "inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-ring px-3 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isSidebarCollapsed &&
                "size-10 rounded-xl p-0 text-primary-foreground",
            )}
            href={switchHref}
            title={switchLabel}
          >
            <ArrowLeftRight className="size-4 shrink-0" />
            <span className={cn(isSidebarCollapsed && "sr-only")}>
              {switchLabel}
            </span>
          </Link>
        </div>

        <div className="min-h-0 flex-1">
          <nav aria-label="Navigation demo" className="mt-4">
            <ul className="space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isExternalSupport = link.href === "/support";
                const isActive =
                  !isExternalSupport &&
                  isActiveDemoLink(link.href, mode, currentPage);

                return (
                  <li key={link.href}>
                    <Link
                      aria-current={isActive ? "page" : undefined}
                      aria-label={link.label}
                      className={cn(
                        "flex min-h-10 items-center rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                        isSidebarCollapsed
                          ? "justify-center px-0"
                          : "gap-3 px-3",
                        isActive &&
                          "border border-primary/25 bg-primary/12 text-foreground shadow-sm shadow-primary/5",
                      )}
                      href={link.href}
                      title={link.label}
                    >
                      <Icon
                        className={cn(
                          "size-4 shrink-0 text-muted-foreground",
                          isActive && "text-primary",
                        )}
                      />
                      <span className={cn(isSidebarCollapsed && "sr-only")}>
                        {link.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <div
          className={cn(
            "mt-3 rounded-xl border bg-background/45",
            isSidebarCollapsed ? "p-2" : "space-y-2 p-2.5",
          )}
        >
          <p
            className={cn(
              "text-sm font-medium text-foreground",
              isSidebarCollapsed && "sr-only",
            )}
          >
            Tester avec vos données
          </p>
          <div className={cn("grid gap-2", isSidebarCollapsed && "gap-1")}>
            <Link
              aria-label="Créer un compte"
              className={buttonVariants({
                size: isSidebarCollapsed ? "icon" : "default",
              })}
              href="/sign-up"
              title="Créer un compte"
            >
              {isSidebarCollapsed ? (
                <UserPlus className="size-4" />
              ) : (
                "Créer un compte"
              )}
            </Link>
            <Link
              aria-label="Se connecter"
              className={buttonVariants({
                variant: "outline",
                size: isSidebarCollapsed ? "icon" : "default",
              })}
              href="/sign-in"
              title="Se connecter"
            >
              {isSidebarCollapsed ? (
                <LogIn className="size-4" />
              ) : (
                "Se connecter"
              )}
            </Link>
          </div>
        </div>
      </aside>

      <button
        aria-label={
          isSidebarCollapsed
            ? "Ouvrir la barre latérale"
            : "Réduire la barre latérale"
        }
        aria-pressed={isSidebarCollapsed}
        className={cn(
          "fixed top-1/2 z-50 hidden h-16 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border bg-card/90 text-muted-foreground shadow-lg shadow-black/20 backdrop-blur transition-[left,background,color] hover:bg-muted hover:text-foreground md:flex",
          isSidebarCollapsed ? "left-20" : "left-72",
        )}
        onClick={() => setIsSidebarCollapsed((current) => !current)}
        type="button"
      >
        {isSidebarCollapsed ? (
          <PanelLeftOpen className="size-4" />
        ) : (
          <PanelLeftClose className="size-4" />
        )}
      </button>

      <header className="border-b bg-card/80 backdrop-blur md:hidden">
        <div className="flex min-h-16 items-center justify-between gap-4 px-4">
          <Link
            aria-label="RentFlow"
            className="flex items-center transition-opacity hover:opacity-90"
            href="/demo"
          >
            <BrandLogo
              iconClassName="size-10"
              priority
              wordmarkClassName="h-7 w-28"
            />
          </Link>
          <div className="flex items-center gap-2">
            <Link className={buttonVariants({ size: "sm" })} href="/sign-up">
              Créer un compte
            </Link>
            <Link
              className={buttonVariants({
                variant: "outline",
                size: "icon-sm",
              })}
              href="/sign-in"
              title="Se connecter"
            >
              <LogIn className="size-3.5" />
            </Link>
            <button
              aria-label={
                isDarkTheme ? "Activer le mode clair" : "Activer le mode sombre"
              }
              aria-pressed={!isDarkTheme}
              className={buttonVariants({
                variant: "outline",
                size: "icon-sm",
              })}
              onClick={toggleTheme}
              type="button"
            >
              {isDarkTheme ? (
                <Sun className="size-3.5" />
              ) : (
                <Moon className="size-3.5" />
              )}
            </button>
            <button
              aria-label={
                areSpotlightEffectsEnabled
                  ? "Désactiver les effets lumineux"
                  : "Activer les effets lumineux"
              }
              aria-pressed={!areSpotlightEffectsEnabled}
              className={buttonVariants({
                variant: "outline",
                size: "icon-sm",
              })}
              onClick={toggleSpotlightEffects}
              type="button"
            >
              <Sparkles className="size-3.5" />
            </button>
          </div>
        </div>
        <div className="border-t px-4 py-3">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-1 font-medium text-primary">
              Démo — données fictives
            </span>
            <Link
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-ring px-3 py-1.5 font-semibold text-primary-foreground shadow-sm shadow-primary/20"
              href={switchHref}
            >
              <ArrowLeftRight className="size-3.5" />
              {switchLabel}
            </Link>
          </div>
          <nav aria-label="Navigation demo mobile" className="overflow-x-auto">
            <ul className="flex min-w-max gap-2">
              {navLinks.map((link) => {
                const isActive =
                  link.href !== "/support" &&
                  isActiveDemoLink(link.href, mode, currentPage);

                return (
                  <li key={link.href}>
                    <Link
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "inline-flex min-h-9 items-center rounded-lg border px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                        isActive &&
                          "border-primary/30 bg-primary/10 text-foreground",
                      )}
                      href={link.href}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </header>

      <main
        className={cn(
          "w-full px-4 py-6 transition-[margin,width] duration-300 sm:px-6 md:px-8 md:py-8 lg:px-10",
          isSidebarCollapsed
            ? "md:ml-20 md:w-[calc(100%-5rem)]"
            : "md:ml-72 md:w-[calc(100%-18rem)]",
        )}
      >
        <div className="sticky top-4 z-30 mb-4 hidden justify-end gap-2 md:flex">
          <Link
            className={cn(
              buttonVariants({ size: "sm" }),
              "h-10 gap-2 rounded-full bg-gradient-to-r from-primary to-ring px-4 font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/25",
            )}
            href={switchHref}
          >
            <ArrowLeftRight className="size-4" />
            {switchLabel}
          </Link>
          <Link
            className={topActionClassName}
            href="/"
            title="Retour présentation"
          >
            <Sparkles className="size-4 shrink-0 text-primary" />
            <span className="whitespace-nowrap opacity-0 transition-opacity duration-300 group-hover/top-action:opacity-100 group-focus-visible/top-action:opacity-100">
              Retour présentation
            </span>
          </Link>
          <button
            aria-label={
              isDarkTheme ? "Activer le mode clair" : "Activer le mode sombre"
            }
            aria-pressed={!isDarkTheme}
            className={topActionClassName}
            onClick={toggleTheme}
            type="button"
          >
            {isDarkTheme ? (
              <Sun className="size-4 shrink-0 text-primary" />
            ) : (
              <Moon className="size-4 shrink-0 text-primary" />
            )}
            <span className="whitespace-nowrap opacity-0 transition-opacity duration-300 group-hover/top-action:opacity-100 group-focus-visible/top-action:opacity-100">
              {isDarkTheme ? "Mode clair" : "Mode sombre"}
            </span>
          </button>
          <button
            aria-label={
              areSpotlightEffectsEnabled
                ? "Désactiver les effets lumineux"
                : "Activer les effets lumineux"
            }
            aria-pressed={!areSpotlightEffectsEnabled}
            className={topActionClassName}
            onClick={toggleSpotlightEffects}
            title={
              areSpotlightEffectsEnabled
                ? "Désactiver les effets lumineux"
                : "Activer les effets lumineux"
            }
            type="button"
          >
            <Sparkles className="size-4 shrink-0 text-primary" />
            <span className="whitespace-nowrap opacity-0 transition-opacity duration-300 group-hover/top-action:opacity-100 group-focus-visible/top-action:opacity-100">
              {areSpotlightEffectsEnabled
                ? "Effets lumineux off"
                : "Effets lumineux on"}
            </span>
          </button>
        </div>
        <div className="mx-auto w-full max-w-[1500px]">{children}</div>
      </main>
    </div>
  );
}

export default function DemoLayout({ children }: DemoLayoutProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background px-6 py-8 text-foreground">
          <div className="mx-auto max-w-7xl rounded-xl border bg-card p-6 shadow-sm">
            Chargement de la démo...
          </div>
        </div>
      }
    >
      <DemoLayoutContent>{children}</DemoLayoutContent>
    </Suspense>
  );
}
