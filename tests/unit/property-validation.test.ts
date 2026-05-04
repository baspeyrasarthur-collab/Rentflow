import { describe, expect, it } from "vitest";

import {
  parseOwnerPropertyCreateFormData,
  parseOwnerPropertyUpdateFormData,
} from "@/server/owner/property-form";
import {
  propertyCreateSchema,
  propertyUpdateSchema,
} from "@/server/validation";

const validPropertyInput = {
  name: "Appartement Republique",
  addressLine1: "10 rue de la Paix",
  addressLine2: "",
  postalCode: "75011",
  city: "Paris",
  country: "FR",
  propertyType: "APARTMENT",
  surfaceAreaSqm: 42,
  furnished: true,
  isColocation: false,
};

describe("property validation schemas", () => {
  it("accepts a valid property creation payload", () => {
    const parsed = propertyCreateSchema.parse(validPropertyInput);

    expect(parsed).toMatchObject({
      name: "Appartement Republique",
      addressLine2: undefined,
      country: "FR",
      propertyType: "APARTMENT",
      surfaceAreaSqm: 42,
      furnished: true,
      isColocation: false,
    });
  });

  it("rejects an empty name", () => {
    expect(() =>
      propertyCreateSchema.parse({
        ...validPropertyInput,
        name: "",
      }),
    ).toThrow();
  });

  it("rejects an invalid property type", () => {
    expect(() =>
      propertyCreateSchema.parse({
        ...validPropertyInput,
        propertyType: "CASTLE",
      }),
    ).toThrow();
  });

  it("rejects negative or non-integer surface areas", () => {
    expect(() =>
      propertyCreateSchema.parse({
        ...validPropertyInput,
        surfaceAreaSqm: -1,
      }),
    ).toThrow();

    expect(() =>
      propertyCreateSchema.parse({
        ...validPropertyInput,
        surfaceAreaSqm: 42.5,
      }),
    ).toThrow();
  });

  it("rejects ownerProfileId and status in creation payloads", () => {
    expect(() =>
      propertyCreateSchema.parse({
        ...validPropertyInput,
        ownerProfileId: "owner_profile_1",
      }),
    ).toThrow();

    expect(() =>
      propertyCreateSchema.parse({
        ...validPropertyInput,
        status: "ACTIVE",
      }),
    ).toThrow();
  });

  it("parses property creation form data", () => {
    const formData = new FormData();
    formData.set("name", "Maison Test");
    formData.set("addressLine1", "12 rue du Test");
    formData.set("addressLine2", "");
    formData.set("postalCode", "33000");
    formData.set("city", "Bordeaux");
    formData.set("country", "fr");
    formData.set("propertyType", "HOUSE");
    formData.set("surfaceAreaSqm", "95");
    formData.set("furnished", "on");

    const parsed = parseOwnerPropertyCreateFormData(formData);

    expect(parsed).toMatchObject({
      name: "Maison Test",
      addressLine2: undefined,
      country: "FR",
      propertyType: "HOUSE",
      surfaceAreaSqm: 95,
      furnished: true,
      isColocation: false,
    });
  });

  it("rejects invalid property creation form surface values", () => {
    const formData = new FormData();
    formData.set("name", "Studio Test");
    formData.set("addressLine1", "5 rue du Test");
    formData.set("postalCode", "69000");
    formData.set("city", "Lyon");
    formData.set("country", "FR");
    formData.set("propertyType", "APARTMENT");
    formData.set("surfaceAreaSqm", "24.5");

    expect(() => parseOwnerPropertyCreateFormData(formData)).toThrow();
  });

  it("accepts a valid property update payload", () => {
    const parsed = propertyUpdateSchema.parse({
      name: "Appartement mis a jour",
      surfaceAreaSqm: 55,
    });

    expect(parsed).toMatchObject({
      name: "Appartement mis a jour",
      surfaceAreaSqm: 55,
    });
  });

  it("rejects an empty property update payload", () => {
    expect(() => propertyUpdateSchema.parse({})).toThrow();
    expect(() => parseOwnerPropertyUpdateFormData(new FormData())).toThrow();
  });

  it("rejects ownerProfileId and status in update payloads", () => {
    expect(() =>
      propertyUpdateSchema.parse({
        ownerProfileId: "owner_profile_1",
      }),
    ).toThrow();

    expect(() =>
      propertyUpdateSchema.parse({
        status: "ACTIVE",
      }),
    ).toThrow();
  });

  it("parses property update form data with checkbox presence markers", () => {
    const formData = new FormData();
    formData.set("name", "Appartement Update");
    formData.set("addressLine1", "14 rue du Test");
    formData.set("postalCode", "44000");
    formData.set("city", "Nantes");
    formData.set("country", "FR");
    formData.set("propertyType", "APARTMENT");
    formData.set("surfaceAreaSqm", "");
    formData.set("furnishedPresent", "1");
    formData.set("isColocationPresent", "1");
    formData.set("isColocation", "on");

    const parsed = parseOwnerPropertyUpdateFormData(formData);

    expect(parsed).toMatchObject({
      name: "Appartement Update",
      furnished: false,
      isColocation: true,
    });
    expect(parsed).not.toHaveProperty("surfaceAreaSqm");
  });
});
