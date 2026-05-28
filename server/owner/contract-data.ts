import type {
  OwnerIndividualContractCreateInput,
  OwnerIndividualContractUpdateInput,
} from "@/server/validation";

type OwnerIndividualContractCreateData = {
  propertyId: string;
  ownerProfileId: string;
  contractType: "INDIVIDUAL";
  colocationMode: "NONE";
  status: "DRAFT";
  startDate: Date;
  endDate?: Date;
  totalRentAmountInCents: number;
  totalChargesAmountInCents: number;
  depositAmountInCents: number;
  currency: string;
  paymentDayOfMonth: number;
};

type OwnerIndividualContractUpdateData = {
  startDate?: Date;
  endDate?: Date;
  totalRentAmountInCents?: number;
  totalChargesAmountInCents?: number;
  depositAmountInCents?: number;
  currency?: string;
  paymentDayOfMonth?: number;
};

export function buildOwnerIndividualContractCreateData(
  input: OwnerIndividualContractCreateInput,
  propertyId: string,
  ownerProfileId: string,
): OwnerIndividualContractCreateData {
  return {
    propertyId,
    ownerProfileId,
    contractType: "INDIVIDUAL",
    colocationMode: "NONE",
    status: "DRAFT",
    startDate: input.startDate,
    endDate: input.endDate,
    totalRentAmountInCents: input.totalRentAmountInCents,
    totalChargesAmountInCents: input.totalChargesAmountInCents,
    depositAmountInCents: input.depositAmountInCents,
    currency: input.currency,
    paymentDayOfMonth: input.paymentDayOfMonth,
  };
}

function writeDefined<T extends Record<string, unknown>, K extends keyof T>(
  data: T,
  key: K,
  value: T[K] | undefined,
) {
  if (value !== undefined) {
    data[key] = value;
  }
}

export function buildOwnerIndividualContractUpdateData(
  input: OwnerIndividualContractUpdateInput,
): OwnerIndividualContractUpdateData {
  const data: OwnerIndividualContractUpdateData = {};

  writeDefined(data, "startDate", input.startDate);
  writeDefined(data, "endDate", input.endDate);
  writeDefined(data, "totalRentAmountInCents", input.totalRentAmountInCents);
  writeDefined(
    data,
    "totalChargesAmountInCents",
    input.totalChargesAmountInCents,
  );
  writeDefined(data, "depositAmountInCents", input.depositAmountInCents);
  writeDefined(data, "currency", input.currency);
  writeDefined(data, "paymentDayOfMonth", input.paymentDayOfMonth);

  return data;
}

export function canEditOwnerIndividualContract(status: string) {
  return status === "DRAFT";
}
