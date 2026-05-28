import Link from "next/link";
import type { ReactNode } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ActionCardTone = "default" | "success" | "info" | "warning" | "danger";

type ActionCardProps = {
  title: string;
  description?: string;
  value?: string | number;
  href?: string;
  actionLabel?: string;
  icon?: ReactNode;
  tone?: ActionCardTone;
  className?: string;
  children?: ReactNode;
};

const toneClasses: Record<ActionCardTone, string> = {
  default: "border-border bg-card",
  success: "border-primary/65 bg-primary/22 shadow-primary/10",
  info: "border-ring/65 bg-ring/22 shadow-ring/10",
  warning: "border-chart-4/70 bg-chart-4/22 shadow-chart-4/10",
  danger: "border-destructive/70 bg-destructive/22 shadow-destructive/10",
};

const glowClasses: Record<ActionCardTone, string> = {
  default: "from-muted/20",
  success: "from-primary/34",
  info: "from-ring/34",
  warning: "from-chart-4/34",
  danger: "from-destructive/34",
};

const iconClasses: Record<ActionCardTone, string> = {
  default: "border-border bg-muted/50 text-muted-foreground",
  success: "border-primary/60 bg-primary/28 text-primary shadow-primary/20",
  info: "border-ring/60 bg-ring/28 text-ring shadow-ring/20",
  warning: "border-chart-4/65 bg-chart-4/28 text-chart-4 shadow-chart-4/20",
  danger:
    "border-destructive/65 bg-destructive/28 text-destructive shadow-destructive/20",
};

export function ActionCard({
  actionLabel,
  children,
  className,
  description,
  href,
  icon,
  title,
  tone = "default",
  value,
}: ActionCardProps) {
  const content = (
    <>
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b to-transparent opacity-80",
          glowClasses[tone],
        )}
      />
      <div className="relative space-y-4">
        <div className="flex items-start gap-4">
          {icon ? (
            <div
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-xl border shadow-sm",
                iconClasses[tone],
              )}
            >
              {icon}
            </div>
          ) : null}
          <div className="min-w-0 flex-1 space-y-2">
            {value !== undefined ? (
              <p className="text-3xl font-semibold leading-none tracking-normal text-foreground">
                {value}
              </p>
            ) : null}
            <h3 className="text-base font-semibold tracking-normal text-foreground">
              {title}
            </h3>
            {description ? (
              <p className="text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {children}
        {href && actionLabel ? (
          <span className={buttonVariants({ variant: "outline", size: "sm" })}>
            {actionLabel}
          </span>
        ) : null}
      </div>
    </>
  );

  const sharedClassName = cn(
    "group relative overflow-hidden rounded-xl border p-5 text-card-foreground shadow-sm shadow-black/10 ring-1 ring-white/[0.02] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:border-primary/55 hover:shadow-xl hover:shadow-black/25",
    toneClasses[tone],
    href
      ? "block cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      : "",
    className,
  );

  if (href) {
    return (
      <Link className={sharedClassName} href={href}>
        {content}
      </Link>
    );
  }

  return <article className={cn(sharedClassName)}>{content}</article>;
}
