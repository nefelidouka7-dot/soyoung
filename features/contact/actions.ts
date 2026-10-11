"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { clientIpFromHeaders, rateLimit } from "@/lib/rate-limit";

const contactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  message: z.string().trim().min(1).max(4000),
});

export type ContactActionState = {
  error?: string;
  success?: boolean;
};

export async function submitContactAction(
  _prev: ContactActionState,
  formData: FormData
): Promise<ContactActionState> {
  const h = await headers();
  const ip = clientIpFromHeaders(h);
  if (!rateLimit(`contact:${ip}`, 5, 60_000).ok) {
    return { error: "Too many messages. Please wait a moment." };
  }

  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
  });
  if (!parsed.success) {
    return { error: "Please complete all fields correctly." };
  }

  // No mailbox wired yet — log server-side only (never echo into URLs).
  console.info("[contact]", {
    name: parsed.data.name,
    email: parsed.data.email,
    messageLength: parsed.data.message.length,
  });

  return { success: true };
}
