"use client";

import { useActionState } from "react";
import {
  submitContactAction,
  type ContactActionState,
} from "@/features/contact/actions";

export function ContactForm() {
  const [state, action, pending] = useActionState<ContactActionState, FormData>(
    submitContactAction,
    {}
  );

  return (
    <form action={action} method="post" className="mt-8 max-w-md space-y-4">
      <input
        name="name"
        placeholder="Name"
        className="flex h-11 w-full border border-oak/60 bg-bg-muted px-3 text-sm"
        required
        maxLength={120}
        disabled={pending}
      />
      <input
        name="email"
        type="email"
        placeholder="Email"
        className="flex h-11 w-full border border-oak/60 bg-bg-muted px-3 text-sm"
        required
        maxLength={200}
        disabled={pending}
      />
      <textarea
        name="message"
        placeholder="How can we help?"
        className="min-h-[120px] w-full border border-oak/60 bg-bg-muted px-3 py-2 text-sm"
        required
        maxLength={4000}
        disabled={pending}
      />
      {state.error ? (
        <p className="text-sm text-coral">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-sage">
          Thanks — we received your message and will get back to you soon.
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending || state.success}
        className="h-11 bg-coral px-6 text-xs uppercase tracking-wide font-bold text-white hover:bg-coral-dark disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
