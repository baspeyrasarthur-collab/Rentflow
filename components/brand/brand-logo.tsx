import Image from "next/image";

import { cn } from "@/lib/utils";

export const RENTFLOW_BRAND_ASSETS = {
  darkLogo: "/brand/logo-rentflow.png",
  darkWordmark: "/brand/rentflow-wordmark.png",
  lightLogo: "/brand/logo-rentflow-claire.png",
  lightWordmark: "/brand/rentflow-wordmark-claire.png",
} as const;

type BrandLogoProps = {
  className?: string;
  iconClassName?: string;
  priority?: boolean;
  showWordmark?: boolean;
  wordmarkClassName?: string;
};

export function BrandLogo({
  className,
  iconClassName,
  priority = false,
  showWordmark = true,
  wordmarkClassName,
}: BrandLogoProps) {
  const iconAlt = showWordmark ? "" : "RentFlow";

  return (
    <span
      aria-label="RentFlow"
      className={cn("inline-flex items-center gap-3", className)}
    >
      <span
        className={cn(
          "relative inline-flex size-12 shrink-0 items-center justify-center",
          iconClassName,
        )}
      >
        <Image
          alt={iconAlt}
          className="h-full w-full object-contain drop-shadow-sm dark:hidden"
          height={96}
          priority={priority}
          src={RENTFLOW_BRAND_ASSETS.lightLogo}
          width={96}
        />
        <Image
          alt={iconAlt}
          className="hidden h-full w-full object-contain drop-shadow-sm dark:block"
          height={96}
          priority={priority}
          src={RENTFLOW_BRAND_ASSETS.darkLogo}
          width={96}
        />
      </span>

      {showWordmark ? (
        <span
          className={cn(
            "relative inline-flex h-8 w-32 shrink-0 items-center",
            wordmarkClassName,
          )}
        >
          <Image
            alt="RentFlow"
            className="h-full w-full object-contain object-left dark:hidden"
            height={64}
            priority={priority}
            src={RENTFLOW_BRAND_ASSETS.lightWordmark}
            width={256}
          />
          <Image
            alt="RentFlow"
            className="hidden h-full w-full object-contain object-left dark:block"
            height={64}
            priority={priority}
            src={RENTFLOW_BRAND_ASSETS.darkWordmark}
            width={256}
          />
        </span>
      ) : null}
    </span>
  );
}
