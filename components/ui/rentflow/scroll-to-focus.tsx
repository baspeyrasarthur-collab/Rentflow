"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

function ScrollToFocusInner() {
  const searchParams = useSearchParams();
  const focus = searchParams.get("focus");

  useEffect(() => {
    if (!focus) {
      return;
    }

    const timeout = window.setTimeout(() => {
      const target = document.getElementById(focus);

      if (!target) {
        return;
      }

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      target.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "center",
      });
    }, 100);

    return () => window.clearTimeout(timeout);
  }, [focus]);

  return null;
}

export function ScrollToFocus() {
  return (
    <Suspense fallback={null}>
      <ScrollToFocusInner />
    </Suspense>
  );
}
