import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type CompactActionPillTone =
  | "default"
  | "success"
  | "info"
  | "warning"
  | "danger";

type CompactActionPillProps = {
  href: string;
  icon: ReactNode;
  label: string;
  tone?: CompactActionPillTone;
};

const toneClasses: Record<CompactActionPillTone, string> = {
  default:
    "border-primary/35 bg-primary/10 text-foreground hover:border-primary/60 hover:bg-primary/16",
  success:
    "border-primary/65 bg-primary/26 text-primary hover:border-primary/80 hover:bg-primary/32",
  info: "border-ring/65 bg-ring/26 text-ring hover:border-ring/80 hover:bg-ring/32",
  warning:
    "border-chart-4/70 bg-chart-4/26 text-chart-4 hover:border-chart-4/85 hover:bg-chart-4/32",
  danger:
    "border-destructive/65 bg-destructive/26 text-destructive hover:border-destructive/80 hover:bg-destructive/32",
};

export function CompactActionPill({
  href,
  icon,
  label,
  tone = "default",
}: CompactActionPillProps) {
  return (
    <Link
      aria-label={label}
      className={cn(
        "group/pill relative inline-flex min-h-12 w-full items-center gap-3 overflow-hidden rounded-xl border px-4 text-sm font-medium shadow-sm shadow-black/10 transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-lg hover:shadow-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-12 sm:justify-start sm:px-3 sm:hover:w-80 sm:focus-visible:w-80",
        toneClasses[tone],
      )}
      href={href}
      title={label}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/10 via-white/0 to-transparent opacity-0 transition-opacity duration-300 group-hover/pill:opacity-100 group-focus-visible/pill:opacity-100"
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
