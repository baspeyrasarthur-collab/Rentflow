export type StorageProviderName = "mock" | "local" | "s3" | "supabase";

export type UploadFileInput = {
  bucket: "receipts";
  key: string;
  contentType: "application/pdf";
  body: Buffer;
};

export type StoredFile = {
  provider: StorageProviderName;
  key: string;
  url: string;
};

export type StorageProvider = {
  uploadFile(input: UploadFileInput): Promise<StoredFile>;
  getSignedUrl(key: string): Promise<string>;
};
