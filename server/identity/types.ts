import type { IdentityVerificationStatus as PrismaIdentityVerificationStatus } from "@/lib/generated/prisma/enums";

export type IdentityProviderName = "MOCK";

export type IdentityVerificationStatus = PrismaIdentityVerificationStatus;

export type StartIdentityVerificationInput = {
  userId: string;
};

export type IdentityVerificationSession = {
  provider: IdentityProviderName;
  providerSessionId: string;
  status: IdentityVerificationStatus;
  redirectUrl?: string;
};

export type IdentityProvider = {
  startVerification(
    input: StartIdentityVerificationInput,
  ): Promise<IdentityVerificationSession>;
};
