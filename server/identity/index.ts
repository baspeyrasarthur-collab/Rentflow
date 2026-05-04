import { MockIdentityProvider } from "@/server/identity/mock-identity-provider";
import type { IdentityProvider } from "@/server/identity/types";

export function getIdentityProvider(): IdentityProvider {
  return new MockIdentityProvider();
}
