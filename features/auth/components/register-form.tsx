"use client";

import { useState } from "react";
import Link from "next/link";
import { registerAction, type AuthErrorCode } from "@/features/auth/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/use-translation";

export function RegisterForm() {
  const { dict } = useTranslation();
  const [error, setError] = useState<AuthErrorCode | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="space-y-4"
      action={async (fd) => {
        setPending(true);
        setError(null);
        const res = await registerAction(fd);
        if (res?.error) setError(res.error);
        setPending(false);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="firstName">{dict.auth.firstName}</Label>
          <Input id="firstName" name="firstName" required className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="lastName">{dict.auth.lastName}</Label>
          <Input id="lastName" name="lastName" required className="mt-1.5" />
        </div>
      </div>
      <div>
        <Label htmlFor="email">{dict.auth.email}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          className="mt-1.5"
        />
      </div>
      <div>
        <Label htmlFor="password">{dict.auth.password}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          className="mt-1.5"
        />
        <p className="mt-1 text-xs text-ink-muted">{dict.auth.passwordHint}</p>
      </div>
      {error ? (
        <p className="text-sm text-coral">{dict.auth.errors[error]}</p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? dict.auth.creating : dict.auth.createAccount}
      </Button>
      <p className="text-center text-sm text-ink-muted">
        {dict.auth.alreadyHaveAccount}{" "}
        <Link href="/login" className="underline-offset-4 hover:underline">
          {dict.auth.signIn}
        </Link>
      </p>
    </form>
  );
}

export function RegisterPageView() {
  const { dict } = useTranslation();

  return (
    <div className="container-page flex justify-center py-16">
      <div className="w-full max-w-md border border-oak/40 bg-bg-muted p-8">
        <h1 className="font-serif text-3xl">{dict.auth.createAccountTitle}</h1>
        <p className="mt-2 text-sm text-ink-muted">{dict.auth.createAccountHint}</p>
        <div className="mt-8">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
