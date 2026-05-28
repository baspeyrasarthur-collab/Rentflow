import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type InfoAlertTone = "info" | "success" | "warning" | "danger";

type InfoAlertProps = {
  title?: string;
  children: ReactNode;
  tone?: InfoAlertTone;
  className?: string;
};

const toneClasses: Record<InfoAlertTone, string> = {
  info: "border-ring/40 bg-ring/10",
  success: "border-primary/40 bg-primary/10",
  warning: "border-chart-4/50 bg-chart-4/10",
  danger: "border-destructive/50 bg-destructive/10",
};

export function InfoAlert({
  children,
  className,
  title,
  tone = "info",
}: InfoAlertProps) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4 text-sm leading-6 text-foreground",
        toneClasses[tone],
        className,
      )}
    >
      {title ? <p className="font-medium text-foreground">{title}</p> : null}
      <div className={cn(title ? "mt-1 text-muted-foreground" : "")}>
        {children}
      </div>
    </div>
  );
}
