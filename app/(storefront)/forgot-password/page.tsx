"use client";

import { useState } from "react";
import {
  requestPasswordResetAction,
  type AuthErrorCode,
} from "@/features/auth/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/use-translation";

export default function ForgotPasswordPage() {
  const { dict } = useTranslation();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<AuthErrorCode | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <div className="container-page flex justify-center py-16">
      <div className="w-full max-w-md border border-oak/40 bg-bg-muted p-8">
        <h1 className="font-serif text-3xl">{dict.auth.resetTitle}</h1>
        <p className="mt-2 text-sm text-ink-muted">{dict.auth.resetHint}</p>
        <form
          className="mt-8 space-y-4"
          action={async (fd) => {
            setPending(true);
            setError(null);
            setMessage(null);
            const res = await requestPasswordResetAction(fd);
            if (res.error) setError(res.error);
            if (res.success) setMessage(dict.auth.resetSuccess);
            setPending(false);
          }}
        >
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
          {error ? (
            <p className="text-sm text-coral">{dict.auth.errors[error]}</p>
          ) : null}
          {message ? (
            <p className="text-sm text-sage-dark">{message}</p>
          ) : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? dict.auth.sending : dict.auth.sendResetLink}
          </Button>
        </form>
      </div>
    </div>
  );
}
