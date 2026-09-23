"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import {
  loginAction,
  type AuthActionState,
} from "@/features/auth/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/use-translation";
import { guardRequiredForm } from "@/lib/field-shake";
import {
  AuthPageShell,
  authFieldClass,
} from "@/features/auth/components/auth-page-shell";

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const { dict } = useTranslation();
  const [state, formAction, pending] = useActionState<AuthActionState, FormData>(
    loginAction,
    null
  );
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={guardRequiredForm}
      action={formAction}
    >
      <input type="hidden" name="callbackUrl" value={callbackUrl ?? "/account"} />

      <div>
        <Label htmlFor="email">{dict.auth.email}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          className={authFieldClass}
          autoComplete="email"
        />
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-3">
          <Label htmlFor="password">{dict.auth.password}</Label>
          <Link
            href="/forgot-password"
            className="text-xs text-ink-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
          >
            {dict.auth.forgotPassword}
          </Link>
        </div>
        <div className="relative mt-1.5">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            className={`${authFieldClass} mt-0 pr-11`}
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-ink-muted transition-colors hover:text-ink"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden />
            ) : (
              <Eye className="h-4 w-4" aria-hidden />
            )}
          </button>
        </div>
      </div>

      {state?.error ? (
        <p role="alert" className="text-sm text-coral">
          {dict.auth.errors[state.error]}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? dict.auth.signingIn : dict.auth.signIn}
      </Button>

      <p className="pt-1 text-center text-sm text-ink-muted">
        {dict.auth.noAccountYet}{" "}
        <Link
          href="/register"
          className="font-medium text-ink underline-offset-4 hover:underline"
        >
          {dict.auth.createAccount}
        </Link>
      </p>
    </form>
  );
}

export function LoginPageView({ callbackUrl }: { callbackUrl: string }) {
  const { dict } = useTranslation();

  return (
    <AuthPageShell title={dict.auth.welcomeBack} description={dict.auth.signInHint}>
      <LoginForm callbackUrl={callbackUrl} />
    </AuthPageShell>
  );
}
