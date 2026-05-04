import { describe, expect, it } from "vitest";

import { assertAmountInCents, formatMoney } from "@/lib/money";

describe("money helpers", () => {
  it("accepts integer cents", () => {
    expect(() => assertAmountInCents(490)).not.toThrow();
  });

  it("rejects floating point amounts", () => {
    expect(() => assertAmountInCents(4.9)).toThrow(
      "Amounts must be stored as positive integer cents.",
    );
  });

  it("formats cents with the configured locale and currency", () => {
    expect(formatMoney(490)).toContain("4,90");
  });
});
