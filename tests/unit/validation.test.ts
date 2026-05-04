import { describe, expect, it } from "vitest";

import {
  currencyCodeSchema,
  emailSchema,
  integerCentsSchema,
  paginationSchema,
} from "@/server/validation";

describe("shared validation schemas", () => {
  it("accepts integer cents and rejects floats", () => {
    expect(integerCentsSchema.parse(490)).toBe(490);
    expect(() => integerCentsSchema.parse(4.9)).toThrow();
  });

  it("normalizes email and currency inputs", () => {
    expect(emailSchema.parse("USER@EXAMPLE.COM")).toBe("user@example.com");
    expect(currencyCodeSchema.parse("eur")).toBe("EUR");
  });

  it("applies safe pagination defaults", () => {
    expect(paginationSchema.parse({})).toEqual({
      page: 1,
      pageSize: 20,
    });
  });
});
