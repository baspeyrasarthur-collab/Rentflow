import { MockEmailProvider } from "@/server/email/mock-email-provider";
import type { EmailProvider } from "@/server/email/types";

export function getEmailProvider(): EmailProvider {
  return new MockEmailProvider();
}
