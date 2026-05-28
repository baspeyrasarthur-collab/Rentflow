"use client";

import {
  BarChart3,
  Building2,
  ClipboardList,
  Home,
  LogIn,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  Sun,
  Users,
  UserPlus,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ComponentType, type ReactNode } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DemoLayoutProps = {
  children: ReactNode;
};

type DemoNavLink = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

type ThemePreference = "dark" | "light";

const THEME_STORAGE_KEY = "rentflow-theme";

const demoNavLinks: DemoNavLink[] = [
  { href: "/demo", label: "Vue d'ensemble", icon: Home },
  { href: "/demo/finances", label: "Finances", icon: BarChart3 },
  { href: "/demo/properties", label: "Logements", icon: Building2 },
  { href: "/demo/tenants", label: "Locataires", icon: Users },
  { href: "/demo/declarations", label: "Declarations", icon: ClipboardList },
  { href: "/pricing", label: "Plans", icon: Sparkles },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/demo") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
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

export default function DemoLayout({ children }: DemoLayoutProps) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<ThemePreference>(getStoredThemePreference);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const isDarkTheme = theme === "dark";

  useEffect(() => {
    applyThemePreference(theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((currentTheme) => {
      const nextTheme = currentTheme === "dark" ? "light" : "dark";

      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      applyThemePreference(nextTheme);

      return nextTheme;
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
            "flex items-center gap-3 rounded-lg py-2 text-lg font-semibold tracking-normal text-foreground",
            isSidebarCollapsed ? "justify-center px-0" : "px-2",
          )}
          href="/demo"
          title="RentFlow"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/45 bg-primary/16 shadow-sm shadow-primary/10 ring-1 ring-white/5">
            <Image
              alt="RentFlow"
              className="size-7 object-contain drop-shadow-sm"
              height={28}
              src="/brand/logo-rentflow.png"
              width={28}
            />
          </span>
          <span
            className={cn(
              "text-xl font-semibold leading-none tracking-normal",
              isSidebarCollapsed && "sr-only",
            )}
          >
            RentFlow
          </span>
        </Link>

        <div
          className={cn(
            "mt-3 rounded-xl border bg-background/45",
            isSidebarCollapsed ? "p-2" : "px-3 py-2.5",
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
        </div>

        <div className="min-h-0 flex-1">
          <nav aria-label="Navigation démo" className="mt-4">
            <ul className="space-y-1">
              {demoNavLinks.map((link) => {
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
            Prêt à gérer vos biens ?
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
          <Link className="flex items-center gap-2 font-semibold" href="/demo">
            <span className="flex size-9 items-center justify-center rounded-lg border border-primary/45 bg-primary/16 shadow-sm shadow-primary/10">
              <Image
                alt="RentFlow"
                className="size-6 object-contain"
                height={24}
                src="/brand/logo-rentflow.png"
                width={24}
              />
            </span>
            <span>RentFlow</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              className={buttonVariants({
                size: "sm",
              })}
              href="/sign-up"
            >
              Créer un compte
            </Link>
            <Link
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "gap-1.5",
              })}
              href="/sign-in"
            >
              <LogIn className="size-3.5" />
              Se connecter
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
          </div>
        </div>
        <div className="border-t px-4 py-3">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-1 font-medium text-primary">
              Démo
            </span>
            <span className="text-muted-foreground">Données fictives</span>
          </div>
          <nav aria-label="Navigation démo mobile" className="overflow-x-auto">
            <ul className="flex min-w-max gap-2">
              {demoNavLinks.map((link) => {
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
        <div className="sticky top-4 z-30 mb-4 hidden justify-end md:flex">
          <button
            aria-label={
              isDarkTheme ? "Activer le mode clair" : "Activer le mode sombre"
            }
            aria-pressed={!isDarkTheme}
            className={buttonVariants({
              variant: "outline",
              size: "icon",
              className: "bg-card/85 shadow-sm shadow-black/10 backdrop-blur",
            })}
            onClick={toggleTheme}
            type="button"
          >
            {isDarkTheme ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
          </button>
        </div>
        <div className="mx-auto w-full max-w-[1500px]">{children}</div>
      </main>
    </div>
  );
}
