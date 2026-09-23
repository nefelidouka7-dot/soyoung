"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/db/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateAccountDetails(formData: FormData) {
  const session = await auth();
  if (!session?.user) return;

  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      firstName,
      lastName,
      phone: phone || null,
      name: `${firstName} ${lastName}`.trim(),
    },
  });

  revalidatePath("/account");
  revalidatePath("/account/details");
  redirect("/account/details?saved=1");
}
