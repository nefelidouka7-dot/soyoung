import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RegisterPageView } from "@/features/auth/components/register-form";
import { auth } from "@/lib/auth";
import { getServerDictionary } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getServerDictionary();
  return { title: dict.auth.createAccount };
}

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/account");

  return <RegisterPageView />;
}
