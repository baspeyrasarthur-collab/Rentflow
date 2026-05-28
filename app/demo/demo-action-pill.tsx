"use client";

import Link from "next/link";
import {
  useState,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

export type DemoActionPillTone =
  | "default"
  | "success"
  | "info"
  | "warning"
  | "danger";

type DemoActionPillProps = {
  href?: string;
  icon: ReactNode;
  label: string;
  tone?: DemoActionPillTone;
};

type SpotlightStyle = CSSProperties & {
  "--spotlight-x": string;
  "--spotlight-y": string;
};

const toneClasses: Record<DemoActionPillTone, string> = {
  default:
    "border-primary/30 bg-primary/8 text-foreground hover:border-primary/55",
  success: "border-primary/60 bg-primary/24 text-primary hover:bg-primary/30",
  info: "border-ring/60 bg-ring/24 text-ring hover:bg-ring/30",
  warning: "border-chart-4/65 bg-chart-4/24 text-chart-4 hover:bg-chart-4/30",
  danger:
    "border-destructive/60 bg-destructive/24 text-destructive hover:bg-destructive/30",
};

const spotlightColors: Record<DemoActionPillTone, string> = {
  default:
    "radial-gradient(220px circle at var(--spotlight-x) var(--spotlight-y), rgb(110 198 184 / 0.3), rgb(138 215 232 / 0.14) 40%, transparent 72%)",
  success:
    "radial-gradient(220px circle at var(--spotlight-x) var(--spotlight-y), rgb(90 214 176 / 0.38), rgb(54 189 150 / 0.16) 40%, transparent 72%)",
  info: "radial-gradient(220px circle at var(--spotlight-x) var(--spotlight-y), rgb(96 207 232 / 0.4), rgb(99 179 214 / 0.18) 40%, transparent 72%)",
  warning:
    "radial-gradient(240px circle at var(--spotlight-x) var(--spotlight-y), rgb(245 183 85 / 0.42), rgb(204 139 54 / 0.18) 40%, transparent 72%)",
  danger:
    "radial-gradient(220px circle at var(--spotlight-x) var(--spotlight-y), rgb(228 99 87 / 0.38), rgb(171 68 62 / 0.16) 40%, transparent 72%)",
};

export function DemoActionPill({
  href = "/sign-up",
  icon,
  label,
  tone = "default",
}: DemoActionPillProps) {
  const [position, setPosition] = useState({ x: 50, y: 50 });

  function handleMouseMove(event: MouseEvent<HTMLAnchorElement>) {
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

  return (
    <Link
      aria-label={label}
      className={cn(
        "group/pill relative inline-flex min-h-12 w-full items-center gap-3 overflow-hidden rounded-xl border px-4 text-sm font-medium shadow-sm shadow-black/10 transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-lg hover:shadow-black/20 focus-visible:w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-12 sm:justify-start sm:px-3 sm:hover:w-80",
        toneClasses[tone],
      )}
      href={href}
      onMouseMove={handleMouseMove}
      style={style}
      title={label}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/pill:opacity-100 group-focus-visible/pill:opacity-100"
        style={{
          background: spotlightColors[tone],
        }}
      />
      <span className="relative flex size-5 shrink-0 items-center justify-center">
        {icon}
      </span>
      <span className="relative truncate sm:max-w-0 sm:opacity-0 sm:transition-all sm:duration-300 sm:group-hover/pill:max-w-64 sm:group-hover/pill:opacity-100 sm:group-focus-visible/pill:max-w-64 sm:group-focus-visible/pill:opacity-100">
        {label}
      </span>
    </Link>
  );
}
