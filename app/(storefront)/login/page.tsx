import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginPageView } from "@/features/auth/components/login-form";
import { auth } from "@/lib/auth";
import { getServerDictionary } from "@/lib/i18n/server";
import type { Role } from "@prisma/client";

const ADMIN_ROLES: Role[] = ["ADMIN", "SUPER_ADMIN", "MANAGER", "EDITOR"];

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getServerDictionary();
  return { title: dict.auth.signIn };
}

function safeCallbackUrl(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/account";
  }
  return value;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const callbackUrl = safeCallbackUrl(
    typeof sp.callbackUrl === "string" ? sp.callbackUrl : undefined
  );

  const session = await auth();
  const userId = session?.user?.id;
  const role = session?.user?.role;

  if (userId) {
    if (callbackUrl.startsWith("/admin")) {
      if (role && ADMIN_ROLES.includes(role)) redirect(callbackUrl);
      redirect("/account");
    }
    redirect(callbackUrl);
  }

  return <LoginPageView callbackUrl={callbackUrl} />;
}
