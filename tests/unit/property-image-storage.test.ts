import { describe, expect, it } from "vitest";

import {
  MAX_PROPERTY_IMAGE_SIZE_IN_BYTES,
  validatePropertyImageFile,
} from "@/server/storage/property-images";

function createFile(options: {
  contentType: string;
  name?: string;
  size?: number;
}) {
  const bytes = new Uint8Array(options.size ?? 16);

  return new File([bytes], options.name ?? "property-image", {
    type: options.contentType,
  });
}

describe("property image storage validation", () => {
  it.each([
    ["image/jpeg", "jpg"],
    ["image/png", "png"],
    ["image/webp", "webp"],
  ])("accepts %s files", (contentType, extension) => {
    expect(validatePropertyImageFile(createFile({ contentType }))).toEqual({
      extension,
    });
  });

  it("refuses non-image files", () => {
    expect(() =>
      validatePropertyImageFile(createFile({ contentType: "text/plain" })),
    ).toThrow("Property image must be a JPG, PNG or WebP file.");
  });

  it("refuses empty files", () => {
    expect(() =>
      validatePropertyImageFile(
        createFile({ contentType: "image/png", size: 0 }),
      ),
    ).toThrow("Property image file is required.");
  });

  it("refuses files above the maximum size", () => {
    expect(() =>
      validatePropertyImageFile(
        createFile({
          contentType: "image/jpeg",
          size: MAX_PROPERTY_IMAGE_SIZE_IN_BYTES + 1,
        }),
      ),
    ).toThrow("Property image must be 5 MB or less.");
  });
});
