"use client";

import {
  BarChart3,
  Building2,
  FileText,
  Home,
  LifeBuoy,
  MessageSquare,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  Sparkles,
  Sun,
  Users,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ComponentType, type ReactNode } from "react";

import { BrandLogo } from "@/components/brand/brand-logo";
import { buttonVariants } from "@/components/ui/button";
import type { UserRole } from "@/features/auth/types";
import { cn } from "@/lib/utils";

type NavLink = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

type AppShellProps = {
  avatarUrl?: string | null;
  children: ReactNode;
  currentPlan?: string | null;
  displayName?: string | null;
  roleLabel: string;
  role?: UserRole;
};

type ThemePreference = "dark" | "light";
type SpotlightEffectsPreference = "on" | "off";

const THEME_STORAGE_KEY = "rentflow-theme";
const SPOTLIGHT_EFFECTS_STORAGE_KEY = "rentflow-spotlight-effects";

const navLinksByRole: Record<UserRole, NavLink[]> = {
  OWNER: [
    { href: "/owner", label: "Tableau de bord", icon: Home },
    { href: "/owner/properties", label: "Biens", icon: Building2 },
    { href: "/owner/tenants", label: "Locataires", icon: Users },
    { href: "/owner/finances", label: "Finances", icon: BarChart3 },
    { href: "/owner/declarations", label: "Déclarations", icon: FileText },
    { href: "/support", label: "Support", icon: LifeBuoy },
  ],
  TENANT: [
    { href: "/tenant", label: "Tableau de bord", icon: Home },
    { href: "/tenant/requests", label: "Demandes", icon: MessageSquare },
    { href: "/tenant/account", label: "Mon compte", icon: UserRound },
    { href: "/support", label: "Support", icon: LifeBuoy },
  ],
  ADMIN: [{ href: "/admin", label: "Admin", icon: ShieldCheck }],
};

function isActivePath(pathname: string, href: string) {
  if (href === "/owner" || href === "/tenant" || href === "/admin") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function getHomeHref(role?: UserRole) {
  if (role === "OWNER") {
    return "/owner";
  }

  if (role === "TENANT") {
    return "/tenant";
  }

  if (role === "ADMIN") {
    return "/admin";
  }

  return "/";
}

function getRoleDescription(role?: UserRole) {
  if (role === "OWNER") {
    return "Gestion locative";
  }

  if (role === "TENANT") {
    return "Espace personnel";
  }

  if (role === "ADMIN") {
    return "Support lecture seule";
  }

  return "Espace connecte";
}

function getInitials(value: string) {
  const initials = value
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "RF";
}

function RoleMark({
  avatarUrl,
  displayName,
  roleLabel,
}: {
  avatarUrl?: string | null;
  displayName?: string | null;
  roleLabel: string;
}) {
  if (avatarUrl) {
    return (
      <Image
        alt=""
        className="size-9 rounded-lg border border-primary/40 object-cover"
        height={36}
        src={avatarUrl}
        width={36}
      />
    );
  }

  return (
    <span className="flex size-9 items-center justify-center rounded-lg border border-primary/40 bg-primary/18 text-sm font-semibold text-primary">
      {getInitials(displayName ?? roleLabel)}
    </span>
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

export function AppShell({
  avatarUrl,
  children,
  currentPlan,
  displayName,
  role,
  roleLabel,
}: AppShellProps) {
  const pathname = usePathname();
  const navLinks = role ? navLinksByRole[role] : [];
  const homeHref = getHomeHref(role);
  const [theme, setTheme] = useState<ThemePreference>(getStoredThemePreference);
  const [spotlightEffects, setSpotlightEffects] =
    useState<SpotlightEffectsPreference>(getStoredSpotlightEffectsPreference);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const isDarkTheme = theme === "dark";
  const areSpotlightEffectsEnabled = spotlightEffects === "on";
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
          href={homeHref}
          title="RentFlow"
        >
          <BrandLogo
            iconClassName="size-12"
            priority
            showWordmark={!isSidebarCollapsed}
            wordmarkClassName="h-8 w-32"
          />
        </Link>

        <div className="mt-5 min-h-0 flex-1 overflow-hidden">
          <p
            className={cn(
              "px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground",
              isSidebarCollapsed && "sr-only",
            )}
          >
            {roleLabel}
          </p>
          {navLinks.length > 0 ? (
            <nav
              aria-label="Navigation principale"
              className={cn(isSidebarCollapsed ? "mt-0" : "mt-2")}
            >
              <ul className="space-y-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = isActivePath(pathname, link.href);

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
          ) : null}

          {role === "OWNER" ? (
            <Link
              aria-label="Plans RentFlow"
              className={cn(
                "mt-3 flex rounded-xl border border-primary/40 bg-primary/14 text-sm shadow-md shadow-primary/10 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/65 hover:bg-primary/20 hover:shadow-lg hover:shadow-primary/15",
                isSidebarCollapsed
                  ? "min-h-11 items-center justify-center p-0"
                  : "items-center justify-between gap-3 px-3 py-3",
              )}
              href="/owner/upgrade"
              title="Plans RentFlow"
            >
              {isSidebarCollapsed ? (
                <Sparkles className="size-4 text-primary" />
              ) : (
                <>
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-primary/35 bg-primary/18 text-primary">
                    <Sparkles className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-foreground">
                    <span className="block font-medium">Plans RentFlow</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {currentPlan
                        ? `Plan actuel : ${currentPlan}`
                        : "Voir votre plan"}
                    </span>
                  </span>
                </>
              )}
            </Link>
          ) : null}
        </div>

        <Link
          className={cn(
            "mt-4 rounded-xl border border-primary/25 bg-background/45 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/55 hover:bg-primary/10 hover:shadow-lg hover:shadow-black/15",
            isSidebarCollapsed ? "p-2" : "p-2.5",
          )}
          href={
            role === "OWNER"
              ? "/owner/account"
              : role === "TENANT"
                ? "/tenant/account"
                : homeHref
          }
        >
          <span
            className={cn(
              "flex items-center",
              isSidebarCollapsed ? "justify-center" : "gap-3",
            )}
          >
            <RoleMark
              avatarUrl={avatarUrl}
              displayName={displayName}
              roleLabel={roleLabel}
            />
            <span className={cn("min-w-0", isSidebarCollapsed && "sr-only")}>
              <span className="block truncate text-sm font-medium text-foreground">
                {displayName ?? roleLabel}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {getRoleDescription(role)}
              </span>
            </span>
          </span>
        </Link>
      </aside>

      <button
        aria-label={
          isSidebarCollapsed
            ? "Ouvrir la barre laterale"
            : "Reduire la barre laterale"
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
            href={homeHref}
          >
            <BrandLogo
              iconClassName="size-10"
              priority
              wordmarkClassName="h-7 w-28"
            />
          </Link>
          <div className="flex items-center gap-2">
            <Link
              aria-label="Revoir la demo"
              className={buttonVariants({
                variant: "outline",
                size: "icon-sm",
              })}
              href="/demo"
              title="Revoir la demo"
            >
              <Sparkles className="size-3.5" />
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
                  ? "Desactiver les effets lumineux"
                  : "Activer les effets lumineux"
              }
              aria-pressed={!areSpotlightEffectsEnabled}
              className={buttonVariants({
                variant: "outline",
                size: "icon-sm",
              })}
              onClick={toggleSpotlightEffects}
              title={
                areSpotlightEffectsEnabled
                  ? "Desactiver les effets lumineux"
                  : "Activer les effets lumineux"
              }
              type="button"
            >
              <Sparkles className="size-3.5" />
            </button>
          </div>
        </div>
        {navLinks.length > 0 ? (
          <nav
            aria-label="Navigation principale mobile"
            className="overflow-x-auto border-t px-4 py-3"
          >
            <ul className="flex min-w-max gap-2">
              {navLinks.map((link) => {
                const isActive = isActivePath(pathname, link.href);

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
        ) : null}
      </header>

      <main
        className={cn(
          "w-full px-4 py-6 transition-[margin,width] duration-300 sm:px-6 md:px-8 md:py-8 lg:px-10",
          isSidebarCollapsed
            ? "md:ml-20 md:w-[calc(100%-5rem)]"
            : "md:ml-72 md:w-[calc(100%-18rem)]",
        )}
      >
        <div className="sticky top-4 z-30 mb-4 hidden justify-end md:flex">
          <div className="flex items-center gap-2">
            <Link
              aria-label="Revoir la demo"
              className={topActionClassName}
              href="/demo"
              title="Revoir la demo"
            >
              <Sparkles className="size-4 shrink-0 text-primary" />
              <span className="whitespace-nowrap opacity-0 transition-opacity duration-300 group-hover/top-action:opacity-100 group-focus-visible/top-action:opacity-100">
                Revoir la demo
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
                  ? "Desactiver les effets lumineux"
                  : "Activer les effets lumineux"
              }
              aria-pressed={!areSpotlightEffectsEnabled}
              className={topActionClassName}
              onClick={toggleSpotlightEffects}
              title={
                areSpotlightEffectsEnabled
                  ? "Desactiver les effets lumineux"
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
        </div>
        <div className="mx-auto w-full max-w-[1500px]">{children}</div>
      </main>
    </div>
  );
}
