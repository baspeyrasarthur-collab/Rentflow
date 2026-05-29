"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

type ScrollRevealProps = {
  as?: "article" | "div" | "section";
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "left" | "right" | "up";
};

type RevealStyle = CSSProperties & {
  "--landing-reveal-delay"?: string;
};

export function ScrollReveal({
  as: Component = "div",
  children,
  className,
  delay = 0,
  direction = "up",
}: ScrollRevealProps) {
  const elementRef = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const setElementRef = (node: HTMLElement | null) => {
    elementRef.current = node;
  };

  useEffect(() => {
    const element = elementRef.current;

    if (!element) {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      const frame = window.requestAnimationFrame(() => setIsVisible(true));

      return () => window.cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        rootMargin: "0px 0px -12% 0px",
        threshold: 0.16,
      },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const style: RevealStyle = {
    "--landing-reveal-delay": `${delay}ms`,
  };

  return (
    <Component
      ref={setElementRef}
      className={cn(
        "landing-scroll-reveal",
        direction === "left" && "landing-scroll-left",
        direction === "right" && "landing-scroll-right",
        isVisible && "is-visible",
        className,
      )}
      style={style}
    >
      {children}
    </Component>
  );
}
