import { requireTenantAccess } from "@/server/auth/access";
import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/errors";
import { contractIdSchema } from "@/server/validation";

export async function getTenantContractDetail(contractId: string) {
  const parsedContractId = contractIdSchema.parse(contractId);
  const { tenantProfile } = await requireTenantAccess();

  const contract = await prisma.rentalContract.findFirst({
    where: {
      id: parsedContractId,
      contractTenants: {
        some: {
          tenantProfileId: tenantProfile.id,
        },
      },
    },
    select: {
      id: true,
      contractType: true,
      colocationMode: true,
      startDate: true,
      endDate: true,
      status: true,
      totalRentAmountInCents: true,
      totalChargesAmountInCents: true,
      depositAmountInCents: true,
      currency: true,
      paymentDayOfMonth: true,
      property: {
        select: {
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
          imageUrl: true,
        },
      },
      ownerProfile: {
        select: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
      contractTenants: {
        where: {
          tenantProfileId: tenantProfile.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          roomLabel: true,
          rentShareAmountInCents: true,
          chargesShareAmountInCents: true,
          depositShareAmountInCents: true,
          currency: true,
          startDate: true,
          endDate: true,
          status: true,
        },
      },
      payments: {
        where: {
          tenantProfileId: tenantProfile.id,
        },
        orderBy: {
          dueDate: "desc",
        },
        take: 6,
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
      receipts: {
        where: {
          tenantProfileId: tenantProfile.id,
          status: {
            not: "CANCELED",
          },
        },
        orderBy: {
          periodStart: "desc",
        },
        take: 6,
        select: {
          id: true,
          type: true,
          status: true,
          periodStart: true,
          periodEnd: true,
          totalAmountInCents: true,
          currency: true,
        },
      },
    },
  });

  if (!contract) {
    throw new AppError(
      "NOT_FOUND",
      "No contract exists for this tenant profile.",
    );
  }

  return contract;
}
