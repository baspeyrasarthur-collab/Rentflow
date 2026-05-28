"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { requireCurrentUser } from "@/server/auth/current-user";
import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/errors";

const supportCategories = [
  "TECHNICAL_ISSUE",
  "ACCOUNT_QUESTION",
  "PAYMENT_RECEIPT",
  "PROPERTY_CONTRACT",
  "OTHER",
] as const;

const supportRequestSchema = z.object({
  subject: z.string().trim().min(3).max(120),
  category: z.enum(supportCategories),
  message: z.string().trim().min(10).max(2000),
});

function readSupportRequestFormData(formData: FormData) {
  const data = {
    subject: formData.get("subject"),
    category: formData.get("category"),
    message: formData.get("message"),
  };

  const parsed = supportRequestSchema.safeParse(data);

  if (!parsed.success) {
    throw new AppError("BAD_REQUEST", "Invalid support request.");
  }

  return parsed.data;
}

function buildMessagePreview(message: string) {
  return message.length > 200 ? `${message.slice(0, 197)}...` : message;
}

export async function createSupportRequestAction(formData: FormData) {
  const user = await requireCurrentUser();
  const input = readSupportRequestFormData(formData);

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "support.request_created",
      entityType: "User",
      entityId: user.id,
      metadata: {
        source: "support_page",
        category: input.category,
        subject: input.subject,
        messagePreview: buildMessagePreview(input.message),
      },
    },
  });

  redirect("/support?sent=1");
}
