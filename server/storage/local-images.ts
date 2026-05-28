import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { basename, isAbsolute, join, relative, resolve } from "node:path";

import { AppError } from "@/server/errors";

export const MAX_LOCAL_IMAGE_SIZE_IN_BYTES = 5 * 1024 * 1024;

const ALLOWED_LOCAL_IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

type AllowedLocalImageContentType = keyof typeof ALLOWED_LOCAL_IMAGE_TYPES;

function assertUploadPathInsideTarget(input: {
  directoryName: string;
  filename: string;
}) {
  const targetDirectory = resolve(
    join(process.cwd(), "public", "uploads", input.directoryName),
  );
  const targetPath = resolve(targetDirectory, input.filename);
  const relativePath = relative(targetDirectory, targetPath);

  if (
    relativePath.startsWith("..") ||
    relativePath === "" ||
    isAbsolute(relativePath)
  ) {
    throw new AppError("BAD_REQUEST", "Invalid image path.");
  }

  return {
    targetDirectory,
    targetPath,
  };
}

function getLocalImageExtension(contentType: string) {
  return ALLOWED_LOCAL_IMAGE_TYPES[contentType as AllowedLocalImageContentType];
}

export function validateLocalImageFile(
  file: File,
  messages: {
    empty: string;
    invalidType: string;
    tooLarge: string;
  },
) {
  if (file.size <= 0) {
    throw new AppError("BAD_REQUEST", messages.empty);
  }

  if (file.size > MAX_LOCAL_IMAGE_SIZE_IN_BYTES) {
    throw new AppError("BAD_REQUEST", messages.tooLarge);
  }

  const extension = getLocalImageExtension(file.type);

  if (!extension) {
    throw new AppError("BAD_REQUEST", messages.invalidType);
  }

  return {
    extension,
  };
}

export async function uploadLocalImage(input: {
  bucketPath: string;
  directoryName: string;
  file: File;
  filenamePrefix: string;
  messages: {
    empty: string;
    invalidType: string;
    tooLarge: string;
  };
}) {
  const { extension } = validateLocalImageFile(input.file, input.messages);
  const filename = `${input.filenamePrefix}-${randomUUID()}.${extension}`;
  const { targetDirectory, targetPath } = assertUploadPathInsideTarget({
    directoryName: input.directoryName,
    filename,
  });
  const arrayBuffer = await input.file.arrayBuffer();

  await mkdir(targetDirectory, { recursive: true });
  await writeFile(targetPath, Buffer.from(arrayBuffer));

  return {
    key: filename,
    url: `${input.bucketPath}${filename}`,
  };
}

export async function removeLocalImageByUrl(input: {
  bucketPath: string;
  directoryName: string;
  imageUrl: string | null;
}) {
  if (!input.imageUrl?.startsWith(input.bucketPath)) {
    return;
  }

  const filename = basename(input.imageUrl);
  const { targetPath } = assertUploadPathInsideTarget({
    directoryName: input.directoryName,
    filename,
  });

  await unlink(targetPath).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOENT") {
      throw error;
    }
  });
}
