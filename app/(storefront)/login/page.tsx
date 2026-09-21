import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginPageView } from "@/features/auth/components/login-form";
import { auth } from "@/lib/auth";
import { getServerDictionary } from "@/lib/i18n/server";

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
  if (session?.user) redirect(callbackUrl);

  return <LoginPageView callbackUrl={callbackUrl} />;
}
