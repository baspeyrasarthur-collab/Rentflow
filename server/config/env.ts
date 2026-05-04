import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const emptyStringAsUndefined = (value: unknown) =>
  value === "" ? undefined : value;

const optionalNonEmptyString = z.preprocess(
  emptyStringAsUndefined,
  z.string().min(1).optional(),
);

const optionalUrl = z.preprocess(
  emptyStringAsUndefined,
  z.string().url().optional(),
);

const publicPath = z.string().trim().startsWith("/");

const booleanString = z
  .preprocess(
    emptyStringAsUndefined,
    z.enum(["true", "false"]).default("false"),
  )
  .transform((value) => value === "true");

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    CLERK_SECRET_KEY: z
      .string()
      .trim()
      .min(1, "CLERK_SECRET_KEY is required. Set a Clerk secret key in .env."),
    CLERK_WEBHOOK_SECRET: optionalNonEmptyString,
    PAYMENT_PROVIDER: z.literal("mock").default("mock"),
    KYC_PROVIDER: z.literal("mock").default("mock"),
    EMAIL_PROVIDER: z.literal("mock").default("mock"),
    STORAGE_PROVIDER: z.literal("mock").default("mock"),
    RESEND_API_KEY: optionalNonEmptyString,
    SENTRY_DSN: optionalUrl,
    SKIP_ENV_VALIDATION: booleanString,
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z
      .string()
      .trim()
      .min(
        1,
        "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required. Set a Clerk publishable key in .env.",
      ),
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: publicPath.default("/sign-in"),
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: publicPath.default("/sign-up"),
    NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL:
      publicPath.default("/dashboard"),
    NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL:
      publicPath.default("/dashboard"),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET,
    PAYMENT_PROVIDER: process.env.PAYMENT_PROVIDER,
    KYC_PROVIDER: process.env.KYC_PROVIDER,
    EMAIL_PROVIDER: process.env.EMAIL_PROVIDER,
    STORAGE_PROVIDER: process.env.STORAGE_PROVIDER,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    SENTRY_DSN: process.env.SENTRY_DSN,
    SKIP_ENV_VALIDATION: process.env.SKIP_ENV_VALIDATION,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
    NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL:
      process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL,
    NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL:
      process.env.NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL,
  },
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
});
