import { z } from "zod";

export const onboardingRoleSchema = z.enum(["OWNER", "TENANT"]);

export const onboardingFormSchema = z.object({
  role: onboardingRoleSchema,
});

export type OnboardingRole = z.infer<typeof onboardingRoleSchema>;
