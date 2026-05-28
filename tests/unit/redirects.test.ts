import { describe, expect, it } from "vitest";

import {
  getSafeReturnTo,
  isSafeInternalReturnTo,
} from "@/server/security/redirects";

describe("safe internal redirects", () => {
  it("accepts the invitation accept route with query params", () => {
    expect(isSafeInternalReturnTo("/invitations/accept?token=abc")).toBe(true);
  });

  it("accepts the dashboard route", () => {
    expect(isSafeInternalReturnTo("/dashboard")).toBe(true);
  });

  it("rejects external absolute urls", () => {
    expect(isSafeInternalReturnTo("https://evil.com")).toBe(false);
  });

  it("rejects protocol-relative urls", () => {
    expect(isSafeInternalReturnTo("//evil.com")).toBe(false);
  });

  it("rejects empty values", () => {
    expect(isSafeInternalReturnTo("")).toBe(false);
    expect(isSafeInternalReturnTo("   ")).toBe(false);
  });

  it("returns the fallback when the value is invalid", () => {
    expect(getSafeReturnTo("https://evil.com", "/dashboard")).toBe(
      "/dashboard",
    );
  });
});
