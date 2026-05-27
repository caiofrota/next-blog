export type PutObjectInput = {
  key: string;
  body: Buffer;
  contentType: string;
};

export type PutObjectResult = {
  key: string;
  url: string;
};

export interface StorageProvider {
  putObject(input: PutObjectInput): Promise<PutObjectResult>;
  deleteObject(key: string): Promise<void>;
  getPublicUrl(key: string): string;
}
