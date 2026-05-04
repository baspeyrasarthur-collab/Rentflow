import { MockStorageProvider } from "@/server/storage/mock-storage-provider";
import type { StorageProvider } from "@/server/storage/types";

export function getStorageProvider(): StorageProvider {
  return new MockStorageProvider();
}
