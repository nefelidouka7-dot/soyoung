/**
 * Storage adapter — local filesystem now, swap implementation for S3/R2/Cloudinary.
 */

import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export type StoredFile = {
  url: string;
  key: string;
  contentType: string;
};

export interface StorageAdapter {
  upload(file: Buffer, filename: string, contentType: string): Promise<StoredFile>;
  delete?(key: string): Promise<void>;
}

const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

function sniffImageExt(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return ".jpg";
  }
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return ".png";
  }
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return ".gif";
  }
  if (
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return ".webp";
  }
  return null;
}

class LocalStorageAdapter implements StorageAdapter {
  private dir: string;

  constructor() {
    this.dir = process.env.UPLOAD_DIR ?? "./public/uploads";
  }

  async upload(
    file: Buffer,
    filename: string,
    contentType: string
  ): Promise<StoredFile> {
    const mime = contentType.toLowerCase().split(";")[0]?.trim() ?? "";
    if (!ALLOWED_MIME[mime]) {
      throw new Error("Only JPEG, PNG, WebP, and GIF images are allowed.");
    }

    const sniffed = sniffImageExt(file);
    if (!sniffed) {
      throw new Error("File content is not a valid image.");
    }

    // Prefer sniffed type over client-declared extension (blocks .svg spoofing).
    const ext = sniffed;
    await mkdir(this.dir, { recursive: true });
    const key = `${randomUUID()}${ext}`;
    await writeFile(path.join(this.dir, key), file);
    return {
      url: `/uploads/${key}`,
      key,
      contentType: mime,
    };
  }
}

export const storage: StorageAdapter = new LocalStorageAdapter();
