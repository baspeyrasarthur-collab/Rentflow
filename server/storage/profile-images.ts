import {
  MAX_LOCAL_IMAGE_SIZE_IN_BYTES,
  removeLocalImageByUrl,
  uploadLocalImage,
  validateLocalImageFile,
} from "@/server/storage/local-images";

const PROFILE_IMAGE_BUCKET_PATH = "/uploads/profiles/";
const PROFILE_IMAGE_DIRECTORY_NAME = "profiles";
const MAX_PROFILE_IMAGE_SIZE_IN_BYTES = MAX_LOCAL_IMAGE_SIZE_IN_BYTES;

const profileImageMessages = {
  empty: "Profile image file is required.",
  invalidType: "Profile image must be a JPG, PNG or WebP file.",
  tooLarge: "Profile image must be 5 MB or less.",
};

export function validateProfileImageFile(file: File) {
  return validateLocalImageFile(file, profileImageMessages);
}

export async function uploadLocalProfileImage(input: {
  file: File;
  userId: string;
}) {
  return uploadLocalImage({
    bucketPath: PROFILE_IMAGE_BUCKET_PATH,
    directoryName: PROFILE_IMAGE_DIRECTORY_NAME,
    file: input.file,
    filenamePrefix: input.userId,
    messages: profileImageMessages,
  });
}

export async function removeLocalProfileImageByUrl(imageUrl: string | null) {
  return removeLocalImageByUrl({
    bucketPath: PROFILE_IMAGE_BUCKET_PATH,
    directoryName: PROFILE_IMAGE_DIRECTORY_NAME,
    imageUrl,
  });
}

export { MAX_PROFILE_IMAGE_SIZE_IN_BYTES };
