/**
 * Generate short vertical reels from product images, upload to R2, attach to all products.
 * Usage: npx tsx scripts/seed-product-reels.ts
 */
import { config } from "dotenv";
config({ path: ".env" });

import { spawn } from "child_process";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { storage, isR2Enabled } from "../lib/storage";

const OUT_DIR = path.join(process.cwd(), ".tmp", "product-reels");

function run(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    let err = "";
    child.stderr.on("data", (d) => {
      err += String(d);
    });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} failed (${code}): ${err.slice(-800)}`));
    });
  });
}

async function resolveLocalImage(url: string): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = url.includes(".png") ? ".png" : ".jpg";
    const dest = path.join(OUT_DIR, `src-${Buffer.from(url).toString("hex").slice(0, 24)}${ext}`);
    await writeFile(dest, buf);
    return dest;
  }
  const rel = url.startsWith("/") ? url.slice(1) : url;
  const abs = path.join(process.cwd(), "public", rel);
  try {
    await readFile(abs);
    return abs;
  } catch {
    return null;
  }
}

async function makeReel(imagePath: string, outPath: string): Promise<void> {
  // 5s vertical 720x1280, gentle zoom, H.264, no audio — small & phone-friendly
  await run("ffmpeg", [
    "-y",
    "-loop",
    "1",
    "-i",
    imagePath,
    "-t",
    "5",
    "-vf",
    "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,zoompan=z='min(zoom+0.0012,1.12)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=125:s=720x1280:fps=25",
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-preset",
    "veryfast",
    "-crf",
    "28",
    "-an",
    "-movflags",
    "+faststart",
    outPath,
  ]);
}

async function main() {
  if (!isR2Enabled()) {
    console.error("R2 is not configured. Set R2_* env vars first.");
    process.exit(1);
  }

  await mkdir(OUT_DIR, { recursive: true });
  const prisma = new PrismaClient();

  const products = await prisma.product.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      images: {
        take: 1,
        orderBy: { sortOrder: "asc" },
        select: { url: true },
      },
    },
    orderBy: { slug: "asc" },
  });

  console.log(`Products: ${products.length}`);
  console.log(`R2 enabled: true`);

  const cache = new Map<string, { videoUrl: string; posterUrl: string }>();
  let ok = 0;
  let fail = 0;

  for (const product of products) {
    const poster = product.images[0]?.url ?? "/images/placeholder-product.svg";
    const cacheKey = poster;

    try {
      let urls = cache.get(cacheKey);
      if (!urls) {
        const localImage = await resolveLocalImage(poster);
        if (!localImage) {
          throw new Error(`Missing image for ${product.slug}: ${poster}`);
        }
        const reelPath = path.join(
          OUT_DIR,
          `${Buffer.from(cacheKey).toString("hex").slice(0, 20)}.mp4`
        );
        console.log(`encode ${product.slug} ← ${poster}`);
        await makeReel(localImage, reelPath);
        const buf = await readFile(reelPath);
        const stored = await storage.upload(buf, `${product.slug}.mp4`, "video/mp4");
        urls = { videoUrl: stored.url, posterUrl: poster };
        cache.set(cacheKey, urls);
        console.log(`  uploaded ${stored.url} (${Math.round(buf.length / 1024)}KB)`);
      } else {
        console.log(`reuse reel for ${product.slug}`);
      }

      await prisma.product.update({
        where: { id: product.id },
        data: {
          videoUrl: urls.videoUrl,
          videoPosterUrl: urls.posterUrl.endsWith(".svg")
            ? null
            : urls.posterUrl,
        },
      });
      ok += 1;
    } catch (e) {
      fail += 1;
      console.error(
        `FAIL ${product.slug}:`,
        e instanceof Error ? e.message : e
      );
    }
  }

  await prisma.$disconnect();
  console.log(`Done. ok=${ok} fail=${fail} uniqueReels=${cache.size}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
