export interface PresignedRequest {
  expiresAt: Date;
  headers: Record<string, string>;
  url: string;
}

export interface ObjectInfo {
  contentType: string | undefined;
  size: number;
}

export interface StorageProvider {
  delete: (key: string) => Promise<void>;
  head: (key: string) => Promise<ObjectInfo | null>;
  presignGet: (
    key: string,
    expiresInSeconds?: number
  ) => Promise<PresignedRequest>;
  presignPut: (input: {
    contentType: string;
    expiresInSeconds?: number;
    key: string;
    size: number;
  }) => Promise<PresignedRequest>;
  put: (input: {
    body: Uint8Array;
    contentType: string;
    key: string;
  }) => Promise<void>;
}
