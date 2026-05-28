import { describe, expect, it } from "vitest";

import {
  MAX_PROFILE_IMAGE_SIZE_IN_BYTES,
  validateProfileImageFile,
} from "@/server/storage/profile-images";

function createFile(options: {
  contentType: string;
  name?: string;
  size?: number;
}) {
  const bytes = new Uint8Array(options.size ?? 16);

  return new File([bytes], options.name ?? "profile-image", {
    type: options.contentType,
  });
}

describe("profile image storage validation", () => {
  it.each([
    ["image/jpeg", "jpg"],
    ["image/png", "png"],
    ["image/webp", "webp"],
  ])("accepts %s files", (contentType, extension) => {
    expect(validateProfileImageFile(createFile({ contentType }))).toEqual({
      extension,
    });
  });

  it("refuses non-image files", () => {
    expect(() =>
      validateProfileImageFile(createFile({ contentType: "text/plain" })),
    ).toThrow("Profile image must be a JPG, PNG or WebP file.");
  });

  it("refuses oversized files", () => {
    expect(() =>
      validateProfileImageFile(
        createFile({
          contentType: "image/webp",
          size: MAX_PROFILE_IMAGE_SIZE_IN_BYTES + 1,
        }),
      ),
    ).toThrow("Profile image must be 5 MB or less.");
  });
});
