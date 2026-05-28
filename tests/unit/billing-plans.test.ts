import { describe, expect, it } from "vitest";

import {
  DEFAULT_OWNER_PLAN,
  assertKnownOwnerPlan,
  canCreatePropertyForPlan,
  canUseInAppPaymentsForPlan,
  getMaxPropertiesForPlan,
  getOwnerPlanFeatures,
} from "@/server/billing/plans";

describe("owner billing plans", () => {
  it("uses FREE as the default owner plan until plans are stored", () => {
    expect(DEFAULT_OWNER_PLAN).toBe("FREE");
  });

  it("configures property limits for FREE, PRO and SCALE", () => {
    expect(getMaxPropertiesForPlan("FREE")).toBe(1);
    expect(getMaxPropertiesForPlan("PRO")).toBe(15);
    expect(getMaxPropertiesForPlan("SCALE")).toBeNull();
  });

  it("does not allow in-app payments on FREE", () => {
    expect(canUseInAppPaymentsForPlan("FREE")).toBe(false);
  });

  it("allows in-app payments on PRO and SCALE", () => {
    expect(canUseInAppPaymentsForPlan("PRO")).toBe(true);
    expect(canUseInAppPaymentsForPlan("SCALE")).toBe(true);
  });

  it("keeps core features available on FREE", () => {
    expect(getOwnerPlanFeatures("FREE")).toMatchObject({
      canUseExternalPaymentTracking: true,
      canUseFinances: true,
      canUseExpenses: true,
      canUseRecurringExpenses: true,
      canUseReceipts: true,
      canUseUnlimitedReceipts: true,
    });
  });

  it("blocks new properties on FREE when the owner already has one", () => {
    expect(canCreatePropertyForPlan("FREE", 1)).toBe(false);
  });

  it("allows new properties on FREE when the owner has none", () => {
    expect(canCreatePropertyForPlan("FREE", 0)).toBe(true);
  });

  it("blocks new properties on PRO when the owner already has fifteen", () => {
    expect(canCreatePropertyForPlan("PRO", 15)).toBe(false);
  });

  it("allows new properties on PRO below fifteen properties", () => {
    expect(canCreatePropertyForPlan("PRO", 14)).toBe(true);
  });

  it("allows SCALE with unlimited properties", () => {
    expect(canCreatePropertyForPlan("SCALE", 16)).toBe(true);
  });

  it("asserts known owner plans", () => {
    const plan = "PRO";

    assertKnownOwnerPlan(plan);

    expect(plan).toBe("PRO");
    expect(() => assertKnownOwnerPlan("TEAM")).toThrow(
      "Unknown owner plan: TEAM",
    );
  });
});
