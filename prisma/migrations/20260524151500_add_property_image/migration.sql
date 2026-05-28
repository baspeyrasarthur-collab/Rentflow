-- Add optional single-image support for owner properties.
ALTER TABLE "Property" ADD COLUMN "imageUrl" TEXT;
ALTER TABLE "Property" ADD COLUMN "imageStorageKey" TEXT;
