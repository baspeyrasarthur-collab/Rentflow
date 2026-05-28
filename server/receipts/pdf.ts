import { requireCurrentUser } from "@/server/auth/current-user";
import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/errors";
import { canAccessReceiptPdf } from "@/server/receipts/pdf-data";
import { entityIdSchema } from "@/server/validation";

export async function getReceiptForPdf(receiptId: string) {
  const parsedReceiptId = entityIdSchema.parse(receiptId);
  const user = await requireCurrentUser();
  const receipt = await prisma.receipt.findFirst({
    where: {
      id: parsedReceiptId,
      status: {
        in: ["GENERATED", "SENT"],
      },
    },
    select: {
      id: true,
      periodStart: true,
      periodEnd: true,
      rentAmountInCents: true,
      chargesAmountInCents: true,
      totalAmountInCents: true,
      currency: true,
      generatedAt: true,
      property: {
        select: {
          name: true,
          addressLine1: true,
          addressLine2: true,
          postalCode: true,
          city: true,
          country: true,
        },
      },
      ownerProfile: {
        select: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
      tenantProfile: {
        select: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!receipt) {
    throw new AppError("NOT_FOUND", "Receipt not found.");
  }

  if (
    !canAccessReceiptPdf(
      {
        userId: user.id,
        role: user.role,
      },
      {
        ownerUserId: receipt.ownerProfile.user.id,
        tenantUserId: receipt.tenantProfile.user.id,
      },
    )
  ) {
    throw new AppError("FORBIDDEN", "Receipt PDF access denied.");
  }

  return { user, receipt };
}

export function getPersonDisplayName(person: {
  firstName: string | null;
  lastName: string | null;
  email: string;
}) {
  const fullName = [person.firstName, person.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || person.email;
}

export function getPropertyAddressLabel(property: {
  addressLine1: string;
  addressLine2: string | null;
  postalCode: string;
  city: string;
  country: string;
}) {
  return [
    property.addressLine1,
    property.addressLine2,
    `${property.postalCode} ${property.city}`,
    property.country,
  ]
    .filter(Boolean)
    .join(", ");
}
