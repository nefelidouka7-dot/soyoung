"use server";

import { z } from "zod";
import { prisma } from "@/db/prisma";
import { clientIpFromHeaders, rateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";

const emailSchema = z.string().trim().email().max(254);

export async function subscribeNewsletterAction(emailRaw: string) {
  const h = await headers();
  const ip = clientIpFromHeaders(h);
  const limited = rateLimit(`newsletter:${ip}`, 8, 60_000);
  if (!limited.ok) {
    return { ok: false as const, error: "rateLimited" as const };
  }

  const parsed = emailSchema.safeParse(emailRaw);
  if (!parsed.success) {
    return { ok: false as const, error: "invalidEmail" as const };
  }

  const email = parsed.data.toLowerCase();

  try {
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (existing?.active) {
      return { ok: false as const, error: "alreadySubscribed" as const };
    }

    if (existing && !existing.active) {
      await prisma.newsletterSubscriber.update({
        where: { email },
        data: { active: true },
      });
      return { ok: true as const };
    }

    await prisma.newsletterSubscriber.create({
      data: { email },
    });
    return { ok: true as const };
  } catch (e) {
    // Unique race: treat as already on the list
    if (
      e &&
      typeof e === "object" &&
      "code" in e &&
      (e as { code?: string }).code === "P2002"
    ) {
      return { ok: false as const, error: "alreadySubscribed" as const };
    }
    console.error("[newsletter] subscribe failed", e);
    return { ok: false as const, error: "failed" as const };
  }
}
