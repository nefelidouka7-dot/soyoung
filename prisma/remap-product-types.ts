/**
 * One-shot remap of legacy Product.productType labels to the Soko-inspired
 * taxonomy in lib/catalog-taxonomy.ts. Safe to re-run (idempotent on already
 * remapped values).
 *
 * Usage: npx tsx prisma/remap-product-types.ts
 */
import { PrismaClient } from "@prisma/client";

const REMAP: Record<string, string> = {
  Cleanser: "Water Cleanser",
  Mist: "Facial Mist",
  SPF: "Sunscreen",
  "Eye Care": "Eye Cream",
  Mask: "Wash-off Mask",
  "Hair Mask": "Hair Treatment",
  Treatment: "Acne Treatment",
  Balm: "Moisturizer",
  Oil: "Facial Oil",
  "Night Cream": "Moisturizer",
  "Tinted Moisturizer": "Makeup with SPF",
  Eye: "Eye & Brow",
  "Hand Cream": "Body Lotion",
};

const prisma = new PrismaClient();

async function main() {
  let updated = 0;
  for (const [from, to] of Object.entries(REMAP)) {
    const result = await prisma.product.updateMany({
      where: { productType: from },
      data: { productType: to },
    });
    if (result.count > 0) {
      console.log(`${from} → ${to}: ${result.count}`);
      updated += result.count;
    }
  }
  console.log(`Done. Updated ${updated} products.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
