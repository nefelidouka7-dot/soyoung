/**
 * Storage adapter — Cloudflare R2 when configured, otherwise local filesystem.
 * R2 is S3-compatible; swap is driven by env (see .env.example).
 */

import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

export type StoredFile = {
  url: string;
  key: string;
  contentType: string;
};

export interface StorageAdapter {
  upload(file: Buffer, filename: string, contentType: string): Promise<StoredFile>;
  delete?(key: string): Promise<void>;
}

const ALLOWED_IMAGE_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const ALLOWED_VIDEO_MIME: Record<string, string> = {
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
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

function sniffVideoExt(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;
  // ISO BMFF (MP4 / MOV): ....ftyp
  if (buffer.toString("ascii", 4, 8) === "ftyp") {
    const brand = buffer.toString("ascii", 8, 12);
    if (brand.startsWith("qt")) return ".mov";
    return ".mp4";
  }
  // EBML / WebM
  if (
    buffer[0] === 0x1a &&
    buffer[1] === 0x45 &&
    buffer[2] === 0xdf &&
    buffer[3] === 0xa3
  ) {
    return ".webm";
  }
  return null;
}

function normalizeMime(contentType: string): string {
  return contentType.toLowerCase().split(";")[0]?.trim() ?? "";
}

/** Validate image or video bytes; returns extension + canonical mime. */
function prepareMediaUpload(
  file: Buffer,
  contentType: string
): { ext: string; mime: string } {
  const mime = normalizeMime(contentType);

  if (ALLOWED_IMAGE_MIME[mime]) {
    const sniffed = sniffImageExt(file);
    if (!sniffed) {
      throw new Error("File content is not a valid image.");
    }
    return { ext: sniffed, mime };
  }

  if (ALLOWED_VIDEO_MIME[mime]) {
    const sniffed = sniffVideoExt(file);
    if (!sniffed) {
      throw new Error("File content is not a valid video.");
    }
    // Prefer container sniff; map .mov uploads to video/mp4 only if ftyp is mp4-ish
    if (sniffed === ".webm") {
      return { ext: ".webm", mime: "video/webm" };
    }
    if (sniffed === ".mov") {
      return { ext: ".mov", mime: "video/quicktime" };
    }
    return { ext: ".mp4", mime: "video/mp4" };
  }

  throw new Error(
    "Only JPEG, PNG, WebP, GIF images and MP4/WebM videos are allowed."
  );
}

function objectKey(ext: string, kind: "image" | "video"): string {
  const folder = kind === "video" ? "videos" : "uploads";
  return `${folder}/${randomUUID()}${ext}`;
}

function mediaKind(mime: string): "image" | "video" {
  return mime.startsWith("video/") ? "video" : "image";
}

class LocalStorageAdapter implements StorageAdapter {
  private dir: string;

  constructor() {
    this.dir = process.env.UPLOAD_DIR ?? "./public/uploads";
  }

  async upload(
    file: Buffer,
    _filename: string,
    contentType: string
  ): Promise<StoredFile> {
    const { ext, mime } = prepareMediaUpload(file, contentType);
    await mkdir(this.dir, { recursive: true });
    const filename = `${randomUUID()}${ext}`;
    await writeFile(path.join(this.dir, filename), file);
    const publicPath =
      mediaKind(mime) === "video"
        ? `/uploads/${filename}`
        : `/uploads/${filename}`;
    return {
      url: publicPath,
      key: filename,
      contentType: mime,
    };
  }

  async delete(key: string): Promise<void> {
    const filename = path.basename(key);
    try {
      await unlink(path.join(this.dir, filename));
    } catch {
      // ignore missing file
    }
  }
}

type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicUrl: string;
  /** Empty = default R2 namespace. Use "eu" for EU jurisdiction buckets. */
  jurisdiction: string;
};

function r2Endpoint(accountId: string, jurisdiction: string): string {
  // EU/FedRAMP buckets live on a separate S3 hostname; default endpoint cannot see them.
  const juris = jurisdiction.trim().toLowerCase();
  if (juris && juris !== "default") {
    return `https://${accountId}.${juris}.r2.cloudflarestorage.com`;
  }
  return `https://${accountId}.r2.cloudflarestorage.com`;
}

function readR2Config(): R2Config | null {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucket = process.env.R2_BUCKET?.trim();
  const publicUrl = process.env.R2_PUBLIC_URL?.trim().replace(/\/$/, "");
  const jurisdiction = process.env.R2_JURISDICTION?.trim() ?? "";

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
    return null;
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket,
    publicUrl,
    jurisdiction,
  };
}

class R2StorageAdapter implements StorageAdapter {
  private client: S3Client;
  private bucket: string;
  private publicUrl: string;

  constructor(config: R2Config) {
    this.bucket = config.bucket;
    this.publicUrl = config.publicUrl;
    this.client = new S3Client({
      region: "auto",
      endpoint: r2Endpoint(config.accountId, config.jurisdiction),
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async upload(
    file: Buffer,
    _filename: string,
    contentType: string
  ): Promise<StoredFile> {
    const { ext, mime } = prepareMediaUpload(file, contentType);
    const key = objectKey(ext, mediaKind(mime));

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file,
        ContentType: mime,
        CacheControl: "public, max-age=31536000, immutable",
      })
    );

    return {
      url: `${this.publicUrl}/${key}`,
      key,
      contentType: mime,
    };
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );
  }
}

function createStorage(): StorageAdapter {
  const r2 = readR2Config();
  if (r2) return new R2StorageAdapter(r2);
  return new LocalStorageAdapter();
}

export const storage: StorageAdapter = createStorage();

/** True when uploads go to Cloudflare R2 instead of local disk. */
export function isR2Enabled(): boolean {
  return readR2Config() !== null;
}
