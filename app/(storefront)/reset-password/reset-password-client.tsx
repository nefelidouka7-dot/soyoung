"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { resetPasswordAction } from "@/features/auth/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/use-translation";

export default function ResetPasswordClient() {
  const { dict } = useTranslation();
  const searchParams = useSearchParams();
  const token = useMemo(
    () => searchParams.get("token") ?? "",
    [searchParams]
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  if (!token) {
    return (
      <div className="container-page flex justify-center py-16">
        <div className="w-full max-w-md border border-oak/40 bg-bg-muted p-8 text-center">
          <h1 className="font-serif text-3xl">{dict.auth.newPasswordTitle}</h1>
          <p className="mt-3 text-sm text-coral">{dict.auth.invalidResetToken}</p>
          <Link
            href="/forgot-password"
            className="mt-6 inline-block text-sm underline"
          >
            {dict.auth.sendResetLink}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page flex justify-center py-16">
      <div className="w-full max-w-md border border-oak/40 bg-bg-muted p-8">
        <h1 className="font-serif text-3xl">{dict.auth.newPasswordTitle}</h1>
        <p className="mt-2 text-sm text-ink-muted">{dict.auth.newPasswordHint}</p>

        {success ? (
          <div className="mt-8 space-y-4">
            <p className="text-sm text-sage-dark">{dict.auth.passwordUpdated}</p>
            <Link href="/login">
              <Button className="w-full">{dict.auth.signIn}</Button>
            </Link>
          </div>
        ) : (
          <form
            className="mt-8 space-y-4"
            action={async (fd) => {
              setPending(true);
              setError(null);
              fd.set("token", token);
              const res = await resetPasswordAction(fd);
              if (res.error === "invalidToken") {
                setError(dict.auth.invalidResetToken);
              } else if (res.error === "passwordMismatch") {
                setError(dict.auth.passwordMismatch);
              } else if (res.error === "passwordTooShort") {
                setError(dict.auth.passwordTooShort);
              } else if (res.success) {
                setSuccess(true);
              }
              setPending(false);
            }}
          >
            <div>
              <Label htmlFor="password">{dict.auth.newPassword}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">{dict.auth.confirmPassword}</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                className="mt-1.5"
              />
            </div>
            {error ? <p className="text-sm text-coral">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? dict.auth.savingPassword : dict.auth.savePassword}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
