import {
  MAX_LOCAL_IMAGE_SIZE_IN_BYTES,
  removeLocalImageByUrl,
  uploadLocalImage,
  validateLocalImageFile,
} from "@/server/storage/local-images";

const PROPERTY_IMAGE_BUCKET_PATH = "/uploads/properties/";
const PROPERTY_IMAGE_DIRECTORY_NAME = "properties";
const MAX_PROPERTY_IMAGE_SIZE_IN_BYTES = MAX_LOCAL_IMAGE_SIZE_IN_BYTES;

const propertyImageMessages = {
  empty: "Property image file is required.",
  invalidType: "Property image must be a JPG, PNG or WebP file.",
  tooLarge: "Property image must be 5 MB or less.",
};

export function validatePropertyImageFile(file: File) {
  return validateLocalImageFile(file, propertyImageMessages);
}

export async function uploadLocalPropertyImage(input: {
  file: File;
  propertyId: string;
}) {
  return uploadLocalImage({
    bucketPath: PROPERTY_IMAGE_BUCKET_PATH,
    directoryName: PROPERTY_IMAGE_DIRECTORY_NAME,
    file: input.file,
    filenamePrefix: input.propertyId,
    messages: propertyImageMessages,
  });
}

export async function removeLocalPropertyImageByUrl(imageUrl: string | null) {
  return removeLocalImageByUrl({
    bucketPath: PROPERTY_IMAGE_BUCKET_PATH,
    directoryName: PROPERTY_IMAGE_DIRECTORY_NAME,
    imageUrl,
  });
}

export { MAX_PROPERTY_IMAGE_SIZE_IN_BYTES };
