import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type StatusBadgeTone =
  | "default"
  | "success"
  | "info"
  | "warning"
  | "danger"
  | "muted";

type StatusBadgeProps = {
  children: ReactNode;
  tone?: StatusBadgeTone;
  className?: string;
};

const toneClasses: Record<StatusBadgeTone, string> = {
  default: "border-border bg-card text-card-foreground",
  success: "border-primary/70 bg-primary/26 text-primary",
  info: "border-ring/70 bg-ring/26 text-ring",
  warning: "border-chart-4/75 bg-chart-4/26 text-chart-4",
  danger: "border-destructive/75 bg-destructive/26 text-destructive",
  muted: "border-border bg-muted text-muted-foreground",
};

export function StatusBadge({
  children,
  className,
  tone = "default",
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-md border px-2 py-1 text-xs font-medium leading-none",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
