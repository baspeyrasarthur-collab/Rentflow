import { prisma } from "@/server/db/prisma";
import { getCurrentOwnerProfileForProperties } from "@/server/owner/properties";

const ownerContractOverviewSelect = {
  id: true,
  propertyId: true,
  contractType: true,
  colocationMode: true,
  status: true,
  startDate: true,
  endDate: true,
  totalRentAmountInCents: true,
  totalChargesAmountInCents: true,
  currency: true,
  paymentDayOfMonth: true,
  updatedAt: true,
  property: {
    select: {
      id: true,
      name: true,
      city: true,
      status: true,
    },
  },
  contractTenants: {
    where: {
      status: "ACTIVE",
    },
    take: 1,
    select: {
      id: true,
    },
  },
  _count: {
    select: {
      contractTenants: true,
      invitations: true,
      payments: true,
      receipts: true,
    },
  },
} as const;

export async function getOwnerContractsOverview() {
  const { ownerProfile } = await getCurrentOwnerProfileForProperties();

  const contracts = await prisma.rentalContract.findMany({
    where: {
      ownerProfileId: ownerProfile.id,
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: ownerContractOverviewSelect,
  });

  const draftContracts = contracts.filter(
    (contract) => contract.status === "DRAFT",
  );
  const activeContracts = contracts.filter(
    (contract) => contract.status === "ACTIVE",
  );
  const pausedOrFinishedContracts = contracts.filter((contract) =>
    [
      "SUSPENSION_REQUESTED",
      "SUSPENDED",
      "TERMINATION_REQUESTED",
      "TERMINATED",
      "ARCHIVED",
    ].includes(contract.status),
  );
  const contractsWithoutActiveTenant = contracts.filter(
    (contract) =>
      contract.status !== "ARCHIVED" && contract.contractTenants.length === 0,
  );

  return {
    summary: {
      totalContracts: contracts.length,
      draftContracts: draftContracts.length,
      activeContracts: activeContracts.length,
      pausedOrFinishedContracts: pausedOrFinishedContracts.length,
    },
    contracts,
    draftContracts,
    contractsWithoutActiveTenant,
  };
}
