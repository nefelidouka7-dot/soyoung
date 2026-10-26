"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { OrderStatus } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { requireAdmin, OPERATIONS_ROLES } from "@/lib/admin";
import { cancelOrderAndRelease } from "@/server/services/checkout.service";

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

  // Cancelling also gives back reserved stock and the coupon use.
  if (status === "CANCELLED") {
    await cancelOrderAndRelease(orderId, note);
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

  await prisma.$transaction([
    prisma.order.update({ where: { id: orderId }, data }),
    prisma.orderTimeline.create({
      data: { orderId, status, note },
    }),
  ]);

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}
