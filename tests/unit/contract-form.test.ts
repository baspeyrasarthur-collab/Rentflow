import { describe, expect, it } from "vitest";

import {
  parseOwnerIndividualContractCreateFormData,
  parseOwnerIndividualContractUpdateFormData,
} from "@/server/owner/contract-form";

function createValidContractFormData() {
  const formData = new FormData();
  formData.set("startDate", "2026-06-01");
  formData.set("endDate", "");
  formData.set("totalRentAmountInEuros", "950");
  formData.set("totalChargesAmountInEuros", "120");
  formData.set("depositAmountInEuros", "950");
  formData.set("currency", "EUR");
  formData.set("paymentDayOfMonth", "5");

  return formData;
}

describe("owner individual contract form parser", () => {
  it("parses valid contract creation form data", () => {
    const parsed = parseOwnerIndividualContractCreateFormData(
      createValidContractFormData(),
    );

    expect(parsed).toMatchObject({
      totalRentAmountInCents: 95000,
      totalChargesAmountInCents: 12000,
      depositAmountInCents: 95000,
      currency: "EUR",
      paymentDayOfMonth: 5,
    });
    expect(parsed.startDate).toBeInstanceOf(Date);
    expect(parsed.endDate).toBeUndefined();
  });

  it("rejects payment days outside 1 to 28", () => {
    const formData = createValidContractFormData();
    formData.set("paymentDayOfMonth", "29");

    expect(() =>
      parseOwnerIndividualContractCreateFormData(formData),
    ).toThrow();
  });

  it("converts decimal euro amounts to integer cents", () => {
    const formData = createValidContractFormData();
    formData.set("totalChargesAmountInEuros", "120.50");
    formData.set("depositAmountInEuros", "980,75");

    const parsed = parseOwnerIndividualContractCreateFormData(formData);

    expect(parsed.totalChargesAmountInCents).toBe(12050);
    expect(parsed.depositAmountInCents).toBe(98075);
  });

  it("rejects negative or invalid rent amounts", () => {
    const negativeRent = createValidContractFormData();
    negativeRent.set("totalRentAmountInEuros", "-1");

    expect(() =>
      parseOwnerIndividualContractCreateFormData(negativeRent),
    ).toThrow();

    const invalidRent = createValidContractFormData();
    invalidRent.set("totalRentAmountInEuros", "not-a-number");

    expect(() =>
      parseOwnerIndividualContractCreateFormData(invalidRent),
    ).toThrow();
  });

  it("does not read server-owned fields from form data", () => {
    const formData = createValidContractFormData();
    formData.set("ownerProfileId", "owner_from_client");
    formData.set("propertyId", "property_from_client");
    formData.set("contractType", "COLOCATION");
    formData.set("colocationMode", "LINKED_LEASES");
    formData.set("status", "ACTIVE");

    const parsed = parseOwnerIndividualContractCreateFormData(formData);

    expect(parsed).not.toHaveProperty("ownerProfileId");
    expect(parsed).not.toHaveProperty("propertyId");
    expect(parsed).not.toHaveProperty("contractType");
    expect(parsed).not.toHaveProperty("colocationMode");
    expect(parsed).not.toHaveProperty("status");
  });

  it("parses valid contract update form data", () => {
    const parsed = parseOwnerIndividualContractUpdateFormData(
      createValidContractFormData(),
    );

    expect(parsed).toMatchObject({
      totalRentAmountInCents: 95000,
      totalChargesAmountInCents: 12000,
      depositAmountInCents: 95000,
      currency: "EUR",
      paymentDayOfMonth: 5,
    });
    expect(parsed.startDate).toBeInstanceOf(Date);
    expect(parsed.endDate).toBeUndefined();
  });

  it("rejects empty contract update form data", () => {
    expect(() =>
      parseOwnerIndividualContractUpdateFormData(new FormData()),
    ).toThrow();
  });

  it("rejects invalid contract update payment days and amounts", () => {
    const invalidDay = createValidContractFormData();
    invalidDay.set("paymentDayOfMonth", "0");

    expect(() =>
      parseOwnerIndividualContractUpdateFormData(invalidDay),
    ).toThrow();

    const invalidRent = createValidContractFormData();
    invalidRent.set("totalRentAmountInEuros", "950.555");

    expect(() =>
      parseOwnerIndividualContractUpdateFormData(invalidRent),
    ).toThrow();
  });

  it("does not read server-owned fields during contract update parsing", () => {
    const formData = createValidContractFormData();
    formData.set("ownerProfileId", "owner_from_client");
    formData.set("propertyId", "property_from_client");
    formData.set("contractType", "COLOCATION");
    formData.set("colocationMode", "LINKED_LEASES");
    formData.set("status", "ACTIVE");

    const parsed = parseOwnerIndividualContractUpdateFormData(formData);

    expect(parsed).not.toHaveProperty("ownerProfileId");
    expect(parsed).not.toHaveProperty("propertyId");
    expect(parsed).not.toHaveProperty("contractType");
    expect(parsed).not.toHaveProperty("colocationMode");
    expect(parsed).not.toHaveProperty("status");
  });
});
