type OwnerTenantRequestRoutingInput = {
  category: string;
  propertyId: string;
  rentalContractId: string | null;
};

export function getOwnerTenantRequestPrimaryHref(requestId: string) {
  return `/owner/tenants?focus=request-${requestId}`;
}

export function getOwnerTenantRequestSecondaryHref(
  request: OwnerTenantRequestRoutingInput,
) {
  if (request.category === "PAYMENT") {
    return "/owner/payments";
  }

  if (request.category === "RECEIPT") {
    return "/owner/receipts";
  }

  if (request.category === "DOCUMENT" && request.rentalContractId) {
    return `/owner/properties/${request.propertyId}/contracts/${request.rentalContractId}`;
  }

  if (request.category === "REPAIR") {
    return `/owner/properties/${request.propertyId}`;
  }

  if (request.rentalContractId) {
    return `/owner/properties/${request.propertyId}/contracts/${request.rentalContractId}`;
  }

  return null;
}
