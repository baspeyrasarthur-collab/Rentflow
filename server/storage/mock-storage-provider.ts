import type {
  StorageProvider,
  StoredFile,
  UploadFileInput,
} from "@/server/storage/types";

export class MockStorageProvider implements StorageProvider {
  async uploadFile(input: UploadFileInput): Promise<StoredFile> {
    return {
      provider: "mock",
      key: input.key,
      url: `mock://storage/${input.bucket}/${input.key}`,
    };
  }

  async getSignedUrl(key: string): Promise<string> {
    return `mock://storage/${key}`;
  }
}
