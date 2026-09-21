"use client";

import { useState } from "react";
import Link from "next/link";
import { loginAction, type AuthErrorCode } from "@/features/auth/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/use-translation";

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const { dict } = useTranslation();
  const [error, setError] = useState<AuthErrorCode | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="space-y-4"
      action={async (fd) => {
        setPending(true);
        setError(null);
        const res = await loginAction(fd);
        if (res?.error) setError(res.error);
        setPending(false);
      }}
    >
      <input type="hidden" name="callbackUrl" value={callbackUrl ?? "/account"} />
      <div>
        <Label htmlFor="email">{dict.auth.email}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          className="mt-1.5"
          autoComplete="email"
        />
      </div>
      <div>
        <Label htmlFor="password">{dict.auth.password}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          className="mt-1.5"
          autoComplete="current-password"
        />
      </div>
      {error ? (
        <p className="text-sm text-coral">{dict.auth.errors[error]}</p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? dict.auth.signingIn : dict.auth.signIn}
      </Button>
      <p className="text-center text-sm text-ink-muted">
        <Link
          href="/forgot-password"
          className="underline-offset-4 hover:underline"
        >
          {dict.auth.forgotPassword}
        </Link>
        {" · "}
        <Link href="/register" className="underline-offset-4 hover:underline">
          {dict.auth.createAccount}
        </Link>
      </p>
    </form>
  );
}

export function LoginPageView({ callbackUrl }: { callbackUrl: string }) {
  const { dict } = useTranslation();

  return (
    <div className="container-page flex justify-center py-16">
      <div className="w-full max-w-md border border-oak/40 bg-bg-muted p-8">
        <h1 className="font-serif text-3xl">{dict.auth.welcomeBack}</h1>
        <p className="mt-2 text-sm text-ink-muted">{dict.auth.signInHint}</p>
        <div className="mt-8">
          <LoginForm callbackUrl={callbackUrl} />
        </div>
      </div>
    </div>
  );
}
