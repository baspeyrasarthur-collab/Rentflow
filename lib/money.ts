import { DEFAULT_CURRENCY, DEFAULT_LOCALE } from "@/server/config/app";

export function assertAmountInCents(amountInCents: number) {
  if (!Number.isInteger(amountInCents) || amountInCents < 0) {
    throw new Error("Amounts must be stored as positive integer cents.");
  }
}

export function formatMoney(
  amountInCents: number,
  currency = DEFAULT_CURRENCY,
  locale = DEFAULT_LOCALE,
) {
  assertAmountInCents(amountInCents);

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amountInCents / 100);
}

export function formatSignedMoney(
  amountInCents: number,
  currency = DEFAULT_CURRENCY,
  locale = DEFAULT_LOCALE,
) {
  if (!Number.isInteger(amountInCents)) {
    throw new Error("Amounts must be stored as integer cents.");
  }

  const formattedAmount = formatMoney(
    Math.abs(amountInCents),
    currency,
    locale,
  );

  return amountInCents < 0 ? `-${formattedAmount}` : formattedAmount;
}
