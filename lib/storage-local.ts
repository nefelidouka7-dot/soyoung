/**
 * Local disk uploads — development / non-Vercel only.
 * Kept in a separate module so R2 production builds do not pull fs tracing
 * of the whole repo into the server bundle.
 */
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import type { StorageAdapter, StoredFile } from "@/lib/storage-types";

function localUploadsDir(): string {
  // Statically scoped under public/uploads + turbopackIgnore so Next does not
  // treat process.cwd() as "include the entire project" in the server bundle.
  return path.join(
    /*turbopackIgnore: true*/ process.cwd(),
    "public",
    "uploads"
  );
}

export function createLocalStorageAdapter(prepareMediaUpload: (
  file: Buffer,
  contentType: string
) => { ext: string; mime: string }): StorageAdapter {
  const dir = localUploadsDir();

  return {
    async upload(
      file: Buffer,
      _filename: string,
      contentType: string
    ): Promise<StoredFile> {
      const { ext, mime } = prepareMediaUpload(file, contentType);
      await mkdir(dir, { recursive: true });
      const filename = `${randomUUID()}${ext}`;
      await writeFile(
        path.join(/*turbopackIgnore: true*/ dir, filename),
        file
      );
      return {
        url: `/uploads/${filename}`,
        key: filename,
        contentType: mime,
      };
    },

    async delete(key: string): Promise<void> {
      const filename = path.basename(key);
      try {
        await unlink(path.join(/*turbopackIgnore: true*/ dir, filename));
      } catch {
        // ignore missing file
      }
    },
  };
}
