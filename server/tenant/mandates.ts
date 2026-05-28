import { z } from "zod";

import { requireTenantAccess } from "@/server/auth/access";
import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/errors";

const contractTenantIdSchema = z.string().trim().min(1);

const activeMandateStatuses = ["CREATED", "ACCEPTED"] as const;

export type TenantMandateContractTenant = {
  tenantProfileId: string | null;
  status: string;
};

export type TenantMandateSummary = {
  status: string;
};

export function parseContractTenantId(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    throw new AppError("BAD_REQUEST", "A contract tenant id is required.");
  }

  return contractTenantIdSchema.parse(value);
}

export function isContractTenantEligibleForMockMandate(
  contractTenant: TenantMandateContractTenant,
  tenantProfileId: string,
) {
  return (
    contractTenant.tenantProfileId === tenantProfileId &&
    contractTenant.status === "ACTIVE"
  );
}

export function hasActiveMandate(mandates: TenantMandateSummary[]) {
  return mandates.some((mandate) =>
    activeMandateStatuses.includes(
      mandate.status as (typeof activeMandateStatuses)[number],
    ),
  );
}

export function buildAcceptedMockMandateData(input: {
  tenantProfileId: string;
  rentalContractId: string;
  contractTenantId: string;
  providerMandateId: string;
  acceptedAt: Date;
}) {
  return {
    tenantProfileId: input.tenantProfileId,
    rentalContractId: input.rentalContractId,
    contractTenantId: input.contractTenantId,
    provider: "MOCK" as const,
    providerMandateId: input.providerMandateId,
    status: "ACCEPTED" as const,
    ibanLast4: "0000",
    acceptedAt: input.acceptedAt,
  };
}

export async function getCurrentTenantProfileForMandates() {
  return requireTenantAccess();
}

export async function getTenantContractForMandate(contractTenantId: string) {
  const parsedContractTenantId = contractTenantIdSchema.parse(contractTenantId);
  const { user, tenantProfile } = await getCurrentTenantProfileForMandates();

  const contractTenant = await prisma.contractTenant.findFirst({
    where: {
      id: parsedContractTenantId,
      tenantProfileId: tenantProfile.id,
    },
    select: {
      id: true,
      tenantProfileId: true,
      rentalContractId: true,
      status: true,
      rentalContract: {
        select: {
          id: true,
          status: true,
        },
      },
      paymentMandates: {
        where: {
          tenantProfileId: tenantProfile.id,
          status: {
            in: [...activeMandateStatuses],
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
        select: {
          id: true,
          provider: true,
          providerMandateId: true,
          status: true,
        },
      },
    },
  });

  if (!contractTenant) {
    throw new AppError(
      "NOT_FOUND",
      "No tenant contract exists for this tenant profile.",
    );
  }

  if (
    !isContractTenantEligibleForMockMandate(contractTenant, tenantProfile.id)
  ) {
    throw new AppError(
      "CONFLICT",
      "A mock mandate can only be accepted for an active tenant attachment.",
    );
  }

  if (!contractTenant.rentalContract) {
    throw new AppError(
      "NOT_FOUND",
      "No rental contract exists for this tenant attachment.",
    );
  }

  return {
    user,
    tenantProfile,
    contractTenant,
    existingMandate: contractTenant.paymentMandates[0] ?? null,
  };
}
