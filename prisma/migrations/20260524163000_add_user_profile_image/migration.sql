-- Add optional single profile image support for multi-profile users.
ALTER TABLE "User" ADD COLUMN "profileImageUrl" TEXT;
ALTER TABLE "User" ADD COLUMN "profileImageStorageKey" TEXT;
