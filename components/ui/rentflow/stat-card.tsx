import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  trend?: string;
  icon?: ReactNode;
  className?: string;
};

export function StatCard({
  className,
  hint,
  icon,
  label,
  trend,
  value,
}: StatCardProps) {
  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-xl border bg-card p-5 text-card-foreground shadow-sm shadow-black/10 ring-1 ring-white/[0.02] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.015] hover:border-primary/45 hover:shadow-xl hover:shadow-black/20",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-primary/16 via-muted/24 to-transparent"
      />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm leading-5 text-muted-foreground">{label}</p>
          <p className="mt-2 break-words text-2xl font-semibold leading-tight tracking-normal text-foreground">
            {value}
          </p>
        </div>
        {icon ? (
          <div className="rounded-xl border border-primary/55 bg-primary/24 p-2.5 text-primary shadow-sm shadow-primary/20">
            {icon}
          </div>
        ) : null}
      </div>
      {hint || trend ? (
        <div className="relative mt-4 flex flex-col gap-1 text-sm leading-5">
          {trend ? <p className="font-medium text-primary">{trend}</p> : null}
          {hint ? <p className="text-muted-foreground">{hint}</p> : null}
        </div>
      ) : null}
    </article>
  );
}
