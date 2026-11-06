"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { OrderStatus } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { requireAdmin, OPERATIONS_ROLES } from "@/lib/admin";
import {
  cancelOrderAndRelease,
  FINAL_ORDER_STATUSES,
} from "@/server/services/checkout.service";

const statusSchema = z.enum([
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
]);

export async function updateOrderStatus(orderId: string, formData: FormData) {
  await requireAdmin(OPERATIONS_ROLES);
  const parsed = statusSchema.safeParse(formData.get("status"));
  if (!parsed.success) return;

  const status = parsed.data as OrderStatus;
  const note = String(formData.get("note") ?? "").trim() || null;

  // Cancelling or refunding also gives back reserved stock and the coupon use.
  if (status === "CANCELLED" || status === "REFUNDED") {
    await cancelOrderAndRelease(orderId, note, status);
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    return;
  }

  const data: {
    status: OrderStatus;
    shippedAt?: Date | null;
    deliveredAt?: Date | null;
    cancelledAt?: Date | null;
  } = { status };

  if (status === "SHIPPED") data.shippedAt = new Date();
  if (status === "DELIVERED") data.deliveredAt = new Date();

  // Cancelled/refunded orders are final: their stock and coupon were already
  // released, so reopening them would let a second cancel release them again.
  await prisma.$transaction(async (tx) => {
    const updated = await tx.order.updateMany({
      where: { id: orderId, status: { notIn: FINAL_ORDER_STATUSES } },
      data,
    });
    if (updated.count === 0) return;
    await tx.orderTimeline.create({
      data: { orderId, status, note },
    });
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}
