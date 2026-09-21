"use server";

import { headers } from "next/headers";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/db/prisma";
import { signIn, signOut } from "@/lib/auth";
import { AuthError } from "next-auth";
import { sendPasswordResetEmail } from "@/emails/send";
import { clientIpFromHeaders, rateLimit } from "@/lib/rate-limit";

export type AuthErrorCode =
  | "invalidCredentials"
  | "checkDetails"
  | "emailExists"
  | "createdSignIn"
  | "invalidEmail"
  | "tooManyRequests";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

export async function registerAction(formData: FormData) {
  const h = await headers();
  const ip = clientIpFromHeaders(h);
  if (!rateLimit(`register:${ip}`, 5, 60_000).ok) {
    return { error: "tooManyRequests" as const };
  }

  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
  });
  if (!parsed.success) {
    return { error: "checkDetails" as const };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "emailExists" as const };

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      name: `${parsed.data.firstName} ${parsed.data.lastName}`,
      role: "CUSTOMER",
      wishlist: { create: {} },
      cart: { create: {} },
    },
  });

  const callbackUrl = String(formData.get("callbackUrl") ?? "/account");

  try {
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirectTo: callbackUrl,
    });
  } catch (e) {
    if (e instanceof AuthError) return { error: "createdSignIn" as const };
    throw e;
  }
}

export async function loginAction(formData: FormData) {
  const h = await headers();
  const ip = clientIpFromHeaders(h);
  const email = String(formData.get("email") ?? "").toLowerCase();
  if (!rateLimit(`login:${ip}:${email}`, 10, 60_000).ok) {
    return { error: "tooManyRequests" as const };
  }

  const password = String(formData.get("password") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "/account");

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl,
    });
  } catch (e) {
    // Successful sign-in throws a Next.js redirect — rethrow it.
    if (e instanceof AuthError) {
      return { error: "invalidCredentials" as const };
    }
    throw e;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}

export async function requestPasswordResetAction(formData: FormData) {
  const h = await headers();
  const ip = clientIpFromHeaders(h);
  const email = String(formData.get("email") ?? "").toLowerCase();
  if (!rateLimit(`reset-request:${ip}:${email}`, 3, 60_000).ok) {
    return { error: "tooManyRequests" as const };
  }
  if (!email.includes("@")) return { error: "invalidEmail" as const };

  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    await prisma.passwordResetToken.deleteMany({ where: { email } });
    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 1000 * 60 * 60);
    await prisma.passwordResetToken.create({
      data: { email, token, expires },
    });
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const resetUrl = `${base.replace(/\/$/, "")}/reset-password?token=${token}`;
    try {
      await sendPasswordResetEmail(email, resetUrl);
    } catch {
      // Avoid leaking config errors to the client; still return success shape.
      console.error("[auth] password reset email failed");
    }
  }
  return { success: true as const };
}

export async function resetPasswordAction(formData: FormData) {
  const h = await headers();
  const ip = clientIpFromHeaders(h);
  if (!rateLimit(`reset-complete:${ip}`, 10, 60_000).ok) {
    return { error: "tooManyRequests" as const };
  }

  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (!token) return { error: "invalidToken" as const };
  if (password.length < 8) return { error: "passwordTooShort" as const };
  if (password !== confirm) return { error: "passwordMismatch" as const };

  const record = await prisma.passwordResetToken.findUnique({
    where: { token },
  });
  if (!record || record.expires < new Date()) {
    return { error: "invalidToken" as const };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.$transaction([
    prisma.user.update({
      where: { email: record.email },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.deleteMany({ where: { email: record.email } }),
  ]);

  return { success: true as const };
}
