export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export type SentEmail = {
  provider: "mock" | "resend";
  providerMessageId: string;
};

export type EmailProvider = {
  sendEmail(input: SendEmailInput): Promise<SentEmail>;
};
