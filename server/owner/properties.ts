import { requireRole } from "@/server/auth/current-user";
import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/errors";
import { propertyIdSchema } from "@/server/validation";

const propertyListSelect = {
  id: true,
  name: true,
  addressLine1: true,
  addressLine2: true,
  postalCode: true,
  city: true,
  country: true,
  propertyType: true,
  surfaceAreaSqm: true,
  furnished: true,
  isColocation: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      rentalContracts: true,
      payments: true,
      receipts: true,
      invitations: true,
    },
  },
} as const;

const propertyDetailSelect = {
  ...propertyListSelect,
  rentalContracts: {
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
    select: {
      id: true,
      contractType: true,
      colocationMode: true,
      status: true,
      startDate: true,
      endDate: true,
      totalRentAmountInCents: true,
      totalChargesAmountInCents: true,
      currency: true,
      paymentDayOfMonth: true,
    },
  },
  payments: {
    orderBy: {
      dueDate: "desc",
    },
    take: 5,
    select: {
      id: true,
      type: true,
      status: true,
      amountInCents: true,
      currency: true,
      dueDate: true,
      paidAt: true,
    },
  },
  invitations: {
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
    select: {
      id: true,
      tenantEmail: true,
      tenantFirstName: true,
      tenantLastName: true,
      status: true,
      expiresAt: true,
      acceptedAt: true,
      createdAt: true,
    },
  },
} as const;

export async function getCurrentOwnerProfileForProperties() {
  const user = await requireRole(["OWNER"]);

  const ownerProfile = await prisma.ownerProfile.findUnique({
    where: { userId: user.id },
    select: {
      id: true,
      userId: true,
    },
  });

  if (!ownerProfile) {
    throw new AppError(
      "NOT_FOUND",
      "No owner profile exists for this RentFlow user.",
    );
  }

  return { user, ownerProfile };
}

export async function listOwnerProperties() {
  const { ownerProfile } = await getCurrentOwnerProfileForProperties();

  return prisma.property.findMany({
    where: {
      ownerProfileId: ownerProfile.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: propertyListSelect,
  });
}

export async function getOwnerPropertyById(propertyId: string) {
  const parsedPropertyId = propertyIdSchema.parse(propertyId);
  const { ownerProfile } = await getCurrentOwnerProfileForProperties();

  return prisma.property.findFirst({
    where: {
      id: parsedPropertyId,
      ownerProfileId: ownerProfile.id,
    },
    select: propertyDetailSelect,
  });
}
