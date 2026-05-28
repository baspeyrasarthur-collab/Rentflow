import type {
  PropertyCreateInput,
  PropertyUpdateInput,
} from "@/server/validation";

type OwnerPropertyCreateData = {
  name: string;
  addressLine1: string;
  addressLine2?: string;
  postalCode: string;
  city: string;
  country: string;
  propertyType: PropertyCreateInput["propertyType"];
  surfaceAreaSqm?: number;
  furnished: boolean;
  isColocation: boolean;
  ownerProfileId: string;
  status: "DRAFT";
};

type OwnerPropertyUpdateData = {
  name?: string;
  addressLine1?: string;
  addressLine2?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  propertyType?: PropertyUpdateInput["propertyType"];
  surfaceAreaSqm?: number;
  furnished?: boolean;
  isColocation?: boolean;
};

function writeDefined(
  input: Record<string, unknown>,
  key: string,
  value: unknown,
) {
  if (value !== undefined) {
    input[key] = value;
  }
}

export function buildOwnerPropertyCreateData(
  input: PropertyCreateInput,
  ownerProfileId: string,
): OwnerPropertyCreateData {
  return {
    name: input.name,
    addressLine1: input.addressLine1,
    addressLine2: input.addressLine2,
    postalCode: input.postalCode,
    city: input.city,
    country: input.country,
    propertyType: input.propertyType,
    surfaceAreaSqm: input.surfaceAreaSqm,
    furnished: input.furnished,
    isColocation: input.isColocation,
    ownerProfileId,
    status: "DRAFT",
  };
}

export function buildOwnerPropertyUpdateData(
  input: PropertyUpdateInput,
): OwnerPropertyUpdateData {
  const data: OwnerPropertyUpdateData = {};

  writeDefined(data, "name", input.name);
  writeDefined(data, "addressLine1", input.addressLine1);
  writeDefined(data, "addressLine2", input.addressLine2);
  writeDefined(data, "postalCode", input.postalCode);
  writeDefined(data, "city", input.city);
  writeDefined(data, "country", input.country);
  writeDefined(data, "propertyType", input.propertyType);
  writeDefined(data, "surfaceAreaSqm", input.surfaceAreaSqm);
  writeDefined(data, "furnished", input.furnished);
  writeDefined(data, "isColocation", input.isColocation);

  return data;
}

export function buildOwnerPropertyArchiveData() {
  return { status: "ARCHIVED" as const };
}
