export const OWNER_PLANS = ["FREE", "PRO", "SCALE"] as const;

export type OwnerPlan = (typeof OWNER_PLANS)[number];

export type OwnerPlanFeatures = {
  maxProperties: number | null;
  canUseInAppPayments: boolean;
  canUseExternalPaymentTracking: boolean;
  canUseFinances: boolean;
  canUseExpenses: boolean;
  canUseRecurringExpenses: boolean;
  canUseReceipts: boolean;
  canUseUnlimitedReceipts: boolean;
};

export const DEFAULT_OWNER_PLAN: OwnerPlan = "FREE";

export const OWNER_PLAN_FEATURES = {
  FREE: {
    maxProperties: 1,
    canUseInAppPayments: false,
    canUseExternalPaymentTracking: true,
    canUseFinances: true,
    canUseExpenses: true,
    canUseRecurringExpenses: true,
    canUseReceipts: true,
    canUseUnlimitedReceipts: true,
  },
  PRO: {
    maxProperties: 15,
    canUseInAppPayments: true,
    canUseExternalPaymentTracking: true,
    canUseFinances: true,
    canUseExpenses: true,
    canUseRecurringExpenses: true,
    canUseReceipts: true,
    canUseUnlimitedReceipts: true,
  },
  SCALE: {
    maxProperties: null,
    canUseInAppPayments: true,
    canUseExternalPaymentTracking: true,
    canUseFinances: true,
    canUseExpenses: true,
    canUseRecurringExpenses: true,
    canUseReceipts: true,
    canUseUnlimitedReceipts: true,
  },
} satisfies Record<OwnerPlan, OwnerPlanFeatures>;

export function assertKnownOwnerPlan(plan: string): asserts plan is OwnerPlan {
  if (!(OWNER_PLANS as readonly string[]).includes(plan)) {
    throw new Error(`Unknown owner plan: ${plan}`);
  }
}

export function getOwnerPlanFeatures(plan: OwnerPlan) {
  return OWNER_PLAN_FEATURES[plan];
}

export function getMaxPropertiesForPlan(plan: OwnerPlan) {
  return getOwnerPlanFeatures(plan).maxProperties;
}

export function canCreatePropertyForPlan(
  plan: OwnerPlan,
  currentPropertyCount: number,
) {
  const maxProperties = getMaxPropertiesForPlan(plan);

  return maxProperties === null || currentPropertyCount < maxProperties;
}

export function canUseInAppPaymentsForPlan(plan: OwnerPlan) {
  return getOwnerPlanFeatures(plan).canUseInAppPayments;
}
