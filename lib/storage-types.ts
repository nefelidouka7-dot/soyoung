export type StoredFile = {
  url: string;
  key: string;
  contentType: string;
};

export interface StorageAdapter {
  upload(
    file: Buffer,
    filename: string,
    contentType: string
  ): Promise<StoredFile>;
  delete?(key: string): Promise<void>;
}
