import type {
  IdentityProvider,
  IdentityVerificationSession,
} from "@/server/identity/types";

export class MockIdentityProvider implements IdentityProvider {
  async startVerification(): Promise<IdentityVerificationSession> {
    return {
      provider: "MOCK",
      providerSessionId: `kyc_${crypto.randomUUID()}`,
      status: "PENDING",
    };
  }
}
