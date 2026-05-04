import type {
  EmailProvider,
  SendEmailInput,
  SentEmail,
} from "@/server/email/types";

export class MockEmailProvider implements EmailProvider {
  async sendEmail(input: SendEmailInput): Promise<SentEmail> {
    if (process.env.NODE_ENV === "development") {
      console.info("[mock-email]", {
        to: input.to,
        subject: input.subject,
      });
    }

    return {
      provider: "mock",
      providerMessageId: `email_${crypto.randomUUID()}`,
    };
  }
}
