"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import {
  registerAction,
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

export function RegisterForm() {
  const { dict } = useTranslation();
  const [state, formAction, pending] = useActionState<AuthActionState, FormData>(
    registerAction,
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
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="firstName">{dict.auth.firstName}</Label>
          <Input
            id="firstName"
            name="firstName"
            required
            className={authFieldClass}
            autoComplete="given-name"
          />
        </div>
        <div>
          <Label htmlFor="lastName">{dict.auth.lastName}</Label>
          <Input
            id="lastName"
            name="lastName"
            required
            className={authFieldClass}
            autoComplete="family-name"
          />
        </div>
      </div>

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
        <Label htmlFor="password">{dict.auth.password}</Label>
        <div className="relative mt-1.5">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            className={`${authFieldClass} mt-0 pr-11`}
            autoComplete="new-password"
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
        <p className="mt-1.5 text-xs text-ink-muted">{dict.auth.passwordHint}</p>
      </div>

      {state?.error ? (
        <p role="alert" className="text-sm text-coral">
          {dict.auth.errors[state.error]}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? dict.auth.creating : dict.auth.createAccount}
      </Button>

      <p className="pt-1 text-center text-sm text-ink-muted">
        {dict.auth.alreadyHaveAccount}{" "}
        <Link
          href="/login"
          className="font-medium text-ink underline-offset-4 hover:underline"
        >
          {dict.auth.signIn}
        </Link>
      </p>
    </form>
  );
}

export function RegisterPageView() {
  const { dict } = useTranslation();

  return (
    <AuthPageShell
      title={dict.auth.createAccountTitle}
      description={dict.auth.createAccountHint}
    >
      <RegisterForm />
    </AuthPageShell>
  );
}
