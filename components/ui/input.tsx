"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { triggerFieldShake } from "@/lib/field-shake";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, onInvalid, onInput, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      "flex h-11 w-full border border-oak/60 bg-bg-muted px-3 py-2 text-sm text-ink placeholder:text-ink-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-coral",
      className
    )}
    ref={ref}
    onInvalid={(e) => {
      e.preventDefault();
      triggerFieldShake(e.currentTarget);
      onInvalid?.(e);
    }}
    onInput={(e) => {
      e.currentTarget.removeAttribute("aria-invalid");
      e.currentTarget.classList.remove("border-coral");
      onInput?.(e);
    }}
    {...props}
  />
));
Input.displayName = "Input";
