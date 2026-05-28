"use client";

import Link from "next/link";
import {
  useState,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

export type SpotlightCardTone =
  | "default"
  | "success"
  | "info"
  | "warning"
  | "danger";

type SpotlightCardProps = {
  children: ReactNode;
  className?: string;
  href?: string;
  tone?: SpotlightCardTone;
};

type SpotlightStyle = CSSProperties & {
  "--spotlight-x": string;
  "--spotlight-y": string;
};

const spotlightColors: Record<SpotlightCardTone, string> = {
  default:
    "radial-gradient(380px circle at var(--spotlight-x) var(--spotlight-y), rgb(110 198 184 / 0.28), rgb(138 215 232 / 0.14) 38%, transparent 70%)",
  success:
    "radial-gradient(380px circle at var(--spotlight-x) var(--spotlight-y), rgb(90 214 176 / 0.36), rgb(54 189 150 / 0.18) 38%, transparent 70%)",
  info: "radial-gradient(380px circle at var(--spotlight-x) var(--spotlight-y), rgb(96 207 232 / 0.36), rgb(99 179 214 / 0.18) 38%, transparent 70%)",
  warning:
    "radial-gradient(380px circle at var(--spotlight-x) var(--spotlight-y), rgb(245 183 85 / 0.36), rgb(204 139 54 / 0.18) 38%, transparent 70%)",
  danger:
    "radial-gradient(380px circle at var(--spotlight-x) var(--spotlight-y), rgb(228 99 87 / 0.34), rgb(171 68 62 / 0.18) 38%, transparent 70%)",
};

const hoverBorderClasses: Record<SpotlightCardTone, string> = {
  default: "hover:border-primary/55",
  success: "hover:border-primary/70",
  info: "hover:border-ring/70",
  warning: "hover:border-chart-4/75",
  danger: "hover:border-destructive/75",
};

export function SpotlightCard({
  children,
  className,
  href,
  tone = "default",
}: SpotlightCardProps) {
  const [position, setPosition] = useState({ x: 50, y: 50 });

  function handleMouseMove(event: MouseEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect();

    setPosition({
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    });
  }

  const style: SpotlightStyle = {
    "--spotlight-x": `${position.x}%`,
    "--spotlight-y": `${position.y}%`,
  };

  const sharedClassName = cn(
    "group/spotlight relative block h-full overflow-hidden rounded-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.015] hover:shadow-xl hover:shadow-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    hoverBorderClasses[tone],
    className,
  );

  const spotlight = (
    <span
      aria-hidden="true"
      className="rentflow-spotlight-effect pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300 group-hover/spotlight:opacity-100 group-focus-visible/spotlight:opacity-100"
      style={{
        background: spotlightColors[tone],
      }}
    />
  );

  if (href) {
    return (
      <Link
        className={sharedClassName}
        href={href}
        onMouseMove={handleMouseMove}
        style={style}
      >
        {children}
        {spotlight}
      </Link>
    );
  }

  return (
    <div
      className={sharedClassName}
      onMouseMove={handleMouseMove}
      style={style}
    >
      {children}
      {spotlight}
    </div>
  );
}
