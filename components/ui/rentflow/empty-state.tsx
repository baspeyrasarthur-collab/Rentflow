import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  action,
  className,
  description,
  title,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-6 text-card-foreground shadow-sm shadow-black/5",
        className,
      )}
    >
      <div className="max-w-xl space-y-2">
        <h3 className="text-lg font-semibold tracking-normal text-foreground">
          {title}
        </h3>
        {description ? (
          <p className="text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action ? (
        <div className="mt-5 flex flex-wrap gap-2">{action}</div>
      ) : null}
    </div>
  );
}
