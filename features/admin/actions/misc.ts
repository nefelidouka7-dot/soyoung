"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma, ReviewStatus } from "@prisma/client";
import { prisma } from "@/db/prisma";
import {
  requireAdmin,
  parseStoreDateTime,
  OPERATIONS_ROLES,
  OWNER_ROLES,
} from "@/lib/admin";
import {
  getStoreSettings,
  saveStoreSettings,
} from "@/server/repositories/store-settings.repository";

export async function approveReview(id: string) {
  await requireAdmin();
  await prisma.review.update({
    where: { id },
    data: { status: "APPROVED" satisfies ReviewStatus },
  });
  revalidatePath("/admin/reviews");
}

export async function hideReview(id: string) {
  await requireAdmin();
  await prisma.review.update({
    where: { id },
    data: { status: "HIDDEN" satisfies ReviewStatus },
  });
  revalidatePath("/admin/reviews");
}

export async function deleteReview(id: string) {
  await requireAdmin();
  await prisma.review.delete({ where: { id } });
  revalidatePath("/admin/reviews");
}

const couponSchema = z.object({
  code: z.string().trim().min(1),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.coerce.number().positive(),
  minOrder: z.union([z.coerce.number().nonnegative(), z.literal("")]).optional(),
  maxDiscount: z
    .union([z.coerce.number().nonnegative(), z.literal("")])
    .optional(),
  usageLimit: z.union([z.coerce.number().int().positive(), z.literal("")]).optional(),
  startsAt: z.string().optional(),
  expiresAt: z.string().optional(),
  active: z.boolean().optional(),
});

export type CouponActionState = { error?: string; success?: string };

function optionalNumber(value: FormDataEntryValue | null) {
  if (value == null) return "";
  const s = String(value).trim();
  return s === "" ? "" : s;
}

export async function createCoupon(
  _prev: CouponActionState,
  formData: FormData
): Promise<CouponActionState> {
  await requireAdmin(OPERATIONS_ROLES);
  const parsed = couponSchema.safeParse({
    code: formData.get("code"),
    type: formData.get("type"),
    value: formData.get("value"),
    minOrder: optionalNumber(formData.get("minOrder")),
    maxDiscount: optionalNumber(formData.get("maxDiscount")),
    usageLimit: optionalNumber(formData.get("usageLimit")),
    startsAt: formData.get("startsAt") || undefined,
    expiresAt: formData.get("expiresAt") || undefined,
    active: formData.get("active") === "on" || formData.get("active") === "true",
  });
  if (!parsed.success) return { error: "Έλεγξε τα πεδία του coupon." };

  const {
    code,
    type,
    value,
    minOrder,
    maxDiscount,
    usageLimit,
    startsAt,
    expiresAt,
    active,
  } = parsed.data;

  if (type === "PERCENTAGE" && value > 100) {
    return { error: "Το ποσοστό δεν μπορεί να ξεπερνά το 100." };
  }

  const startsAtDate = startsAt ? parseStoreDateTime(startsAt) : null;
  const expiresAtDate = expiresAt ? parseStoreDateTime(expiresAt) : null;
  if ((startsAt && !startsAtDate) || (expiresAt && !expiresAtDate)) {
    return { error: "Μη έγκυρη ημερομηνία." };
  }
  if (expiresAtDate && expiresAtDate <= new Date()) {
    return { error: "Η ημερομηνία λήξης έχει ήδη περάσει." };
  }
  if (startsAtDate && expiresAtDate && startsAtDate >= expiresAtDate) {
    return { error: "Η έναρξη πρέπει να είναι πριν από τη λήξη." };
  }

  try {
    await prisma.coupon.create({
      data: {
        code: code.trim().toUpperCase(),
        type,
        value,
        minOrderAmount:
          minOrder === "" || minOrder == null ? null : minOrder,
        maxDiscount:
          maxDiscount === "" || maxDiscount == null ? null : maxDiscount,
        usageLimit: usageLimit === "" || usageLimit == null ? null : usageLimit,
        startsAt: startsAtDate,
        expiresAt: expiresAtDate,
        active: active !== false,
      },
    });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return { error: "Υπάρχει ήδη coupon με αυτόν τον κωδικό." };
    }
    console.error("[admin] createCoupon failed", e);
    return { error: "Αποτυχία δημιουργίας coupon. Έλεγξε τα ποσά και δοκίμασε ξανά." };
  }

  revalidatePath("/admin/discounts");
  return { success: `Το coupon ${code.trim().toUpperCase()} δημιουργήθηκε.` };
}

export async function toggleCoupon(id: string, active: boolean) {
  await requireAdmin(OPERATIONS_ROLES);
  await prisma.coupon.update({ where: { id }, data: { active } });
  revalidatePath("/admin/discounts");
}

export async function deleteCoupon(id: string) {
  await requireAdmin(OPERATIONS_ROLES);
  await prisma.coupon.delete({ where: { id } });
  revalidatePath("/admin/discounts");
}

export type StockActionState = {
  error?: string;
  success?: string;
  stock?: number;
  previousStock?: number;
  appliedDelta?: number;
};

export async function adjustStock(
  productId: string,
  _prev: StockActionState,
  formData: FormData
): Promise<StockActionState> {
  await requireAdmin(OPERATIONS_ROLES);
  const raw = String(formData.get("delta") ?? "").trim();
  const delta = Number(raw);
  if (!raw || !Number.isInteger(delta) || delta === 0) {
    return { error: "Βάλε ακέραιο αριθμό διαφορετικό από το 0 (π.χ. +5 ή −2)." };
  }

  const note = String(formData.get("note") ?? "").trim() || null;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Lock the row: a checkout decrementing stock between our read and write
      // would otherwise be overwritten by the absolute value computed here.
      const [product] = await tx.$queryRaw<{ name: string; stock: number }[]>`
        SELECT "name", "stock" FROM "Product" WHERE "id" = ${productId} FOR UPDATE`;
      if (!product) return { error: "Το προϊόν δεν βρέθηκε." } as const;

      const previousStock = product.stock;
      const next = Math.max(0, previousStock + delta);
      const appliedDelta = next - previousStock;

      if (appliedDelta === 0) {
        return {
          error: "Το stock είναι ήδη 0 — δεν μπορεί να μειωθεί άλλο.",
          stock: previousStock,
          previousStock,
        } as const;
      }

      await tx.product.update({
        where: { id: productId },
        data: { stock: { increment: appliedDelta } },
      });
      await tx.inventoryLedger.create({
        data: {
          productId,
          change: appliedDelta,
          type: appliedDelta > 0 ? "RESTOCK" : "ADJUSTMENT",
          note,
        },
      });

      const sign = appliedDelta > 0 ? "+" : "";
      return {
        success: `${product.name}: ${previousStock} → ${next} (${sign}${appliedDelta})`,
        stock: next,
        previousStock,
        appliedDelta,
      } as const;
    });

    if ("error" in result && result.error) {
      return result;
    }

    revalidatePath("/admin/inventory");
    revalidatePath("/admin/products");
    return result;
  } catch {
    return { error: "Κάτι πήγε στραβά. Δοκίμασε ξανά." };
  }
}

export type SettingActionState = { error?: string; success?: string };

export async function saveStoreCommerceSettings(
  _prev: SettingActionState,
  formData: FormData
): Promise<SettingActionState> {
  await requireAdmin(OWNER_ROLES);

  const freeShippingThreshold = Number(formData.get("freeShippingThreshold"));
  const standardShippingFee = Number(formData.get("standardShippingFee"));
  const codFee = Number(formData.get("codFee"));

  if (
    ![freeShippingThreshold, standardShippingFee, codFee].every(
      (n) => Number.isFinite(n) && n >= 0
    )
  ) {
    return { error: "Έλεγξε τα ποσά — πρέπει να είναι αριθμοί ≥ 0." };
  }

  const pickup = {
    name: String(formData.get("pickupName") ?? "").trim(),
    line1: String(formData.get("pickupLine1") ?? "").trim(),
    line2: String(formData.get("pickupLine2") ?? "").trim() || null,
    city: String(formData.get("pickupCity") ?? "").trim(),
    postalCode: String(formData.get("pickupPostalCode") ?? "").trim(),
    country: String(formData.get("pickupCountry") ?? "GR").trim() || "GR",
    phone: String(formData.get("pickupPhone") ?? "").trim(),
  };

  if (!pickup.name || !pickup.line1 || !pickup.city || !pickup.postalCode || !pickup.phone) {
    return {
      error: "Συμπλήρωσε όνομα καταστήματος, διεύθυνση, πόλη, ΤΚ και τηλέφωνο.",
    };
  }

  const current = await getStoreSettings();

  await saveStoreSettings({
    ...current,
    freeShippingThreshold,
    standardShippingFee,
    codFee,
    pickup,
  });

  revalidatePath("/admin/settings");
  revalidatePath("/");
  revalidatePath("/cart");
  revalidatePath("/checkout");
  return { success: "Οι ρυθμίσεις αποθηκεύτηκαν και ισχύουν στο shop." };
}
