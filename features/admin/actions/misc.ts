"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ReviewStatus } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { requireAdmin } from "@/lib/admin";

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
  code: z.string().min(1),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.coerce.number().positive(),
  minOrder: z.coerce.number().nonnegative().optional().or(z.literal("")),
  usageLimit: z.coerce.number().int().positive().optional().or(z.literal("")),
  expiresAt: z.string().optional(),
  active: z.coerce.boolean().optional(),
});

export type CouponActionState = { error?: string };

export async function createCoupon(
  _prev: CouponActionState,
  formData: FormData
): Promise<CouponActionState> {
  await requireAdmin();
  const parsed = couponSchema.safeParse({
    code: formData.get("code"),
    type: formData.get("type"),
    value: formData.get("value"),
    minOrder: formData.get("minOrder") || "",
    usageLimit: formData.get("usageLimit") || "",
    expiresAt: formData.get("expiresAt") || undefined,
    active: formData.get("active") === "on" || formData.get("active") === "true",
  });
  if (!parsed.success) return { error: "Please check the coupon fields." };

  const { code, type, value, minOrder, usageLimit, expiresAt, active } = parsed.data;

  try {
    await prisma.coupon.create({
      data: {
        code: code.trim().toUpperCase(),
        type,
        value,
        minOrderAmount:
          minOrder === "" || minOrder == null ? null : minOrder,
        usageLimit: usageLimit === "" || usageLimit == null ? null : usageLimit,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        active: active !== false,
      },
    });
  } catch {
    return { error: "Could not create coupon. Code may already exist." };
  }

  revalidatePath("/admin/discounts");
  return {};
}

export async function toggleCoupon(id: string, active: boolean) {
  await requireAdmin();
  await prisma.coupon.update({ where: { id }, data: { active } });
  revalidatePath("/admin/discounts");
}

export async function deleteCoupon(id: string) {
  await requireAdmin();
  await prisma.coupon.delete({ where: { id } });
  revalidatePath("/admin/discounts");
}

export async function adjustStock(productId: string, formData: FormData) {
  await requireAdmin();
  const delta = Number(formData.get("delta"));
  if (!Number.isInteger(delta) || delta === 0) return;

  const note = String(formData.get("note") ?? "").trim() || null;

  await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: productId } });
    if (!product) throw new Error("Product not found");
    const next = Math.max(0, product.stock + delta);
    await tx.product.update({
      where: { id: productId },
      data: { stock: next },
    });
    await tx.inventoryLedger.create({
      data: {
        productId,
        change: delta,
        type: delta > 0 ? "RESTOCK" : "ADJUSTMENT",
        note,
      },
    });
  });

  revalidatePath("/admin/inventory");
  revalidatePath("/admin/products");
}

const settingSchema = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
});

export type SettingActionState = { error?: string; success?: string };

export async function upsertSiteSetting(
  _prev: SettingActionState,
  formData: FormData
): Promise<SettingActionState> {
  await requireAdmin();
  const parsed = settingSchema.safeParse({
    key: formData.get("key"),
    value: formData.get("value"),
  });
  if (!parsed.success) return { error: "Key and value are required." };

  let value: string | number | boolean | Record<string, unknown> = parsed.data.value;
  try {
    value = JSON.parse(parsed.data.value) as typeof value;
  } catch {
    // store as plain string
  }

  await prisma.siteSetting.upsert({
    where: { key: parsed.data.key.trim() },
    create: { key: parsed.data.key.trim(), value },
    update: { value },
  });

  revalidatePath("/admin/settings");
  return { success: "Setting saved." };
}
