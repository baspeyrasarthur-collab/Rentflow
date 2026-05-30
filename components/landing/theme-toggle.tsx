"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { buttonVariants } from "@/components/ui/button";

type ThemePreference = "dark" | "light";

const THEME_STORAGE_KEY = "rentflow-theme";

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

export function LandingThemeToggle() {
  const [theme, setTheme] = useState<ThemePreference>(getStoredThemePreference);
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
    <button
      aria-label={
        isDarkTheme ? "Activer le mode clair" : "Activer le mode sombre"
      }
      aria-pressed={!isDarkTheme}
      className={buttonVariants({
        variant: "outline",
        size: "icon-sm",
        className:
          "border-white/12 bg-white/[0.03] text-[#F5F1E8] hover:bg-white/[0.07]",
      })}
      onClick={toggleTheme}
      title={isDarkTheme ? "Mode clair" : "Mode sombre"}
      type="button"
    >
      {isDarkTheme ? (
        <Sun className="size-3.5" />
      ) : (
        <Moon className="size-3.5" />
      )}
    </button>
  );
}
